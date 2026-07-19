package admincontent

import (
	"fmt"
	"strings"
)

type ValidationIssue struct {
	Level   string `json:"level"` // error | warn
	Entity  string `json:"entity"`
	Key     string `json:"key"`
	Message string `json:"message"`
}

type ValidationReport struct {
	OK     bool              `json:"ok"`
	Issues []ValidationIssue   `json:"issues"`
	Counts map[string]int    `json:"counts"`
}

func (s *Store) Validate() ValidationReport {
	s.mu.Lock()
	defer s.mu.Unlock()
	report := ValidationReport{
		Counts: map[string]int{
			"quests": len(s.quests), "achievements": len(s.achievements),
			"talents": len(s.talents), "items": len(s.items),
			"rewards": len(s.rewards), "schools": len(s.schools),
		},
	}
	keys := map[string]string{}
	check := func(entity, key, msg string) {
		if key == "" {
			report.Issues = append(report.Issues, ValidationIssue{Level: "error", Entity: entity, Message: msg})
			return
		}
		fq := entity + ":" + key
		if prev, ok := keys[fq]; ok {
			report.Issues = append(report.Issues, ValidationIssue{
				Level: "error", Entity: entity, Key: key,
				Message: fmt.Sprintf("duplicate key with %s", prev),
			})
		}
		keys[fq] = entity
	}
	for k, q := range s.quests {
		check("quests", k, "empty quest key")
		if q.Title == "" {
			report.Issues = append(report.Issues, ValidationIssue{Level: "error", Entity: "quests", Key: k, Message: "title required"})
		}
		if q.XP < 0 {
			report.Issues = append(report.Issues, ValidationIssue{Level: "warn", Entity: "quests", Key: k, Message: "negative xp"})
		}
	}
	for k, a := range s.achievements {
		check("achievements", k, "empty achievement key")
		if a.Title == "" {
			report.Issues = append(report.Issues, ValidationIssue{Level: "error", Entity: "achievements", Key: k, Message: "title required"})
		}
	}
	for k, it := range s.items {
		check("items", k, "empty item key")
		if !strings.HasPrefix(k, "school.fencing.") {
			report.Issues = append(report.Issues, ValidationIssue{Level: "warn", Entity: "items", Key: k, Message: "key should use school.fencing prefix"})
		}
	}
	for k, r := range s.rewards {
		check("rewards", k, "empty reward key")
		if r.Components == "" {
			report.Issues = append(report.Issues, ValidationIssue{Level: "warn", Entity: "rewards", Key: k, Message: "components empty"})
		}
	}
	report.OK = true
	for _, iss := range report.Issues {
		if iss.Level == "error" {
			report.OK = false
		}
	}
	return report
}

type SimulationResult struct {
	QuestKey     string `json:"questKey"`
	Target       int    `json:"target"`
	SampleXP     int    `json:"sampleXp"`
	Eligible     bool   `json:"eligible"`
	Explanation  string `json:"explanation"`
}

func (s *Store) SimulateQuest(questKey string, progress int) (SimulationResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	q, ok := s.quests[questKey]
	if !ok {
		return SimulationResult{}, fmt.Errorf("quest not found")
	}
	target := 1
	if questKey == "weekly.rhythm.2" {
		target = 2
	}
	if questKey == "weekly.rhythm.3" {
		target = 3
	}
	return SimulationResult{
		QuestKey: questKey, Target: target, SampleXP: q.XP,
		Eligible: progress >= target,
		Explanation: fmt.Sprintf("progress %d/%d → reward %d XP", progress, target, q.XP),
	}, nil
}
