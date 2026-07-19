package engines

import (
	"fmt"
	"sort"
)

// LeaderboardEntry is a public-safe ranking row (minors excluded).
type LeaderboardEntry struct {
	StudentID   string `json:"studentId"`
	DisplayName string `json:"displayName"`
	Level       int    `json:"level"`
	XP          int64  `json:"xp"`
}

// RequestPublicShare attempts to enable public profile sharing (blocked for minors).
func (p *Platform) RequestPublicShare(studentID string) error {
	if p.School != nil && p.School.IsProgressionPrivate(studentID) {
		return fmt.Errorf("minor_public_share_forbidden")
	}
	return fmt.Errorf("public_share_not_enabled")
}

// Leaderboard returns top students by level, excluding minors.
func (p *Platform) Leaderboard(limit int) []LeaderboardEntry {
	if limit <= 0 {
		limit = 10
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	rows := make([]LeaderboardEntry, 0, len(p.students))
	for _, s := range p.students {
		if p.School != nil && p.School.IsProgressionPrivate(s.ID) {
			continue
		}
		if s.CharacterID == "" {
			continue
		}
		c, ok := p.characters[s.CharacterID]
		if !ok {
			continue
		}
		level := c.Level
		xp := c.XP
		if lvl, _, _, err := p.track.Progress(c.XP); err == nil {
			level = lvl
		}
		name := profileUsername(s)
		if name == "" {
			name = s.DisplayName
		}
		rows = append(rows, LeaderboardEntry{
			StudentID:   s.ID,
			DisplayName: name,
			Level:       level,
			XP:          xp,
		})
	}
	sort.Slice(rows, func(i, j int) bool {
		if rows[i].Level != rows[j].Level {
			return rows[i].Level > rows[j].Level
		}
		return rows[i].XP > rows[j].XP
	})
	if len(rows) > limit {
		rows = rows[:limit]
	}
	return rows
}

// PublicStudentView redacts fields for unauthorized viewers.
func (p *Platform) PublicStudentView(viewerID, targetID string) (*ProfileView, error) {
	if !p.canViewStudentProgress(viewerID, targetID) {
		return nil, fmt.Errorf("forbidden")
	}
	view, err := p.ProfileForStudent(targetID)
	if err != nil {
		return nil, err
	}
	if p.School != nil && p.School.IsProgressionPrivate(targetID) && viewerID != targetID && !p.CanViewDependant(viewerID, targetID) {
		view.Mastery = map[string]int64{}
		view.Ranks = map[string]int{}
		view.Username = ""
		view.DisplayName = "Private student"
	}
	return view, nil
}

func (p *Platform) canViewStudentProgress(viewerID, targetID string) bool {
	if viewerID == targetID {
		return true
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	viewer, ok := p.students[viewerID]
	if !ok {
		return false
	}
	if viewer.IsPlatformAdmin() {
		return true
	}
	return p.guardianLinkedLocked(viewerID, targetID)
}
