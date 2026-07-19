package engines

import (
	"fmt"

	"github.com/masterofsword/contracts/school"
)

// DependantSummary is policy-filtered view for guardians (E2E-12).
type DependantSummary struct {
	StudentID       string              `json:"studentId"`
	DisplayName     string              `json:"displayName"`
	Level           int                 `json:"level"`
	AttendanceCount int                 `json:"attendanceCount"`
	MaxRank         int                 `json:"maxRank"`
	HasMembership   bool                `json:"hasMembership"`
	Schedule        []school.Session    `json:"schedule"`
	Payments        []school.Payment    `json:"payments"`
	ProgressPrivate bool                `json:"progressPrivate"`
}

// LinkGuardian associates a guardian with a dependant student.
func (p *Platform) LinkGuardian(guardianID, studentID string) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if _, ok := p.students[guardianID]; !ok {
		return fmt.Errorf("guardian not found")
	}
	if _, ok := p.students[studentID]; !ok {
		return fmt.Errorf("student not found")
	}
	for _, id := range p.guardianLinks[guardianID] {
		if id == studentID {
			return nil
		}
	}
	p.guardianLinks[guardianID] = append(p.guardianLinks[guardianID], studentID)
	return nil
}

// CanViewDependant reports whether actor may read dependant operational data.
func (p *Platform) CanViewDependant(actorID, studentID string) bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	actor, ok := p.students[actorID]
	if !ok {
		return false
	}
	if actor.IsPlatformAdmin() || actorID == studentID {
		return true
	}
	return p.guardianLinkedLocked(actorID, studentID)
}

func (p *Platform) guardianLinkedLocked(guardianID, studentID string) bool {
	for _, id := range p.guardianLinks[guardianID] {
		if id == studentID {
			return true
		}
	}
	return false
}

// ListDependantIDs returns student IDs linked to a guardian.
func (p *Platform) ListDependantIDs(guardianID string) []string {
	p.mu.Lock()
	defer p.mu.Unlock()
	out := append([]string{}, p.guardianLinks[guardianID]...)
	return out
}

// DependantSummaryFor builds guardian-safe summary for one dependant.
func (p *Platform) DependantSummaryFor(guardianID, studentID string) (*DependantSummary, error) {
	if !p.CanViewDependant(guardianID, studentID) {
		return nil, fmt.Errorf("forbidden")
	}
	p.mu.Lock()
	st, ok := p.students[studentID]
	if !ok {
		p.mu.Unlock()
		return nil, fmt.Errorf("not_found")
	}
	displayName := profileUsername(st)
	level := 1
	if st.CharacterID != "" {
		if c, ok := p.characters[st.CharacterID]; ok {
			if lvl, _, _, err := p.track.Progress(c.XP); err == nil {
				level = lvl
			} else {
				level = c.Level
			}
		}
	}
	maxRank := 0
	for _, r := range st.Ranks {
		if r > maxRank {
			maxRank = r
		}
	}
	p.mu.Unlock()

	private := false
	if p.School != nil {
		private = p.School.IsProgressionPrivate(studentID)
	}

	sum := &DependantSummary{
		StudentID:       studentID,
		DisplayName:     displayName,
		Level:           level,
		MaxRank:         maxRank,
		ProgressPrivate: private,
	}
	if p.School != nil {
		sum.AttendanceCount = p.School.AttendanceCountFor(studentID)
		if m, ok := p.School.MembershipForStudent(studentID); ok {
			sum.HasMembership = m.Status == "active"
		}
		sum.Payments = p.School.ListPayments(studentID)
		sum.Schedule = p.School.SessionsForStudent(studentID)
	}
	return sum, nil
}
