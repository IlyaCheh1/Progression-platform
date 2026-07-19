package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode"

	"github.com/masterofsword/contracts/engines"
	"github.com/masterofsword/contracts/mastery"
	"github.com/xuri/excelize/v2"
	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

type rosterAccount struct {
	StudentID    string             `json:"studentId"`
	Name         string             `json:"name"`
	Login        string             `json:"login"`
	Password     string             `json:"password"`
	Role         string             `json:"role"`
	Roles        []string           `json:"roles"`
	CharacterID  string             `json:"characterId"`
	Mastery      map[string]float64 `json:"masteryPointsAsOf"`
	MasteryUnits map[string]int64   `json:"masteryUnits"`
	Ranks        map[string]int     `json:"ranks"`
}

// Staff roles for known Excel accounts (production).
var staffRoleOverrides = map[string][]string{
	"student-maks-kiselev":      {"administrator", "coach"},
	"student-tatyana-gribanova": {"administrator", "coach"},
	"student-nikolay-lobaev":    {"student", "coach"},
}

func applyRoles(acc *rosterAccount) {
	if roles, ok := staffRoleOverrides[acc.StudentID]; ok {
		acc.Roles = append([]string(nil), roles...)
		acc.Role = roles[0]
		return
	}
	if acc.Role == "" {
		acc.Role = "student"
	}
	if len(acc.Roles) == 0 {
		acc.Roles = []string{acc.Role}
	}
}

func main() {
	root := findRoot()
	xlsx := filepath.Join(root, "Master of the Sword module", "Old", "Мастер Меча.xlsx")
	if _, err := os.Stat(xlsx); err != nil {
		// fallback: any large xlsx in Old
		entries, _ := os.ReadDir(filepath.Join(root, "Master of the Sword module", "Old"))
		for _, e := range entries {
			if strings.HasSuffix(strings.ToLower(e.Name()), ".xlsx") && !strings.HasPrefix(e.Name(), "~") {
				candidate := filepath.Join(root, "Master of the Sword module", "Old", e.Name())
				if info, err := os.Stat(candidate); err == nil && info.Size() > 400000 {
					xlsx = candidate
					break
				}
			}
		}
	}

	hash, err := fileSHA(xlsx)
	if err != nil {
		fatal(err)
	}
	asOf := time.Now().In(time.FixedZone("MSK", 3*3600))
	asOfDay := time.Date(asOf.Year(), asOf.Month(), asOf.Day(), 0, 0, 0, 0, asOf.Location())

	f, err := excelize.OpenFile(xlsx)
	if err != nil {
		fatal(err)
	}
	defer f.Close()

	sheet := pickMonthSheet(f, int(asOf.Month()))
	rows, err := f.GetRows(sheet)
	if err != nil {
		fatal(err)
	}

	dayCols := map[int]int{} // day -> 0-based col
	headerRow := -1
	for ri, row := range rows {
		if ri > 10 {
			break
		}
		for ci, cell := range row {
			t, err := time.Parse("2006-01-02", strings.TrimSpace(cell))
			if err != nil {
				// excel may already be serialized differently; try RFC
				t2, err2 := time.Parse(time.RFC3339, strings.TrimSpace(cell))
				if err2 != nil {
					continue
				}
				t = t2
			}
			if t.Month() == asOf.Month() {
				dayCols[t.Day()] = ci
				headerRow = ri
			}
		}
		if len(dayCols) > 0 {
			break
		}
	}
	// Also parse date serial-like headers from excelize as already string dates
	if headerRow < 0 {
		for ri, row := range rows {
			for ci, cell := range row {
				if ts, ok := parseFlexibleDate(cell); ok && int(ts.Month()) == int(asOf.Month()) {
					dayCols[ts.Day()] = ci
					headerRow = ri
				}
			}
			if len(dayCols) > 5 {
				break
			}
		}
	}

	weaponSet := map[string]bool{}
	for k := range mastery.AliasMap {
		weaponSet[strings.ToLower(k)] = true
	}

	var accounts []rosterAccount
	p := engines.NewPlatform()
	seenHashFile := filepath.Join(root, "infra", "local", "import-state.json")
	if sameHash(seenHashFile, hash) {
		fmt.Println("idempotent: same source hash, regenerating roster docs only")
	}

	for ri := 0; ri < len(rows); ri++ {
		row := rows[ri]
		if len(row) == 0 || strings.TrimSpace(row[0]) == "" {
			continue
		}
		name := strings.TrimSpace(row[0])
		if weaponSet[strings.ToLower(name)] {
			continue
		}
		// look ahead for weapons
		hasWeapon := false
		for rj := ri + 1; rj < len(rows) && rj <= ri+4; rj++ {
			if len(rows[rj]) > 0 && weaponSet[strings.ToLower(strings.TrimSpace(rows[rj][0]))] {
				hasWeapon = true
				break
			}
		}
		if !hasWeapon {
			continue
		}

		points := map[string]float64{}
		rj := ri + 1
		for rj < len(rows) {
			if len(rows[rj]) == 0 || strings.TrimSpace(rows[rj][0]) == "" {
				rj++
				if rj < len(rows) && len(rows[rj]) > 0 && weaponSet[strings.ToLower(strings.TrimSpace(rows[rj][0]))] {
					continue
				}
				break
			}
			wname := strings.TrimSpace(rows[rj][0])
			if !weaponSet[strings.ToLower(wname)] {
				break
			}
			opening := parseFloat(cellAt(rows[rj], 1))
			sum := opening
			for d := 1; d <= asOfDay.Day(); d++ {
				ci, ok := dayCols[d]
				if !ok {
					continue
				}
				sum += parseFloat(cellAt(rows[rj], ci))
			}
			points[wname] = sum
			rj += 2
		}
		ri = rj - 1

		slug := slugify(name)
		login := fmt.Sprintf("%s@mastersword.ru", slug)
		first := strings.Split(slug, "-")[0]
		pass := first + "123"
		sid := "student-" + slug
		cid := "char-" + slug
		acc := rosterAccount{
			StudentID:    sid,
			Name:         name,
			Login:        login,
			Password:     pass,
			CharacterID:  cid,
			Mastery:      points,
			MasteryUnits: map[string]int64{},
			Ranks:        map[string]int{},
		}
		applyRoles(&acc)
		_, _ = p.CreateCharacter(cid, "user-"+slug)
		st := engines.Student{
			ID: sid, DisplayName: name, UserID: "user-" + slug, CharacterID: cid,
			Login: login, Password: pass, Role: acc.Role, Roles: append([]string(nil), acc.Roles...),
			Mastery: map[string]int64{}, Ranks: map[string]int{},
		}
		p.UpsertStudent(st)
		for alias, pts := range points {
			_ = p.ApplyMasterySnapshot(sid, alias, pts)
			key := mastery.AliasMap[strings.ToLower(alias)]
			if key == "" {
				key = alias
			}
			acc.MasteryUnits[key] = mastery.PointsToUnits(pts)
			acc.Ranks[key] = mastery.RankFromUnits(acc.MasteryUnits[key])
		}
		accounts = append(accounts, acc)
	}

	// Service accounts (stable IDs — do not rename; already in production DB).
	service := []rosterAccount{
		{StudentID: "student-synthetic-adult", Name: "Взрослый ученик", Login: "adult@mastersword.ru", Password: "adult123", Role: "student", Roles: []string{"student"}, CharacterID: "char-synthetic-adult"},
		{StudentID: "student-temp-local", Name: "Локальный ученик", Login: "student@mastersword.ru", Password: "student123", Role: "student", Roles: []string{"student"}, CharacterID: "char-temp-local"},
		{StudentID: "admin-platform", Name: "Администратор платформы", Login: "admin@mastersword.ru", Password: "admin123", Role: "administrator", Roles: []string{"administrator"}, CharacterID: "char-platform-admin"},
		{StudentID: "demo-guardian", Name: "Опекун", Login: "guardian@mastersword.ru", Password: "guardian123", Role: "guardian", Roles: []string{"guardian"}, CharacterID: "char-demo-guardian"},
		{StudentID: "demo-coach", Name: "Тренер", Login: "coach@mastersword.ru", Password: "coach123", Role: "coach", Roles: []string{"coach"}, CharacterID: "char-demo-coach"},
		{StudentID: "demo-renter", Name: "Арендатор", Login: "renter@mastersword.ru", Password: "renter123", Role: "renter", Roles: []string{"renter"}, CharacterID: "char-demo-renter"},
	}
	for _, acc := range service {
		if acc.Mastery == nil {
			acc.Mastery = map[string]float64{}
		}
		if acc.MasteryUnits == nil {
			acc.MasteryUnits = map[string]int64{}
		}
		if acc.Ranks == nil {
			acc.Ranks = map[string]int{}
		}
		accounts = append(accounts, acc)
	}

	outDir := filepath.Join(root, "infra", "local", "seed")
	_ = os.MkdirAll(outDir, 0o755)
	raw, _ := json.MarshalIndent(map[string]any{
		"kind":       "production-roster",
		"source":     filepath.Base(xlsx),
		"sourceHash": hash,
		"asOf":       asOfDay.Format("2006-01-02"),
		"sheet":      sheet,
		"count":      len(accounts),
		"accounts":   accounts,
	}, "", "  ")
	_ = os.WriteFile(filepath.Join(outDir, "students.json"), raw, 0o644)
	_ = os.WriteFile(seenHashFile, []byte(`{"hash":"`+hash+`"}`), 0o644)

	var md strings.Builder
	md.WriteString("# School accounts (production roster)\n\n")
	md.WriteString(fmt.Sprintf("Source: `%s` hash `%s` as-of `%s`\n\n", filepath.Base(xlsx), hash[:12], asOfDay.Format("2006-01-02")))
	md.WriteString("Initial passwords — change after first login in production.\n\n")
	md.WriteString("| Name | Role | Login | Password |\n|---|---|---|---|\n")
	for _, a := range accounts {
		role := a.Role
		if len(a.Roles) > 0 {
			role = strings.Join(a.Roles, ", ")
		}
		md.WriteString(fmt.Sprintf("| %s | %s | `%s` | `%s` |\n", a.Name, role, a.Login, a.Password))
	}
	_ = os.WriteFile(filepath.Join(root, "docs", "accounts.md"), []byte(md.String()), 0o644)
	fmt.Printf("seeded %d accounts -> infra/local/seed/students.json and docs/accounts.md\n", len(accounts))
}

func pickMonthSheet(f *excelize.File, month int) string {
	months := []string{"январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"}
	want := months[month-1]
	for _, s := range f.GetSheetList() {
		if strings.EqualFold(strings.TrimSpace(s), want) {
			return s
		}
	}
	list := f.GetSheetList()
	if month-1 < len(list) {
		return list[month-1]
	}
	return list[0]
}

func cellAt(row []string, i int) string {
	if i < 0 || i >= len(row) {
		return ""
	}
	return row[i]
}

func parseFloat(s string) float64 {
	s = strings.TrimSpace(strings.ReplaceAll(s, ",", "."))
	if s == "" {
		return 0
	}
	var v float64
	_, _ = fmt.Sscanf(s, "%f", &v)
	return v
}

func parseFlexibleDate(s string) (time.Time, bool) {
	s = strings.TrimSpace(s)
	for _, layout := range []string{time.RFC3339, "2006-01-02", "2006-01-02 15:04:05", "01-02-06"} {
		if t, err := time.Parse(layout, s); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

func slugify(name string) string {
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	s, _, _ := transform.String(t, strings.ToLower(name))
	repl := map[string]string{"а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e", "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya"}
	var b strings.Builder
	for _, r := range s {
		ch := string(r)
		if v, ok := repl[ch]; ok {
			b.WriteString(v)
			continue
		}
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		} else {
			b.WriteByte('-')
		}
	}
	re := regexp.MustCompile(`-+`)
	out := re.ReplaceAllString(strings.Trim(b.String(), "-"), "-")
	if out == "" {
		out = "student"
	}
	return out
}

func fileSHA(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func sameHash(statePath, hash string) bool {
	b, err := os.ReadFile(statePath)
	if err != nil {
		return false
	}
	return strings.Contains(string(b), hash)
}

func findRoot() string {
	wd, _ := os.Getwd()
	for d := wd; d != filepath.Dir(d); d = filepath.Dir(d) {
		if _, err := os.Stat(filepath.Join(d, "015-platform-development-agent-spec.md")); err == nil {
			return d
		}
	}
	return wd
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}
