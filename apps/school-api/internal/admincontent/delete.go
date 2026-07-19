package admincontent

func (s *Store) DeleteQuest(key string) error {
	return deleteFrom(s, key, func() bool {
		if _, ok := s.quests[key]; !ok {
			return false
		}
		delete(s.quests, key)
		return true
	})
}

func (s *Store) DeleteAchievement(key string) error {
	return deleteFrom(s, key, func() bool {
		if _, ok := s.achievements[key]; !ok {
			return false
		}
		delete(s.achievements, key)
		return true
	})
}

func (s *Store) DeleteTalent(key string) error {
	return deleteFrom(s, key, func() bool {
		if _, ok := s.talents[key]; !ok {
			return false
		}
		delete(s.talents, key)
		return true
	})
}

func (s *Store) DeleteItem(key string) error {
	return deleteFrom(s, key, func() bool {
		if _, ok := s.items[key]; !ok {
			return false
		}
		delete(s.items, key)
		return true
	})
}

func (s *Store) DeleteReward(key string) error {
	return deleteFrom(s, key, func() bool {
		if _, ok := s.rewards[key]; !ok {
			return false
		}
		delete(s.rewards, key)
		return true
	})
}

func (s *Store) DeleteSchool(key string) error {
	return deleteFrom(s, key, func() bool {
		if _, ok := s.schools[key]; !ok {
			return false
		}
		delete(s.schools, key)
		return true
	})
}

func deleteFrom(s *Store, key string, fn func() bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if key == "" {
		return ErrNotFound
	}
	if !fn() {
		return ErrNotFound
	}
	return nil
}
