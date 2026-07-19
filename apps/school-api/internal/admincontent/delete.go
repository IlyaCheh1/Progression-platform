package admincontent

func (s *Store) DeleteQuest(key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if key == "" {
		return ErrNotFound
	}
	if _, ok := s.quests[key]; !ok {
		return ErrNotFound
	}
	delete(s.quests, key)
	return nil
}

func (s *Store) DeleteAchievement(key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if key == "" {
		return ErrNotFound
	}
	if _, ok := s.achievements[key]; !ok {
		return ErrNotFound
	}
	delete(s.achievements, key)
	return nil
}
