package seed

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/masterofsword/contracts/engines"
)

type fileShape struct {
	Accounts []struct {
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
	} `json:"accounts"`
}

func rosterCandidates(root string) []string {
	return []string{
		filepath.Join(root, "infra", "local", "seed", "students.json"),
		// Legacy filename kept as one-release fallback for local checkouts.
		filepath.Join(root, "infra", "local", "seed", "demo-students.json"),
	}
}

// LoadRoster loads the production school roster (Excel students + service accounts).
func LoadRoster(p *engines.Platform, root string) (int, error) {
	var lastErr error
	for _, path := range rosterCandidates(root) {
		b, err := os.ReadFile(path)
		if err != nil {
			lastErr = err
			continue
		}
		var data fileShape
		if err := json.Unmarshal(b, &data); err != nil {
			return 0, err
		}
		for _, a := range data.Accounts {
			if _, err := p.CreateCharacter(a.CharacterID, "user-"+a.StudentID); err != nil {
				// already exists on reload — ignore
			}
			role := a.Role
			if role == "" {
				role = engines.RoleStudent
			}
			st := engines.Student{
				ID:          a.StudentID,
				DisplayName: a.Name,
				UserID:      "user-" + a.StudentID,
				CharacterID: a.CharacterID,
				Login:       a.Login,
				Password:    a.Password,
				Role:        role,
				Roles:       append([]string(nil), a.Roles...),
				Mastery:     map[string]int64{},
				Ranks:       map[string]int{},
			}
			if len(st.Roles) == 0 && st.Role != "" {
				st.Roles = []string{st.Role}
			}
			for k, v := range a.MasteryUnits {
				st.Mastery[k] = v
			}
			for k, v := range a.Ranks {
				st.Ranks[k] = v
			}
			p.UpsertStudent(st)
			for alias, pts := range a.Mastery {
				_ = p.ApplyMasterySnapshot(a.StudentID, alias, pts)
			}
		}
		return len(data.Accounts), nil
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("roster file not found")
	}
	return 0, lastErr
}

// WireServiceRelations links guardian/minor service accounts after roster load.
func WireServiceRelations(p *engines.Platform) {
	_ = p.LinkGuardian("demo-guardian", "student-synthetic-adult")
	if p.School != nil {
		p.School.SetMinor("student-temp-local", true)
	}
}

func FindRoot() string {
	wd, _ := os.Getwd()
	for d := wd; d != filepath.Dir(d); d = filepath.Dir(d) {
		if _, err := os.Stat(filepath.Join(d, "015-platform-development-agent-spec.md")); err == nil {
			return d
		}
	}
	return wd
}

// MustLoad loads the roster unconditionally (local / empty platform).
func MustLoad(p *engines.Platform) {
	n, err := LoadRoster(p, FindRoot())
	if err != nil {
		fmt.Fprintf(os.Stderr, "seed warning: %v\n", err)
		return
	}
	fmt.Printf("loaded %d roster students\n", n)
	WireServiceRelations(p)
}

// MustLoadIfEmpty seeds only when the platform has no students (bootstrap after empty DB).
func MustLoadIfEmpty(p *engines.Platform) {
	if len(p.ListStudents()) > 0 {
		fmt.Printf("skip seed: platform already has %d students\n", len(p.ListStudents()))
		return
	}
	MustLoad(p)
}
