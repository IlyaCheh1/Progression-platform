package engines

import (
	"fmt"
	"time"

	"github.com/masterofsword/contracts/school"
)

// CohortRow groups students by signup month (proxy: first membership or account id prefix).
type CohortRow struct {
	CohortMonth    string `json:"cohortMonth"`
	Students       int    `json:"students"`
	ActiveMembers  int    `json:"activeMembers"`
	AvgAttendance  int    `json:"avgAttendance"`
}

// ChurnRow summarizes inactive students in a window.
type ChurnRow struct {
	WindowDays     int `json:"windowDays"`
	AtRiskStudents int `json:"atRiskStudents"`
	Churned        int `json:"churned"`
}

// HallHeatCell is utilization for one hall/day/hour bucket.
type HallHeatCell struct {
	HallID string `json:"hallId"`
	Day    string `json:"day"`
	Hour   int    `json:"hour"`
	Count  int    `json:"count"`
}

// AnalyticsCohorts builds simple cohort table from in-memory state.
func (p *Platform) AnalyticsCohorts() []CohortRow {
	p.mu.Lock()
	students := make([]*Student, 0, len(p.students))
	for _, s := range p.students {
		students = append(students, s)
	}
	p.mu.Unlock()

	byMonth := map[string]*CohortRow{}
	for _, s := range students {
		month := "unknown"
		if len(s.ID) >= 7 {
			month = s.ID[:7]
		}
		row, ok := byMonth[month]
		if !ok {
			row = &CohortRow{CohortMonth: month}
			byMonth[month] = row
		}
		row.Students++
		if p.School != nil {
			if m, ok := p.School.MembershipForStudent(s.ID); ok && m.Status == "active" {
				row.ActiveMembers++
			}
			row.AvgAttendance += p.School.AttendanceCountFor(s.ID)
		}
	}
	out := make([]CohortRow, 0, len(byMonth))
	for _, row := range byMonth {
		if row.Students > 0 {
			row.AvgAttendance = row.AvgAttendance / row.Students
		}
		out = append(out, *row)
	}
	return out
}

// AnalyticsChurn flags students with zero recent attendance.
func (p *Platform) AnalyticsChurn(windowDays int) ChurnRow {
	if windowDays <= 0 {
		windowDays = 30
	}
	row := ChurnRow{WindowDays: windowDays}
	if p.School == nil {
		return row
	}
	p.mu.Lock()
	students := make([]*Student, 0, len(p.students))
	for _, s := range p.students {
		if s.NormalizedRole() == RoleStudent {
			students = append(students, s)
		}
	}
	p.mu.Unlock()
	for _, s := range students {
		n := p.School.AttendanceCountFor(s.ID)
		if n == 0 {
			row.Churned++
		} else if n < 2 {
			row.AtRiskStudents++
		}
	}
	return row
}

// AnalyticsHallHeatmap aggregates session starts by hall/day/hour.
func (p *Platform) AnalyticsHallHeatmap(from, to time.Time) []HallHeatCell {
	if p.School == nil {
		return nil
	}
	sessions := p.School.ListSessions(from, to)
	buckets := map[string]HallHeatCell{}
	for _, sess := range sessions {
		if sess.Cancelled {
			continue
		}
		day := sess.StartsAt.Format("2006-01-02")
		hour := sess.StartsAt.Hour()
		key := fmt.Sprintf("%s|%s|%d", sess.HallID, day, hour)
		cell := buckets[key]
		cell.HallID = sess.HallID
		cell.Day = day
		cell.Hour = hour
		cell.Count++
		buckets[key] = cell
	}
	out := make([]HallHeatCell, 0, len(buckets))
	for _, c := range buckets {
		out = append(out, c)
	}
	return out
}

// SessionsForStudent returns sessions where student has a booking.
func (sm *SchoolModule) SessionsForStudent(studentID string) []school.Session {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sessionIDs := map[string]struct{}{}
	for _, b := range sm.bookings {
		if b.StudentID == studentID && b.Status != "cancelled" && b.SessionID != "" {
			sessionIDs[b.SessionID] = struct{}{}
		}
	}
	out := make([]school.Session, 0, len(sessionIDs))
	for id := range sessionIDs {
		if s, ok := sm.sessions[id]; ok && !s.Cancelled {
			out = append(out, *s)
		}
	}
	return out
}

func (sm *SchoolModule) AttendanceCountFor(studentID string) int {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	return sm.attendanceCount[studentID]
}
