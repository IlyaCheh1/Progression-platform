package outbox

import (
	"sync"
	"time"

	"github.com/masterofsword/contracts/envelope"
)

// MemoryStore is a transactional outbox stand-in for local/dev and tests.
// Production uses PostgreSQL outbox tables per writer.
type MemoryStore struct {
	mu      sync.Mutex
	entries []Entry
	seen    map[string]struct{}
}

type Entry struct {
	ID        string
	Event     envelope.Event
	CreatedAt time.Time
	Published bool
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{seen: make(map[string]struct{})}
}

// Append stores an event once per IdempotencyKey (exactly-once logical effect).
func (s *MemoryStore) Append(ev envelope.Event) (bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.seen[ev.IdempotencyKey]; ok {
		return false, nil
	}
	s.seen[ev.IdempotencyKey] = struct{}{}
	s.entries = append(s.entries, Entry{
		ID:        ev.EventID,
		Event:     ev,
		CreatedAt: time.Now().UTC(),
	})
	return true, nil
}

func (s *MemoryStore) Unpublished() []Entry {
	s.mu.Lock()
	defer s.mu.Unlock()
	var out []Entry
	for _, e := range s.entries {
		if !e.Published {
			out = append(out, e)
		}
	}
	return out
}

func (s *MemoryStore) MarkPublished(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.entries {
		if s.entries[i].ID == id {
			s.entries[i].Published = true
		}
	}
}

func (s *MemoryStore) Len() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.entries)
}
