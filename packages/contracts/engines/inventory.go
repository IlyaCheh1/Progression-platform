package engines

import (
	"fmt"
	"sort"
	"strings"
)

const (
	InventoryKindCharacter  = "character"
	InventoryKindBackground = "background"
	InventoryKindTitle      = "title"
)

// Starter backgrounds granted on onboarding (free defaults).
// Paid cosmetics live under /media/backgrounds/buy and are sold in the store.
var starterBackgroundKeys = []string{
	"onboarding_background",
	"northern_lights",
	"mountain_terrace",
	"aurora_flow",
	"cloud_ridge",
	"crimson_peak",
}

var maleCharacterIDs = []string{"3"}
var femaleCharacterIDs = []string{"8"}

// InventoryHolding is a unique cosmetic owned by a student.
type InventoryHolding struct {
	Key   string `json:"key"`
	Kind  string `json:"kind"`
	RefID string `json:"refId"`
}

// InventoryView is returned by GET /v1/inventory/me.
type InventoryView struct {
	Items                 []InventoryHolding `json:"items"`
	EquippedCharacterID   string             `json:"equippedCharacterId"`
	EquippedBackgroundKey string             `json:"equippedBackgroundKey"`
	EquippedTitleKey      string             `json:"equippedTitleKey,omitempty"`
}

// EquipInventoryInput equips an owned cosmetic onto the profile presentation.
type EquipInventoryInput struct {
	Kind  string `json:"kind"`
	RefID string `json:"refId"`
}

func characterItemKey(id string) string {
	return "character:" + id
}

func backgroundItemKey(id string) string {
	return "background:" + id
}

func (p *Platform) grantHoldingLocked(studentID, kind, refID string) {
	if studentID == "" || kind == "" || refID == "" {
		return
	}
	key := ""
	switch kind {
	case InventoryKindCharacter:
		key = characterItemKey(refID)
	case InventoryKindBackground:
		key = backgroundItemKey(refID)
	case InventoryKindTitle:
		key = titleItemKey(refID)
	default:
		return
	}
	bag, ok := p.holdings[studentID]
	if !ok {
		bag = make(map[string]InventoryHolding)
		p.holdings[studentID] = bag
	}
	if _, exists := bag[key]; exists {
		return
	}
	bag[key] = InventoryHolding{Key: key, Kind: kind, RefID: refID}
}

func (p *Platform) ownsHoldingLocked(studentID, kind, refID string) bool {
	bag, ok := p.holdings[studentID]
	if !ok {
		return false
	}
	var key string
	switch kind {
	case InventoryKindCharacter:
		key = characterItemKey(refID)
	case InventoryKindBackground:
		key = backgroundItemKey(refID)
	case InventoryKindTitle:
		key = titleItemKey(refID)
	default:
		return false
	}
	_, ok = bag[key]
	return ok
}

func charactersForGenderIDs(gender string) []string {
	if strings.ToUpper(gender) == "FEMALE" {
		return append([]string{}, femaleCharacterIDs...)
	}
	return append([]string{}, maleCharacterIDs...)
}

// grantOnboardingCosmeticsLocked puts starter characters (by gender) and default
// backgrounds into inventory so the student can equip/replace them later.
func (p *Platform) grantOnboardingCosmeticsLocked(s *Student) {
	if s == nil {
		return
	}
	gender := s.Gender
	if gender == "" {
		gender = "MALE"
	}
	for _, id := range charactersForGenderIDs(gender) {
		p.grantHoldingLocked(s.ID, InventoryKindCharacter, id)
	}
	selected := normalizedCharacterID(s.SelectedSkinID, gender)
	if selected != "" {
		p.grantHoldingLocked(s.ID, InventoryKindCharacter, selected)
	}
	for _, bg := range starterBackgroundKeys {
		p.grantHoldingLocked(s.ID, InventoryKindBackground, bg)
	}
	bg := normalizedBackgroundKey(s.BackgroundKey)
	if bg != "" {
		p.grantHoldingLocked(s.ID, InventoryKindBackground, bg)
	}
}

func (p *Platform) InventoryForStudent(studentID string) (*InventoryView, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	s, ok := p.students[studentID]
	if !ok {
		return nil, fmt.Errorf("student not found")
	}
	// Backfill starter cosmetics for completed profiles (idempotent).
	if s.ProfileComplete || profileReadyLocked(s) {
		p.grantOnboardingCosmeticsLocked(s)
	}
	return inventoryViewLocked(p, s), nil
}

func inventoryViewLocked(p *Platform, s *Student) *InventoryView {
	bag := p.holdings[s.ID]
	items := make([]InventoryHolding, 0, len(bag))
	for _, item := range bag {
		items = append(items, item)
	}
	sort.Slice(items, func(i, j int) bool {
		if items[i].Kind != items[j].Kind {
			return items[i].Kind < items[j].Kind
		}
		return items[i].RefID < items[j].RefID
	})
	gender := s.Gender
	if gender == "" {
		gender = "MALE"
	}
	return &InventoryView{
		Items:                 items,
		EquippedCharacterID:   normalizedCharacterID(s.SelectedSkinID, gender),
		EquippedBackgroundKey: normalizedBackgroundKey(s.BackgroundKey),
		EquippedTitleKey:      s.EquippedTitleKey,
	}
}

// PurchaseInventoryInput buys a cosmetic into the student's holdings (demo shop).
type PurchaseInventoryInput struct {
	Kind  string `json:"kind"`
	RefID string `json:"refId"`
}

// PurchaseInventoryItem grants a catalog cosmetic. Idempotent if already owned.
func (p *Platform) PurchaseInventoryItem(studentID string, in PurchaseInventoryInput) (*InventoryView, error) {
	in.Kind = strings.TrimSpace(strings.ToLower(in.Kind))
	in.RefID = strings.TrimSpace(in.RefID)
	if in.Kind != InventoryKindCharacter && in.Kind != InventoryKindBackground {
		return nil, fmt.Errorf("invalid_kind")
	}
	if in.RefID == "" {
		return nil, fmt.Errorf("invalid_ref")
	}

	p.mu.Lock()
	defer p.mu.Unlock()
	s, ok := p.students[studentID]
	if !ok {
		return nil, fmt.Errorf("student not found")
	}
	if !s.ProfileComplete {
		return nil, fmt.Errorf("profile_incomplete")
	}

	switch in.Kind {
	case InventoryKindCharacter:
		normalized, ok := normalizeCharacterID(in.RefID, s.Gender)
		if !ok {
			return nil, fmt.Errorf("invalid_character")
		}
		p.grantHoldingLocked(studentID, InventoryKindCharacter, normalized)
	case InventoryKindBackground:
		normalized, ok := normalizeBackgroundKey(in.RefID)
		if !ok {
			return nil, fmt.Errorf("invalid_background")
		}
		p.grantHoldingLocked(studentID, InventoryKindBackground, normalized)
	}

	return inventoryViewLocked(p, s), nil
}

// EquipInventoryItem sets profile presentation from an owned inventory cosmetic.
func (p *Platform) EquipInventoryItem(studentID string, in EquipInventoryInput) (*InventoryView, error) {
	in.Kind = strings.TrimSpace(strings.ToLower(in.Kind))
	in.RefID = strings.TrimSpace(in.RefID)
	if in.Kind != InventoryKindCharacter && in.Kind != InventoryKindBackground && in.Kind != InventoryKindTitle {
		return nil, fmt.Errorf("invalid_kind")
	}
	if in.RefID == "" {
		return nil, fmt.Errorf("invalid_ref")
	}

	p.mu.Lock()
	defer p.mu.Unlock()
	s, ok := p.students[studentID]
	if !ok {
		return nil, fmt.Errorf("student not found")
	}
	if !s.ProfileComplete {
		return nil, fmt.Errorf("profile_incomplete")
	}

	switch in.Kind {
	case InventoryKindCharacter:
		normalized, ok := normalizeCharacterID(in.RefID, s.Gender)
		if !ok {
			return nil, fmt.Errorf("invalid_character")
		}
		if !p.ownsHoldingLocked(studentID, InventoryKindCharacter, normalized) {
			return nil, fmt.Errorf("not_owned")
		}
		s.SelectedSkinID = normalized
		s.Skin = ""
	case InventoryKindBackground:
		normalized, ok := normalizeBackgroundKey(in.RefID)
		if !ok {
			return nil, fmt.Errorf("invalid_background")
		}
		if !p.ownsHoldingLocked(studentID, InventoryKindBackground, normalized) {
			return nil, fmt.Errorf("not_owned")
		}
		s.BackgroundKey = normalized
	case InventoryKindTitle:
		if !p.ownsTitleLocked(studentID, in.RefID) {
			return nil, fmt.Errorf("not_owned")
		}
		s.EquippedTitleKey = in.RefID
	}

	return inventoryViewLocked(p, s), nil
}
