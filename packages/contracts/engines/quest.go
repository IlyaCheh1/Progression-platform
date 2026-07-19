package engines

import "time"

type QuestProgress struct {
	QuestKey    string    `json:"questKey"`
	Progress    int       `json:"progress"`
	Target      int       `json:"target"`
	Completed   bool      `json:"completed"`
	CompletedAt time.Time `json:"completedAt,omitempty"`
	PeriodKey   string    `json:"periodKey,omitempty"`
}

var questTargets = map[string]int{
	"path.profile":      1,
	"path.first_training": 1,
	"training.ready":    1,
	"weekly.rhythm.2":   2,
	"weekly.rhythm.3":   3,
}

func (sm *SchoolModule) trackQuestLocked(studentID, questKey string, value int) {
	if sm.killSwitches["quest:"+questKey] {
		return
	}
	if sm.questProgress[studentID] == nil {
		sm.questProgress[studentID] = map[string]*QuestProgress{}
	}
	target := questTargets[questKey]
	if target == 0 {
		target = 1
	}
	q, ok := sm.questProgress[studentID][questKey]
	if !ok {
		q = &QuestProgress{QuestKey: questKey, Target: target}
		sm.questProgress[studentID][questKey] = q
	}
	if q.Completed {
		return
	}
	if value > q.Progress {
		q.Progress = value
	}
	if q.Progress >= q.Target {
		q.Completed = true
		q.CompletedAt = time.Now().UTC()
		sm.grantQuestRewardLocked(studentID, questKey)
	}
}

func (sm *SchoolModule) grantQuestRewardLocked(studentID, questKey string) {
	s, ok := sm.p.students[studentID]
	if !ok || s.CharacterID == "" {
		return
	}
	xp := int64(100)
	switch questKey {
	case "path.first_training", "training.ready":
		xp = 500
	case "weekly.rhythm.2":
		xp = 300
	case "weekly.rhythm.3":
		xp = 500
	}
	_, _, _ = sm.p.GrantQuestXP(s.CharacterID, questKey, xp)
}

func (sm *SchoolModule) QuestProgressForStudent(studentID string) []QuestProgress {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	m := sm.questProgress[studentID]
	out := make([]QuestProgress, 0, len(m))
	for _, q := range m {
		out = append(out, *q)
	}
	return out
}
