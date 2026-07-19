package engines

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// SupportMessage is one chat line in a support case (E2E-13).
type SupportMessage struct {
	ID        string    `json:"id"`
	AuthorID  string    `json:"authorId"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
}

// SupportCase tracks reward/explainability issues; chat does not mutate state.
type SupportCase struct {
	ID               string           `json:"id"`
	StudentID        string           `json:"studentId"`
	Subject          string           `json:"subject"`
	Status           string           `json:"status"`
	TrainingRecordID string           `json:"trainingRecordId,omitempty"`
	Messages         []SupportMessage `json:"messages"`
	CreatedAt        time.Time        `json:"createdAt"`
	ResolvedAt       time.Time        `json:"resolvedAt,omitempty"`
	ResolutionNote   string           `json:"resolutionNote,omitempty"`
}

// CreateSupportCase opens a new case for the student.
func (p *Platform) CreateSupportCase(studentID, subject, trainingRecordID, initialBody string) (*SupportCase, error) {
	subject = trim(subject)
	if subject == "" {
		return nil, fmt.Errorf("subject_required")
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	if _, ok := p.students[studentID]; !ok {
		return nil, fmt.Errorf("student not found")
	}
	c := &SupportCase{
		ID:               uuid.NewString(),
		StudentID:        studentID,
		Subject:          subject,
		Status:           "open",
		TrainingRecordID: trim(trainingRecordID),
		CreatedAt:        time.Now().UTC(),
	}
	if initialBody != "" {
		c.Messages = append(c.Messages, SupportMessage{
			ID: uuid.NewString(), AuthorID: studentID, Body: initialBody, CreatedAt: time.Now().UTC(),
		})
	}
	p.supportCases[c.ID] = c
	return cloneSupportCase(c), nil
}

// ListSupportCasesForStudent returns cases owned by the student.
func (p *Platform) ListSupportCasesForStudent(studentID string) []SupportCase {
	p.mu.Lock()
	defer p.mu.Unlock()
	out := make([]SupportCase, 0)
	for _, c := range p.supportCases {
		if c.StudentID == studentID {
			out = append(out, *cloneSupportCase(c))
		}
	}
	return out
}

// ListSupportCases returns all cases (admin).
func (p *Platform) ListSupportCases(status string) []SupportCase {
	p.mu.Lock()
	defer p.mu.Unlock()
	out := make([]SupportCase, 0, len(p.supportCases))
	for _, c := range p.supportCases {
		if status == "" || c.Status == status {
			out = append(out, *cloneSupportCase(c))
		}
	}
	return out
}

// AddSupportMessage appends a chat message without changing game state.
func (p *Platform) AddSupportMessage(caseID, authorID, body string) (*SupportCase, error) {
	body = trim(body)
	if body == "" {
		return nil, fmt.Errorf("body_required")
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	c, ok := p.supportCases[caseID]
	if !ok {
		return nil, fmt.Errorf("not_found")
	}
	if c.Status == "resolved" {
		return nil, fmt.Errorf("case_closed")
	}
	c.Messages = append(c.Messages, SupportMessage{
		ID: uuid.NewString(), AuthorID: authorID, Body: body, CreatedAt: time.Now().UTC(),
	})
	return cloneSupportCase(c), nil
}

// ResolveSupportCase closes a case; optional training correction is applied separately.
func (p *Platform) ResolveSupportCase(caseID, note string, applyCorrection bool) (*SupportCase, error) {
	p.mu.Lock()
	c, ok := p.supportCases[caseID]
	if !ok {
		p.mu.Unlock()
		return nil, fmt.Errorf("not_found")
	}
	recordID := c.TrainingRecordID
	studentID := c.StudentID
	p.mu.Unlock()

	if applyCorrection && recordID != "" && p.School != nil {
		rec, ok := p.School.GetTrainingRecord(recordID)
		if ok && rec.Status == "confirmed" {
			_, err := p.School.CorrectTrainingRecord(recordID, "support:"+caseID, rec.Entries)
			if err != nil {
				return nil, err
			}
		}
	}

	p.mu.Lock()
	defer p.mu.Unlock()
	c, ok = p.supportCases[caseID]
	if !ok {
		return nil, fmt.Errorf("not_found")
	}
	c.Status = "resolved"
	c.ResolutionNote = trim(note)
	c.ResolvedAt = time.Now().UTC()
	_ = studentID
	return cloneSupportCase(c), nil
}

func cloneSupportCase(c *SupportCase) *SupportCase {
	cp := *c
	cp.Messages = append([]SupportMessage{}, c.Messages...)
	return &cp
}

func trim(s string) string {
	for len(s) > 0 && (s[0] == ' ' || s[0] == '\t' || s[0] == '\n') {
		s = s[1:]
	}
	for len(s) > 0 && (s[len(s)-1] == ' ' || s[len(s)-1] == '\t' || s[len(s)-1] == '\n') {
		s = s[:len(s)-1]
	}
	return s
}
