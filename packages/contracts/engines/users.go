package engines

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/masterofsword/contracts/rbac"
)

// UserInput is the payload for creating or updating school users.
type UserInput struct {
	DisplayName string `json:"displayName"`
	Login       string `json:"login"`
	Password    string `json:"password"`
	Role        string   `json:"role"`
	Roles       []string `json:"roles,omitempty"`
	CharacterID string   `json:"characterId"`
}

// EnsureUserFromOnlyID finds a school user by OnlyID email or creates a student.
// Password login is disabled for provisioned users (random unusable password).
// Returns (student, created, error).
func (p *Platform) EnsureUserFromOnlyID(email, displayName, _sub string) (*Student, bool, error) {
	email = strings.TrimSpace(email)
	if email == "" {
		return nil, false, fmt.Errorf("email_required")
	}
	if existing, ok := p.FindStudentByLogin(email); ok {
		return existing, false, nil
	}

	name := strings.TrimSpace(displayName)
	if name == "" {
		if at := strings.IndexByte(email, '@'); at > 0 {
			name = email[:at]
		} else {
			name = email
		}
	}

	var buf [24]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return nil, false, fmt.Errorf("password_entropy_failed")
	}
	// Prefix makes clear this account is OnlyID-backed if inspected in admin tools.
	password := "onlyid:" + hex.EncodeToString(buf[:])

	created, err := p.CreateUser(UserInput{
		DisplayName: name,
		Login:       email,
		Password:    password,
		Role:        RoleStudent,
		Roles:       []string{RoleStudent},
	})
	if err != nil {
		// Concurrent provision: another request may have created the same login.
		if err.Error() == "login_taken" {
			if existing, ok := p.FindStudentByLogin(email); ok {
				return existing, false, nil
			}
		}
		return nil, false, err
	}

	// Skip onboarding: open profile cabinet with sensible defaults from OnlyID.
	if _, err := p.UpdateStudentProfile(created.ID, ProfileInput{
		Username:        name,
		SelectedSkinID:  defaultMaleCharacterID,
		Gender:          "MALE",
		BackgroundKey:   defaultBackgroundKey,
		ProfileComplete: true,
	}); err != nil {
		return nil, false, err
	}
	ready, ok := p.GetStudent(created.ID)
	if !ok {
		return created, true, nil
	}
	return ready, true, nil
}

func (p *Platform) CreateUser(in UserInput) (*Student, error) {
	in.Login = strings.TrimSpace(in.Login)
	in.DisplayName = strings.TrimSpace(in.DisplayName)
	in.Role = rbac.NormalizeRole(in.Role)
	if in.Login == "" || in.Password == "" || in.DisplayName == "" {
		return nil, fmt.Errorf("display_name_login_password_required")
	}
	if len(in.Roles) > 0 {
		in.Roles = rbac.NormalizeRolesList(in.Roles)
		in.Role = rbac.PrimaryRole(in.Roles)
	}
	if in.Role == "" {
		in.Role = RoleStudent
	}
	if len(in.Roles) == 0 {
		in.Roles = []string{in.Role}
	}
	if !rbac.IsKnownRole(in.Role) || in.Role == rbac.RoleGuest {
		return nil, fmt.Errorf("invalid_role")
	}
	for _, role := range in.Roles {
		if !isAssignableRole(role) && role != rbac.RolePlatformAdmin {
			return nil, fmt.Errorf("invalid_role")
		}
	}

	p.mu.Lock()
	defer p.mu.Unlock()
	if _, exists := p.users[in.Login]; exists {
		return nil, fmt.Errorf("login_taken")
	}

	id := slugID("student", in.Login)
	characterID := strings.TrimSpace(in.CharacterID)
	if characterID == "" {
		characterID = "char-" + id
	}
	if _, err := p.createCharacterLocked(characterID, "user-"+id); err != nil {
		return nil, err
	}

	st := Student{
		ID:          id,
		DisplayName: in.DisplayName,
		UserID:      "user-" + id,
		CharacterID: characterID,
		Login:       in.Login,
		Password:    in.Password,
		Role:        in.Role,
		Roles:       append([]string(nil), in.Roles...),
		Mastery:     map[string]int64{},
		Ranks:       map[string]int{},
	}
	st.syncRoles()
	p.students[id] = &st
	p.users[in.Login] = &st
	cp := st
	return &cp, nil
}

func (p *Platform) UpdateUser(id string, in UserInput) (*Student, error) {
	in.Login = strings.TrimSpace(in.Login)
	in.DisplayName = strings.TrimSpace(in.DisplayName)
	if in.Role != "" {
		in.Role = rbac.NormalizeRole(in.Role)
		if !isAssignableRole(in.Role) && in.Role != rbac.RolePlatformAdmin {
			return nil, fmt.Errorf("invalid_role")
		}
	}
	if len(in.Roles) > 0 {
		in.Roles = rbac.NormalizeRolesList(in.Roles)
		for _, role := range in.Roles {
			if !isAssignableRole(role) && role != rbac.RolePlatformAdmin {
				return nil, fmt.Errorf("invalid_role")
			}
		}
	}

	p.mu.Lock()
	defer p.mu.Unlock()
	st, ok := p.students[id]
	if !ok {
		return nil, fmt.Errorf("not_found")
	}

	if in.Login != "" && in.Login != st.Login {
		if _, exists := p.users[in.Login]; exists {
			return nil, fmt.Errorf("login_taken")
		}
		delete(p.users, st.Login)
		st.Login = in.Login
		p.users[in.Login] = st
	}
	if in.DisplayName != "" {
		st.DisplayName = in.DisplayName
	}
	if in.Password != "" {
		st.Password = in.Password
	}
	if in.Role != "" {
		st.Role = in.Role
	}
	if len(in.Roles) > 0 {
		st.Roles = append([]string(nil), in.Roles...)
	} else if in.Role != "" {
		st.Roles = []string{in.Role}
	}
	if in.CharacterID != "" {
		st.CharacterID = in.CharacterID
	}
	st.syncRoles()

	cp := *st
	return &cp, nil
}

func (p *Platform) DeleteUser(id string) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	st, ok := p.students[id]
	if !ok {
		return fmt.Errorf("not_found")
	}
	delete(p.students, id)
	if st.Login != "" {
		delete(p.users, st.Login)
	}
	for token, sess := range p.sessions {
		if sess.StudentID == id {
			delete(p.sessions, token)
		}
	}
	return nil
}

func (p *Platform) HasPermission(studentID string, perm rbac.Permission) bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	st, ok := p.students[studentID]
	if !ok {
		return false
	}
	return st.HasPermission(perm)
}

func (p *Platform) createCharacterLocked(id, userID string) (*Character, error) {
	if _, ok := p.characters[id]; ok {
		return p.characters[id], nil
	}
	c := &Character{ID: id, UserID: userID, TenantID: TenantDemo, XP: 0, Level: 1, Version: 1}
	p.characters[id] = c
	return c, nil
}

func isAssignableRole(role string) bool {
	for _, r := range rbac.AssignableRoles() {
		if r == role {
			return true
		}
	}
	return role == rbac.RolePlatformAdmin
}

func slugID(prefix, login string) string {
	slug := strings.NewReplacer("@", "-", ".", "-").Replace(strings.ToLower(login))
	slug = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return '-'
	}, slug)
	slug = strings.Trim(slug, "-")
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	if slug == "" {
		slug = "user"
	}
	return prefix + "-" + slug
}
