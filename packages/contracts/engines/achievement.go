package engines

import "time"

type AchievementState struct {
	Key       string    `json:"key"`
	Tier      int       `json:"tier"`
	MaxTier   int       `json:"maxTier"`
	Unlocked  bool      `json:"unlocked"`
	UnlockedAt time.Time `json:"unlockedAt,omitempty"`
}

var achievementTiers = map[string][]int{
	"practice.sessions": {1, 10, 25, 50, 100},
	"practice.weeks":    {4, 12, 26, 52},
}

func (sm *SchoolModule) checkAttendanceAchievementsLocked(studentID string) {
	count := sm.attendanceCount[studentID]
	sm.unlockAchievementTierLocked(studentID, "practice.sessions", count, achievementTiers["practice.sessions"])
	if count >= 1 {
		sm.unlockAchievementTierLocked(studentID, "start.first_salute", 1, []int{1})
	}
}

func (sm *SchoolModule) checkMasteryAchievementsLocked(studentID string) {
	s, ok := sm.p.students[studentID]
	if !ok {
		return
	}
	rankCount := 0
	for _, w := range masteryWeaponKeys() {
		if s.Ranks[w] >= 1 {
			rankCount++
		}
	}
	if rankCount >= 1 {
		sm.unlockAchievementTierLocked(studentID, "mastery.first_rank", 1, []int{1})
	}
	if rankCount >= 4 {
		sm.unlockAchievementTierLocked(studentID, "mastery.four_paths", 1, []int{1})
	}
}

func masteryWeaponKeys() []string {
	return []string{
		"spada_a_uno_mano", "due_spade", "spada_e_scudo", "spada_a_due_mani",
		"spadone", "acia_alabarda", "spiedo_partesana", "spiedo_e_scudo",
	}
}

func (sm *SchoolModule) unlockAchievementTierLocked(studentID, key string, value int, tiers []int) {
	if sm.killSwitches["achievement:"+key] {
		return
	}
	if sm.achievements[studentID] == nil {
		sm.achievements[studentID] = map[string]*AchievementState{}
	}
	maxTier := len(tiers)
	st := sm.achievements[studentID][key]
	if st == nil {
		st = &AchievementState{Key: key, MaxTier: maxTier}
		sm.achievements[studentID][key] = st
	}
	tier := 0
	for i, threshold := range tiers {
		if value >= threshold {
			tier = i + 1
		}
	}
	if tier > st.Tier {
		st.Tier = tier
		st.Unlocked = true
		st.UnlockedAt = time.Now().UTC()
	}
}

func (sm *SchoolModule) AchievementsForStudent(studentID string) []AchievementState {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	m := sm.achievements[studentID]
	out := make([]AchievementState, 0, len(m))
	for _, a := range m {
		out = append(out, *a)
	}
	return out
}
