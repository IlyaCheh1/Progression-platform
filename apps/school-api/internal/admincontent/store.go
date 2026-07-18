package admincontent

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

type Quest struct {
	Key   string `json:"key"`
	Title string `json:"title"`
	Type  string `json:"type"`
	XP    int    `json:"xp"`
}

type Achievement struct {
	Key   string `json:"key"`
	Title string `json:"title"`
	Tiers any    `json:"tiers"`
	XP    int    `json:"xp"`
}

type Catalog struct {
	Quests       []Quest       `json:"quests"`
	Achievements []Achievement `json:"achievements"`
}

type Store struct {
	mu           sync.Mutex
	quests       map[string]Quest
	achievements map[string]Achievement
}

func New() *Store {
	return &Store{
		quests:       map[string]Quest{},
		achievements: map[string]Achievement{},
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
		s.quests[q.Key] = q
	}
	for _, a := range cat.Achievements {
		s.achievements[a.Key] = a
	}
	return nil
}

func (s *Store) Snapshot() Catalog {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := Catalog{
		Quests:       make([]Quest, 0, len(s.quests)),
		Achievements: make([]Achievement, 0, len(s.achievements)),
	}
	for _, q := range s.quests {
		out.Quests = append(out.Quests, q)
	}
	for _, a := range s.achievements {
		out.Achievements = append(out.Achievements, a)
	}
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

func MustLoad(root string) *Store {
	st := New()
	path := filepath.Join(root, "infra", "local", "seed", "demo-content.json")
	if err := st.LoadFile(path); err != nil {
		fmt.Fprintf(os.Stderr, "content seed warning: %v\n", err)
		return st
	}
	cat := st.Snapshot()
	fmt.Printf("loaded admin content: %d quests, %d achievements\n", len(cat.Quests), len(cat.Achievements))
	return st
}
