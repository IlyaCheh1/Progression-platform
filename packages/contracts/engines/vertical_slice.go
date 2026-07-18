package engines

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"

	"github.com/masterofsword/contracts/envelope"
	"github.com/masterofsword/contracts/mastery"
	"github.com/masterofsword/contracts/outbox"
	"github.com/masterofsword/contracts/progression"
)

const (
	TenantDemo = "tenant.school.fencing.demo"
	RealmKey   = "school.fencing"

	// Temporary local roles until OnlyID + RBAC land.
	RoleStudent       = "student"
	RolePlatformAdmin = "platform_admin"
)

// Character is a platform Character (not a school Student).
type Character struct {
	ID       string `json:"id"`
	UserID   string `json:"userId"`
	TenantID string `json:"tenantId"`
	XP       int64  `json:"xp"`
	Level    int    `json:"level"`
	Version  int64  `json:"version"`
}

// Student links school identity to optional Character.
type Student struct {
	ID          string           `json:"id"`
	DisplayName string           `json:"displayName"`
	UserID      string           `json:"userId"`
	CharacterID string           `json:"characterId"`
	Login       string           `json:"login"`
	Password    string           `json:"password,omitempty"`
	Role        string           `json:"role"`
	Mastery     map[string]int64 `json:"mastery"` // weaponKey -> units
	Ranks       map[string]int   `json:"ranks"`
}

// NormalizedRole returns a concrete role for auth checks.
func (s *Student) NormalizedRole() string {
	if s == nil || s.Role == "" {
		return RoleStudent
	}
	return s.Role
}

// IsPlatformAdmin reports whether the principal may use school admin + content authoring.
func (s *Student) IsPlatformAdmin() bool {
	return s != nil && s.NormalizedRole() == RolePlatformAdmin
}

type Platform struct {
	mu         sync.Mutex
	track      progression.Track
	outbox     *outbox.MemoryStore
	inboxSeen  map[string]struct{}
	characters map[string]*Character
	students   map[string]*Student
	users      map[string]*Student // login -> student
	sessions   map[string]string   // opaque access token -> studentID
	audit      []string
}

func NewPlatform() *Platform {
	return &Platform{
		track:      progression.Standard100(),
		outbox:     outbox.NewMemoryStore(),
		inboxSeen:  make(map[string]struct{}),
		characters: make(map[string]*Character),
		students:   make(map[string]*Student),
		users:      make(map[string]*Student),
		sessions:   make(map[string]string),
	}
}

func (p *Platform) CreateCharacter(id, userID string) (*Character, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if _, ok := p.characters[id]; ok {
		return nil, fmt.Errorf("character exists")
	}
	c := &Character{ID: id, UserID: userID, TenantID: TenantDemo, XP: 0, Level: 1, Version: 1}
	p.characters[id] = c
	ev := envelope.NewEvent("character.created.v1", "platform-character", TenantDemo, RealmKey, "Character", id, "character:"+id+":create", 1, map[string]any{"userId": userID})
	_, _ = p.outbox.Append(ev)
	return c, nil
}

func (p *Platform) UpsertStudent(s Student) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if s.Mastery == nil {
		s.Mastery = map[string]int64{}
	}
	if s.Ranks == nil {
		s.Ranks = map[string]int{}
	}
	if s.Role == "" {
		s.Role = RoleStudent
	}
	cp := s
	p.students[s.ID] = &cp
	if s.Login != "" {
		p.users[s.Login] = &cp
	}
}

func (p *Platform) Authenticate(login, password string) (*Student, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	s, ok := p.users[login]
	if !ok || s.Password != password {
		return nil, false
	}
	return s, true
}

// IssueAccessToken creates a random opaque session token after successful login.
func (p *Platform) IssueAccessToken(studentID string) (string, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if _, ok := p.students[studentID]; !ok {
		return "", fmt.Errorf("student not found")
	}
	var buf [32]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return "", err
	}
	token := hex.EncodeToString(buf[:])
	p.sessions[token] = studentID
	return token, nil
}

// ResolveAccessToken maps opaque session tokens to a principal.
func (p *Platform) ResolveAccessToken(token string) (*Student, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if token == "" {
		return nil, false
	}
	id, ok := p.sessions[token]
	if !ok {
		return nil, false
	}
	s, ok := p.students[id]
	return s, ok
}

func (p *Platform) GetStudent(id string) (*Student, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	s, ok := p.students[id]
	return s, ok
}

func (p *Platform) ListStudents() []*Student {
	p.mu.Lock()
	defer p.mu.Unlock()
	out := make([]*Student, 0, len(p.students))
	for _, s := range p.students {
		out = append(out, s)
	}
	return out
}

func (p *Platform) GetCharacter(id string) (*Character, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	c, ok := p.characters[id]
	return c, ok
}

// RecordAttendance confirms attendance and grants XP via Reward path (exactly-once by idempotencyKey).
func (p *Platform) RecordAttendance(characterID, attendanceID string, xp int64) (level int, granted bool, err error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	c, ok := p.characters[characterID]
	if !ok {
		return 0, false, fmt.Errorf("character not found")
	}
	idem := "attendance:" + attendanceID + ":reward"
	ev := envelope.NewEvent("school.training.attendance.recorded.v1", "school-training", TenantDemo, RealmKey, "Attendance", attendanceID, idem, 1, map[string]any{
		"characterId": characterID,
		"xp":          xp,
	})
	appended, err := p.outbox.Append(ev)
	if err != nil {
		return 0, false, err
	}
	if !appended {
		return c.Level, false, nil
	}
	// Reward engine fulfillment request -> Progression (same process for MVP modular monolith slice)
	if _, seen := p.inboxSeen[idem]; seen {
		return c.Level, false, nil
	}
	p.inboxSeen[idem] = struct{}{}
	newXP, err := progression.GrantXP(c.XP, xp)
	if err != nil {
		return 0, false, err
	}
	oldLevel := c.Level
	c.XP = newXP
	c.Level = p.track.LevelForXP(newXP)
	c.Version++
	p.audit = append(p.audit, fmt.Sprintf("reward.grant attendance=%s xp=%d level %d->%d", attendanceID, xp, oldLevel, c.Level))
	if c.Level != oldLevel {
		levEv := envelope.NewEvent("progression.level.changed.v1", "platform-progression", TenantDemo, RealmKey, "Character", characterID, "level:"+characterID+":"+fmt.Sprint(c.Level), c.Version, map[string]any{
			"level": c.Level,
			"xp":    c.XP,
		})
		_, _ = p.outbox.Append(levEv)
	}
	return c.Level, true, nil
}

// ApplyMasterySnapshot sets legacy mastery units for a weapon.
func (p *Platform) ApplyMasterySnapshot(studentID, weaponAlias string, points float64) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	s, ok := p.students[studentID]
	if !ok {
		return fmt.Errorf("student not found")
	}
	key, ok := mastery.AliasMap[weaponAlias]
	if !ok {
		key = weaponAlias
	}
	if err := mastery.ValidateNonFloatAuthoritative(points); err != nil {
		return err
	}
	units := mastery.PointsToUnits(points)
	s.Mastery[key] = units
	s.Ranks[key] = mastery.RankFromUnits(units)
	return nil
}

func (p *Platform) ApplyTrainingAllocation(studentID, primaryWeapon string, totalUnits int64, paired bool) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	s, ok := p.students[studentID]
	if !ok {
		return fmt.Errorf("student not found")
	}
	if paired {
		prim, sec := mastery.AllocatePair(totalUnits)
		s.Mastery[primaryWeapon] += prim
		// secondary one-handed sword share
		s.Mastery["spada_a_uno_mano"] += sec
		s.Ranks[primaryWeapon] = mastery.RankFromUnits(s.Mastery[primaryWeapon])
		s.Ranks["spada_a_uno_mano"] = mastery.RankFromUnits(s.Mastery["spada_a_uno_mano"])
		return nil
	}
	s.Mastery[primaryWeapon] += totalUnits
	s.Ranks[primaryWeapon] = mastery.RankFromUnits(s.Mastery[primaryWeapon])
	return nil
}

func (p *Platform) OutboxLen() int { return p.outbox.Len() }

func (p *Platform) Audit() []string {
	p.mu.Lock()
	defer p.mu.Unlock()
	return append([]string{}, p.audit...)
}
