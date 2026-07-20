package engines

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/masterofsword/contracts/envelope"
	"github.com/masterofsword/contracts/mastery"
	"github.com/masterofsword/contracts/outbox"
	"github.com/masterofsword/contracts/progression"
	"github.com/masterofsword/contracts/rbac"
)

// AccessTokenTTL is how long a school login session remains valid.
const AccessTokenTTL = 30 * 24 * time.Hour

// AccessTokenSession is an opaque bearer session issued after password/OnlyID login.
type AccessTokenSession struct {
	StudentID string    `json:"studentId"`
	ExpiresAt time.Time `json:"expiresAt"`
}

const (
	TenantDemo = "tenant.school.fencing.demo"
	RealmKey   = "school.fencing"

	RoleStudent       = rbac.RoleStudent
	RoleGuardian      = rbac.RoleGuardian
	RoleCoach         = rbac.RoleCoach
	RoleRenter        = rbac.RoleRenter
	RoleAdministrator = rbac.RoleAdministrator
	RolePlatformAdmin = rbac.RolePlatformAdmin
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
	ID              string           `json:"id"`
	DisplayName     string           `json:"displayName"`
	UserID          string           `json:"userId"`
	CharacterID     string           `json:"characterId"`
	Login           string           `json:"login"`
	Password        string           `json:"password,omitempty"`
	Role            string           `json:"role"`
	Roles           []string         `json:"roles,omitempty"`
	Mastery         map[string]int64 `json:"mastery"` // weaponKey -> units
	Ranks           map[string]int   `json:"ranks"`
	ProfileComplete bool             `json:"profileComplete"`
	ProfileUsername string           `json:"profileUsername,omitempty"`
	SelectedSkinID  string           `json:"selectedSkinId,omitempty"`
	Skin            string           `json:"skin,omitempty"` // legacy MoS skins, migrated to selectedSkinId
	Gender          string           `json:"gender,omitempty"`
	BackgroundKey    string `json:"backgroundKey,omitempty"`
	AvatarURL        string `json:"avatarUrl,omitempty"`
	EquippedTitleKey string `json:"equippedTitleKey,omitempty"`
}

// NormalizedRole returns the primary role for routing/display.
func (s *Student) NormalizedRole() string {
	if s == nil {
		return RoleStudent
	}
	if len(s.Roles) > 0 {
		return rbac.PrimaryRole(s.Roles)
	}
	return rbac.NormalizeRole(s.Role)
}

// IsPlatformAdmin reports admin access (administrator or platform_admin).
func (s *Student) IsPlatformAdmin() bool {
	return s != nil && rbac.IsAdministratorInRoles(s.RolesList())
}

// HasPermission checks RBAC across all assigned roles.
func (s *Student) HasPermission(perm rbac.Permission) bool {
	return s != nil && rbac.HasPermissionForRoles(s.RolesList(), perm)
}

type Platform struct {
	mu         sync.Mutex
	track      progression.Track
	outbox     *outbox.MemoryStore
	inboxSeen  map[string]struct{}
	characters map[string]*Character
	students   map[string]*Student
	users      map[string]*Student // login -> student
	sessions   map[string]AccessTokenSession // opaque access token -> session
	// holdings: studentID -> itemKey -> cosmetic holding (characters + backgrounds + titles)
	holdings map[string]map[string]InventoryHolding
	guardianLinks map[string][]string // guardianID -> dependant student IDs
	supportCases  map[string]*SupportCase
	assetRevisions map[string]*AssetRevision
	audit    []string
	School   *SchoolModule
}

func NewPlatform() *Platform {
	p := &Platform{
		track:      progression.Standard100(),
		outbox:     outbox.NewMemoryStore(),
		inboxSeen:  make(map[string]struct{}),
		characters: make(map[string]*Character),
		students:   make(map[string]*Student),
		users:      make(map[string]*Student),
		sessions:   make(map[string]AccessTokenSession),
		holdings:   make(map[string]map[string]InventoryHolding),
		guardianLinks: make(map[string][]string),
		supportCases:  make(map[string]*SupportCase),
		assetRevisions: make(map[string]*AssetRevision),
	}
	p.School = NewSchoolModule(p)
	return p
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
	s.syncRoles()
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

// FindStudentByLogin resolves a school user by login (exact, then case-insensitive).
func (p *Platform) FindStudentByLogin(login string) (*Student, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	login = strings.TrimSpace(login)
	if login == "" {
		return nil, false
	}
	if s, ok := p.users[login]; ok {
		return s, true
	}
	lower := strings.ToLower(login)
	for key, s := range p.users {
		if strings.ToLower(key) == lower {
			return s, true
		}
	}
	return nil, false
}

// IssueAccessToken creates a random opaque session token after successful login.
// The session is valid for AccessTokenTTL (30 days).
func (p *Platform) IssueAccessToken(studentID string) (token string, expiresAt time.Time, err error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if _, ok := p.students[studentID]; !ok {
		return "", time.Time{}, fmt.Errorf("student not found")
	}
	var buf [32]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return "", time.Time{}, err
	}
	token = hex.EncodeToString(buf[:])
	expiresAt = time.Now().UTC().Add(AccessTokenTTL)
	p.sessions[token] = AccessTokenSession{StudentID: studentID, ExpiresAt: expiresAt}
	return token, expiresAt, nil
}

// ResolveAccessToken maps opaque session tokens to a principal.
// Expired sessions are removed and rejected.
func (p *Platform) ResolveAccessToken(token string) (*Student, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if token == "" {
		return nil, false
	}
	sess, ok := p.sessions[token]
	if !ok {
		return nil, false
	}
	if !sess.ExpiresAt.IsZero() && time.Now().UTC().After(sess.ExpiresAt) {
		delete(p.sessions, token)
		return nil, false
	}
	s, ok := p.students[sess.StudentID]
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
	level, granted, err = p.recordAttendanceUnlocked(characterID, attendanceID, xp)
	studentID := ""
	if granted {
		studentID = p.studentIDForCharacter(characterID)
	}
	p.mu.Unlock()
	if granted && studentID != "" && p.School != nil {
		p.School.AfterAttendanceConfirmed(studentID, attendanceID)
	}
	return level, granted, err
}

// GrantQuestXP grants quest reward XP without counting as session attendance.
func (p *Platform) GrantQuestXP(characterID, questKey string, xp int64) (level int, granted bool, err error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.recordAttendanceUnlocked(characterID, "quest:"+questKey, xp)
}

// ClaimRewardXP grants one-shot claim XP for achievements/quests (idempotent by claimID).
// Returns already=true when this claim was already granted.
func (p *Platform) ClaimRewardXP(studentID, claimID string, xp int64) (level int, grantedXP int64, already bool, err error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	s, ok := p.students[studentID]
	if !ok {
		return 0, 0, false, fmt.Errorf("student not found")
	}
	if s.CharacterID == "" {
		s.CharacterID = "char-" + s.ID
	}
	if _, exists := p.characters[s.CharacterID]; !exists {
		p.characters[s.CharacterID] = &Character{
			ID: s.CharacterID, UserID: s.UserID, TenantID: TenantDemo, XP: 0, Level: 1, Version: 1,
		}
	}
	if xp < 0 {
		xp = 0
	}
	level, granted, err := p.recordAttendanceUnlocked(s.CharacterID, "claim:"+claimID, xp)
	if err != nil {
		return 0, 0, false, err
	}
	if !granted {
		return level, 0, true, nil
	}
	return level, xp, false, nil
}

func (p *Platform) recordAttendanceUnlocked(characterID, attendanceID string, xp int64) (level int, granted bool, err error) {
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
	granted = true
	level = c.Level
	return level, granted, nil
}

func (p *Platform) studentIDForCharacter(characterID string) string {
	for _, s := range p.students {
		if s.CharacterID == characterID {
			return s.ID
		}
	}
	return ""
}

func (p *Platform) OutboxUnpublished() []outbox.Entry {
	return p.outbox.Unpublished()
}

func (p *Platform) MarkOutboxPublished(id string) {
	p.outbox.MarkPublished(id)
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

// SyncCharacterXPFromMastery raises character XP to the sum of weapon mastery
// display points (1 point = 1 XP) and refreshes Level. Never decreases XP.
// Returns how many characters were updated.
func (p *Platform) SyncCharacterXPFromMastery() int {
	p.mu.Lock()
	defer p.mu.Unlock()
	updated := 0
	for _, s := range p.students {
		if s == nil || s.CharacterID == "" || len(s.Mastery) == 0 {
			continue
		}
		c, ok := p.characters[s.CharacterID]
		if !ok || c == nil {
			continue
		}
		target := mastery.CharacterXPFromMasteryUnits(s.Mastery)
		if target <= c.XP {
			continue
		}
		c.XP = target
		c.Level = p.track.LevelForXP(target)
		c.Version++
		updated++
	}
	return updated
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
