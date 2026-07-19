package admincontent

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"sync"
)

type Quest struct {
	Key         string `json:"key"`
	Title       string `json:"title"`
	Type        string `json:"type"`
	XP          int    `json:"xp"`
	Coins       int    `json:"coins,omitempty"`
	Description string `json:"description,omitempty"`
	Icon        string `json:"icon,omitempty"`
}

type Achievement struct {
	Key         string `json:"key"`
	Title       string `json:"title"`
	Tiers       any    `json:"tiers"`
	XP          int    `json:"xp"`
	Coins       int    `json:"coins,omitempty"`
	Description string `json:"description,omitempty"`
	Icon        string `json:"icon,omitempty"`
}

type TalentTreeDef struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Theme string `json:"theme"`
}

type Talent struct {
	Key             string            `json:"key"`
	Title           string            `json:"title"`
	Rank            int               `json:"rank"`
	Description     string            `json:"description,omitempty"`
	TreeID          string            `json:"treeId,omitempty"`
	Kind            string            `json:"kind,omitempty"`
	Position        []int             `json:"position,omitempty"`
	Requires        []string          `json:"requires,omitempty"`
	MaxTier         int               `json:"maxTier,omitempty"`
	CooldownSeconds int               `json:"cooldownSeconds,omitempty"`
	Effects         map[string]string `json:"effects,omitempty"`
	Icon            string            `json:"icon,omitempty"`
}

type Item struct {
	Key      string `json:"key"`
	Title    string `json:"title"`
	Type     string `json:"type"`
	Category string `json:"category"`
}

type Reward struct {
	Key        string `json:"key"`
	Title      string `json:"title"`
	Components string `json:"components"`
}

type School struct {
	Key         string `json:"key"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type Catalog struct {
	Quests       []Quest         `json:"quests"`
	Achievements []Achievement   `json:"achievements"`
	Talents      []Talent        `json:"talents"`
	TalentTrees  []TalentTreeDef `json:"talentTrees"`
	Items        []Item          `json:"items"`
	Rewards      []Reward        `json:"rewards"`
	Schools      []School        `json:"schools"`
}

type TalentUICatalog struct {
	Trees   []TalentTreeDef `json:"trees"`
	Talents []Talent        `json:"talents"`
}

type Store struct {
	mu           sync.Mutex
	quests       map[string]Quest
	achievements map[string]Achievement
	talents      map[string]Talent
	talentTrees  []TalentTreeDef
	items        map[string]Item
	rewards      map[string]Reward
	schools      map[string]School
}

func New() *Store {
	return &Store{
		quests:       map[string]Quest{},
		achievements: map[string]Achievement{},
		talents:      map[string]Talent{},
		items:        map[string]Item{},
		rewards:      map[string]Reward{},
		schools:      map[string]School{},
	}
}

func (s *Store) LoadFile(path string) error {
	b, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var cat Catalog
	if err := json.Unmarshal(b, &cat); err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, q := range cat.Quests {
		if q.Key != "" {
			s.quests[q.Key] = q
		}
	}
	for _, a := range cat.Achievements {
		if a.Key != "" {
			s.achievements[a.Key] = a
		}
	}
	for _, t := range cat.Talents {
		if t.Key != "" {
			s.talents[t.Key] = normalizeTalent(t)
		}
	}
	if len(cat.TalentTrees) > 0 {
		s.talentTrees = append([]TalentTreeDef(nil), cat.TalentTrees...)
	}
	for _, item := range cat.Items {
		if item.Key != "" {
			s.items[item.Key] = item
		}
	}
	for _, reward := range cat.Rewards {
		if reward.Key != "" {
			s.rewards[reward.Key] = reward
		}
	}
	for _, school := range cat.Schools {
		if school.Key != "" {
			s.schools[school.Key] = school
		}
	}
	return nil
}

func (s *Store) Snapshot() Catalog {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := Catalog{
		Quests:       make([]Quest, 0, len(s.quests)),
		Achievements: make([]Achievement, 0, len(s.achievements)),
		Talents:      make([]Talent, 0, len(s.talents)),
		TalentTrees:  append([]TalentTreeDef(nil), s.talentTrees...),
		Items:        make([]Item, 0, len(s.items)),
		Rewards:      make([]Reward, 0, len(s.rewards)),
		Schools:      make([]School, 0, len(s.schools)),
	}
	for _, q := range s.quests {
		out.Quests = append(out.Quests, q)
	}
	for _, a := range s.achievements {
		out.Achievements = append(out.Achievements, a)
	}
	for _, t := range s.talents {
		out.Talents = append(out.Talents, t)
	}
	for _, item := range s.items {
		out.Items = append(out.Items, item)
	}
	for _, reward := range s.rewards {
		out.Rewards = append(out.Rewards, reward)
	}
	for _, school := range s.schools {
		out.Schools = append(out.Schools, school)
	}
	sort.Slice(out.Quests, func(i, j int) bool { return out.Quests[i].Key < out.Quests[j].Key })
	sort.Slice(out.Achievements, func(i, j int) bool { return out.Achievements[i].Key < out.Achievements[j].Key })
	sort.Slice(out.Talents, func(i, j int) bool { return out.Talents[i].Key < out.Talents[j].Key })
	sort.Slice(out.TalentTrees, func(i, j int) bool { return out.TalentTrees[i].ID < out.TalentTrees[j].ID })
	sort.Slice(out.Items, func(i, j int) bool { return out.Items[i].Key < out.Items[j].Key })
	sort.Slice(out.Rewards, func(i, j int) bool { return out.Rewards[i].Key < out.Rewards[j].Key })
	sort.Slice(out.Schools, func(i, j int) bool { return out.Schools[i].Key < out.Schools[j].Key })
	return out
}

func (s *Store) UpsertQuest(q Quest) error {
	if q.Key == "" || q.Title == "" {
		return fmt.Errorf("key_and_title_required")
	}
	if q.Type == "" {
		q.Type = "CUSTOM"
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.quests[q.Key] = q
	return nil
}

func (s *Store) UpsertAchievement(a Achievement) error {
	if a.Key == "" || a.Title == "" {
		return fmt.Errorf("key_and_title_required")
	}
	if a.Tiers == nil {
		a.Tiers = 1
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.achievements[a.Key] = a
	return nil
}

func normalizeTalent(t Talent) Talent {
	if t.Rank <= 0 {
		t.Rank = 1
	}
	if t.Kind == "" {
		t.Kind = "PASSIVE"
	}
	if t.MaxTier <= 0 {
		t.MaxTier = 1
	}
	return t
}

func (s *Store) GetTalent(key string) (Talent, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	t, ok := s.talents[key]
	return t, ok
}

func (s *Store) GetAchievement(key string) (Achievement, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	a, ok := s.achievements[key]
	return a, ok
}

func (s *Store) GetQuest(key string) (Quest, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	q, ok := s.quests[key]
	return q, ok
}

// AchievementStageXP returns XP for a claimable stage (0-based index).
// Coin-only achievements (coins > 0 and xp == 0) grant no XP.
func AchievementStageXP(a Achievement, stageIndex int) int {
	if stageIndex < 0 {
		stageIndex = 0
	}
	if a.Coins > 0 && a.XP == 0 {
		return 0
	}
	tiers := tierCount(a.Tiers)
	if a.XP > 0 {
		return a.XP
	}
	if tiers > 1 {
		return 50 * (stageIndex + 1)
	}
	return 100
}

// AchievementStageCoins returns gold coins for a claimable stage.
func AchievementStageCoins(a Achievement, stageIndex int) int {
	if a.Coins <= 0 {
		return 0
	}
	if stageIndex < 0 {
		stageIndex = 0
	}
	tiers := tierCount(a.Tiers)
	if tiers > 1 {
		// Scale later stages slightly so multi-tier coin rewards stay meaningful.
		return a.Coins * (stageIndex + 1)
	}
	return a.Coins
}

// QuestClaimXP returns XP granted on manual quest claim.
// Coin-only quests (coins > 0 and xp == 0) grant no XP.
func QuestClaimXP(q Quest) int {
	if q.Coins > 0 && q.XP == 0 {
		return 0
	}
	if q.XP > 0 {
		return q.XP
	}
	return 100
}

func tierCount(tiers any) int {
	switch v := tiers.(type) {
	case []any:
		return len(v)
	case []float64:
		return len(v)
	case []int:
		return len(v)
	case float64, int:
		return 1
	default:
		return 1
	}
}

func (s *Store) TalentUICatalog() TalentUICatalog {
	snap := s.Snapshot()
	return TalentUICatalog{Trees: snap.TalentTrees, Talents: snap.Talents}
}

func (s *Store) UpsertTalent(t Talent) error {
	if t.Key == "" || t.Title == "" {
		return fmt.Errorf("key_and_title_required")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.talents[t.Key] = normalizeTalent(t)
	return nil
}

func (s *Store) UpsertItem(item Item) error {
	if item.Key == "" || item.Title == "" {
		return fmt.Errorf("key_and_title_required")
	}
	if item.Type == "" {
		item.Type = "COSMETIC"
	}
	if item.Category == "" {
		item.Category = "collectible"
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items[item.Key] = item
	return nil
}

func (s *Store) UpsertReward(reward Reward) error {
	if reward.Key == "" || reward.Title == "" {
		return fmt.Errorf("key_and_title_required")
	}
	if reward.Components == "" {
		return fmt.Errorf("components_required")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.rewards[reward.Key] = reward
	return nil
}

func (s *Store) UpsertSchool(school School) error {
	if school.Key == "" || school.Title == "" {
		return fmt.Errorf("key_and_title_required")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.schools[school.Key] = school
	return nil
}

func MustLoad(root string) *Store {
	st := New()
	// Production catalog: starter.json (web) and/or schema copy. Merge all found.
	candidates := []string{
		filepath.Join(root, "apps", "web", "public", "content", "starter.json"),
		filepath.Join(root, "schemas", "content", "school.fencing.starter.json"),
	}
	var loaded []string
	for _, path := range candidates {
		if err := st.LoadFile(path); err != nil {
			continue
		}
		loaded = append(loaded, path)
	}
	if len(loaded) == 0 {
		fmt.Fprintf(os.Stderr, "content seed warning: no starter catalog found under %s\n", root)
		return st
	}
	cat := st.Snapshot()
	fmt.Printf(
		"loaded admin content from %v: %d quests, %d achievements, %d talents, %d items, %d rewards, %d schools\n",
		loaded,
		len(cat.Quests),
		len(cat.Achievements),
		len(cat.Talents),
		len(cat.Items),
		len(cat.Rewards),
		len(cat.Schools),
	)
	return st
}
