package engines

import (
	"fmt"
	"strings"
)

const maxAvatarURLLen = 450_000

var allowedSkins = map[string]struct{}{
	"novice":  {},
	"scholar": {},
	"duelist": {},
	"shield":  {},
	"polearm": {},
}

var allowedCharacterIDs = map[string]struct{}{
	"1":  {},
	"2":  {},
	"3":  {},
	"4":  {},
	"5":  {},
	"6":  {},
	"7":  {},
	"8":  {},
	"9":  {},
	"10": {},
}

var legacySkinToCharacter = map[string]string{
	"novice":  "1",
	"scholar": "3",
	"duelist": "4",
	"shield":  "2",
	"polearm": "5",
}

var allowedGenders = map[string]struct{}{
	"MALE":   {},
	"FEMALE": {},
}

var allowedBackgrounds = map[string]struct{}{
	"onboarding_background": {},
	"northern_lights":         {},
	"mountain_terrace":        {},
	"prison":                  {},
	"building_castle":         {},
	"volcano":                 {},
	"grate_wall":              {},
	"apocalips_hill_view":     {},
	"apocalips_city":          {},
	"beach":                   {},
	"red_squere":              {},
	"apocalips_atomic_blow":   {},
	"heaven":                  {},
	"moon":                    {},
}

var legacyBackgroundKeys = map[string]string{
	"1": "northern_lights",
	"2": "prison",
	"3": "building_castle",
	"4": "volcano",
	"5": "northern_lights",
	"6": "grate_wall",
}

const (
	defaultBackgroundKey  = "mountain_terrace"
	defaultMaleCharacterID   = "3"
	defaultFemaleCharacterID = "8"
)

// ProfileInput updates RPG presentation / onboarding state for a student.
type ProfileInput struct {
	Username        string  `json:"username"`
	SelectedSkinID  string  `json:"selectedSkinId"`
	Skin            string  `json:"skin"` // legacy
	Gender          string  `json:"gender"`
	BackgroundKey   string  `json:"backgroundKey"`
	AvatarURL       *string `json:"avatarUrl"`
	ProfileComplete bool    `json:"profileComplete"`
}

// ProfileView is returned by GET /v1/profile/me.
type ProfileView struct {
	StudentID       string           `json:"studentId"`
	CharacterID     string           `json:"characterId"`
	DisplayName     string           `json:"displayName"`
	ProfileComplete bool             `json:"profileComplete"`
	Username        string           `json:"username"`
	SelectedSkinID  string           `json:"selectedSkinId"`
	Skin            string           `json:"skin,omitempty"`
	Gender          string           `json:"gender"`
	BackgroundKey   string           `json:"backgroundKey"`
	AvatarURL       string           `json:"avatarUrl,omitempty"`
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
	in.SelectedSkinID = strings.TrimSpace(in.SelectedSkinID)
	in.Skin = strings.TrimSpace(in.Skin)
	in.Gender = strings.ToUpper(strings.TrimSpace(in.Gender))
	in.BackgroundKey = strings.TrimSpace(in.BackgroundKey)

	if in.SelectedSkinID != "" {
		normalized, ok := normalizeCharacterID(in.SelectedSkinID, in.Gender)
		if !ok {
			return nil, fmt.Errorf("invalid_character")
		}
		in.SelectedSkinID = normalized
	} else if in.Skin != "" {
		if _, ok := allowedSkins[in.Skin]; !ok {
			return nil, fmt.Errorf("invalid_skin")
		}
	}
	if in.Gender != "" {
		if _, ok := allowedGenders[in.Gender]; !ok {
			return nil, fmt.Errorf("invalid_gender")
		}
	}
	if in.BackgroundKey != "" {
		normalized, ok := normalizeBackgroundKey(in.BackgroundKey)
		if !ok {
			return nil, fmt.Errorf("invalid_background")
		}
		in.BackgroundKey = normalized
	}
	if in.AvatarURL != nil {
		normalized, err := normalizeAvatarURL(*in.AvatarURL)
		if err != nil {
			return nil, err
		}
		*in.AvatarURL = normalized
	}

	p.mu.Lock()
	defer p.mu.Unlock()
	s, ok := p.students[studentID]
	if !ok {
		return nil, fmt.Errorf("student not found")
	}

	wasComplete := s.ProfileComplete

	if in.Username != "" {
		s.ProfileUsername = in.Username
		s.DisplayName = in.Username
	}
	if in.Gender != "" {
		s.Gender = in.Gender
	}

	// After onboarding, appearance *changes* require inventory ownership.
	// Re-saving the currently equipped skin/background (e.g. nickname-only update) must succeed.
	// Backfill starter cosmetics for profiles completed before inventory existed.
	if wasComplete {
		p.grantOnboardingCosmeticsLocked(s)
		currentSkin := normalizedCharacterID(s.SelectedSkinID, s.Gender)
		if in.SelectedSkinID != "" && in.SelectedSkinID != currentSkin {
			if !p.ownsHoldingLocked(studentID, InventoryKindCharacter, in.SelectedSkinID) {
				return nil, fmt.Errorf("character_not_owned")
			}
		}
		currentBackground := normalizedBackgroundKey(s.BackgroundKey)
		if in.BackgroundKey != "" && in.BackgroundKey != currentBackground {
			if !p.ownsHoldingLocked(studentID, InventoryKindBackground, in.BackgroundKey) {
				return nil, fmt.Errorf("background_not_owned")
			}
		}
	}

	if in.SelectedSkinID != "" {
		s.SelectedSkinID = in.SelectedSkinID
		s.Skin = ""
	} else if in.Skin != "" {
		s.Skin = in.Skin
		if mapped, ok := legacySkinToCharacter[in.Skin]; ok {
			s.SelectedSkinID = mapped
		}
	}
	if in.BackgroundKey != "" {
		s.BackgroundKey = in.BackgroundKey
	}
	if in.AvatarURL != nil {
		s.AvatarURL = *in.AvatarURL
	}
	if s.SelectedSkinID == "" && s.Skin != "" {
		if mapped, ok := legacySkinToCharacter[s.Skin]; ok {
			s.SelectedSkinID = mapped
		}
	}
	if s.SelectedSkinID == "" && s.Gender != "" {
		s.SelectedSkinID = defaultCharacterForGender(s.Gender)
	}
	if in.ProfileComplete || profileReadyLocked(s) {
		s.ProfileComplete = true
	}

	// On first profile completion, put starter cosmetics into inventory.
	if s.ProfileComplete {
		p.grantOnboardingCosmeticsLocked(s)
	}

	return profileViewLocked(p, s), nil
}

func profileReadyLocked(s *Student) bool {
	return s.ProfileUsername != "" && s.Gender != "" && (s.SelectedSkinID != "" || s.Skin != "")
}

func profileViewLocked(p *Platform, s *Student) *ProfileView {
	gender := s.Gender
	if gender == "" {
		gender = "MALE"
	}
	selectedSkinID := normalizedCharacterID(s.SelectedSkinID, gender)
	if selectedSkinID == "" && s.Skin != "" {
		if mapped, ok := legacySkinToCharacter[s.Skin]; ok {
			selectedSkinID = mapped
		}
	}

	view := &ProfileView{
		StudentID:       s.ID,
		CharacterID:     s.CharacterID,
		DisplayName:     s.DisplayName,
		ProfileComplete: s.ProfileComplete,
		Username:        profileUsername(s),
		SelectedSkinID:  selectedSkinID,
		Skin:            s.Skin,
		Gender:          gender,
		BackgroundKey:   normalizedBackgroundKey(s.BackgroundKey),
		AvatarURL:       s.AvatarURL,
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

func normalizeAvatarURL(raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "", nil
	}
	if len(raw) > maxAvatarURLLen {
		return "", fmt.Errorf("avatar_too_large")
	}
	lower := strings.ToLower(raw)
	switch {
	case strings.HasPrefix(lower, "data:image/jpeg;base64,"),
		strings.HasPrefix(lower, "data:image/jpg;base64,"),
		strings.HasPrefix(lower, "data:image/png;base64,"),
		strings.HasPrefix(lower, "data:image/webp;base64,"):
		return raw, nil
	default:
		return "", fmt.Errorf("invalid_avatar")
	}
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

func normalizeBackgroundKey(raw string) (string, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return defaultBackgroundKey, true
	}
	if slug, ok := legacyBackgroundKeys[raw]; ok {
		return slug, true
	}
	if _, ok := allowedBackgrounds[raw]; ok {
		return raw, true
	}
	return "", false
}

func normalizedBackgroundKey(raw string) string {
	key, ok := normalizeBackgroundKey(raw)
	if !ok || key == "" {
		return defaultBackgroundKey
	}
	return key
}

func normalizeCharacterID(raw, gender string) (string, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return defaultCharacterForGender(gender), true
	}
	if _, ok := allowedCharacterIDs[raw]; ok {
		return raw, true
	}
	if mapped, ok := legacySkinToCharacter[raw]; ok {
		return mapped, true
	}
	return "", false
}

func normalizedCharacterID(raw, gender string) string {
	key, ok := normalizeCharacterID(raw, gender)
	if !ok || key == "" {
		return defaultCharacterForGender(gender)
	}
	return key
}

func defaultCharacterForGender(gender string) string {
	if strings.ToUpper(gender) == "FEMALE" {
		return defaultFemaleCharacterID
	}
	return defaultMaleCharacterID
}
