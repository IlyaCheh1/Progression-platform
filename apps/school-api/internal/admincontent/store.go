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
	Key   string `json:"key"`
	Title string `json:"title"`
	Type  string `json:"type"`
	XP    int    `json:"xp"`
	Icon  string `json:"icon,omitempty"`
}

type Achievement struct {
	Key   string `json:"key"`
	Title string `json:"title"`
	Tiers any    `json:"tiers"`
	XP    int    `json:"xp"`
	Icon  string `json:"icon,omitempty"`
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
	candidates := []string{
		filepath.Join(root, "apps", "web", "public", "content", "starter.json"),
		filepath.Join(root, "schemas", "content", "school.fencing.starter.json"),
		filepath.Join(root, "infra", "local", "seed", "demo-content.json"),
	}
	var loaded string
	for _, path := range candidates {
		if err := st.LoadFile(path); err != nil {
			continue
		}
		loaded = path
		break
	}
	if loaded == "" {
		fmt.Fprintf(os.Stderr, "content seed warning: no starter catalog found under %s\n", root)
		return st
	}
	cat := st.Snapshot()
	fmt.Printf(
		"loaded admin content from %s: %d quests, %d achievements, %d talents, %d items, %d rewards, %d schools\n",
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
