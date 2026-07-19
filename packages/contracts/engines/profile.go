package engines

import (
	"fmt"
	"strings"
)

var allowedSkins = map[string]struct{}{
	"novice":  {},
	"scholar": {},
	"duelist": {},
	"shield":  {},
	"polearm": {},
}

var allowedGenders = map[string]struct{}{
	"MALE":   {},
	"FEMALE": {},
}

// ProfileInput updates RPG presentation / onboarding state for a student.
type ProfileInput struct {
	Username        string `json:"username"`
	Skin            string `json:"skin"`
	Gender          string `json:"gender"`
	BackgroundKey   string `json:"backgroundKey"`
	ProfileComplete bool   `json:"profileComplete"`
}

// ProfileView is returned by GET /v1/profile/me.
type ProfileView struct {
	StudentID       string           `json:"studentId"`
	CharacterID     string           `json:"characterId"`
	DisplayName     string           `json:"displayName"`
	ProfileComplete bool             `json:"profileComplete"`
	Username        string           `json:"username"`
	Skin            string           `json:"skin"`
	Gender          string           `json:"gender"`
	BackgroundKey   string           `json:"backgroundKey"`
	Level           int              `json:"level"`
	XP              int64            `json:"xp"`
	XPToNextLevel   int64            `json:"xpToNextLevel"`
	Mastery         map[string]int64 `json:"mastery"`
	Ranks           map[string]int   `json:"ranks"`
}

func (p *Platform) ProfileForStudent(studentID string) (*ProfileView, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	s, ok := p.students[studentID]
	if !ok {
		return nil, fmt.Errorf("student not found")
	}
	return profileViewLocked(p, s), nil
}

func (p *Platform) UpdateStudentProfile(studentID string, in ProfileInput) (*ProfileView, error) {
	in.Username = strings.TrimSpace(in.Username)
	in.Skin = strings.TrimSpace(in.Skin)
	in.Gender = strings.ToUpper(strings.TrimSpace(in.Gender))
	in.BackgroundKey = strings.TrimSpace(in.BackgroundKey)

	if in.Skin != "" {
		if _, ok := allowedSkins[in.Skin]; !ok {
			return nil, fmt.Errorf("invalid_skin")
		}
	}
	if in.Gender != "" {
		if _, ok := allowedGenders[in.Gender]; !ok {
			return nil, fmt.Errorf("invalid_gender")
		}
	}

	p.mu.Lock()
	defer p.mu.Unlock()
	s, ok := p.students[studentID]
	if !ok {
		return nil, fmt.Errorf("student not found")
	}

	if in.Username != "" {
		s.ProfileUsername = in.Username
		s.DisplayName = in.Username
	}
	if in.Skin != "" {
		s.Skin = in.Skin
	}
	if in.Gender != "" {
		s.Gender = in.Gender
	}
	if in.BackgroundKey != "" {
		s.BackgroundKey = in.BackgroundKey
	}
	if in.ProfileComplete || (s.ProfileUsername != "" && s.Skin != "" && s.Gender != "") {
		s.ProfileComplete = true
	}

	return profileViewLocked(p, s), nil
}

func profileViewLocked(p *Platform, s *Student) *ProfileView {
	view := &ProfileView{
		StudentID:       s.ID,
		CharacterID:     s.CharacterID,
		DisplayName:     s.DisplayName,
		ProfileComplete: s.ProfileComplete,
		Username:        profileUsername(s),
		Skin:            s.Skin,
		Gender:          s.Gender,
		BackgroundKey:   s.BackgroundKey,
		Level:           1,
		Mastery:         cloneMastery(s.Mastery),
		Ranks:           cloneRanks(s.Ranks),
	}
	if s.CharacterID != "" {
		if c, ok := p.characters[s.CharacterID]; ok {
			level, intoLevel, need, err := p.track.Progress(c.XP)
			if err == nil {
				view.Level = level
				view.XP = intoLevel
				if need > 0 {
					view.XPToNextLevel = need
				} else {
					view.XPToNextLevel = 600
				}
			} else {
				view.Level = c.Level
			}
		}
	}
	return view
}

func profileUsername(s *Student) string {
	if s.ProfileUsername != "" {
		return s.ProfileUsername
	}
	return s.DisplayName
}

func cloneMastery(in map[string]int64) map[string]int64 {
	out := make(map[string]int64, len(in))
	for k, v := range in {
		out[k] = v
	}
	return out
}

func cloneRanks(in map[string]int) map[string]int {
	out := make(map[string]int, len(in))
	for k, v := range in {
		out[k] = v
	}
	return out
}
