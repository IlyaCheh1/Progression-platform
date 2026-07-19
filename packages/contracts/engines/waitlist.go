package engines

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/masterofsword/contracts/school"
)

func (sm *SchoolModule) JoinWaitlist(sessionID, studentID string) (*school.WaitlistEntry, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sess, ok := sm.sessions[sessionID]
	if !ok || sess.Cancelled {
		return nil, fmt.Errorf("session not found")
	}
	if sess.Enrolled < sess.Capacity {
		return nil, fmt.Errorf("session has capacity")
	}
	for _, w := range sm.waitlist {
		if w.SessionID == sessionID && w.StudentID == studentID && w.Status != "expired" {
			return nil, fmt.Errorf("already on waitlist")
		}
	}
	pos := 1
	for _, w := range sm.waitlist {
		if w.SessionID == sessionID && (w.Status == "waiting" || w.Status == "offered") {
			pos++
		}
	}
	e := &school.WaitlistEntry{
		ID: uuid.NewString(), SessionID: sessionID, StudentID: studentID,
		Position: pos, Status: "waiting", CreatedAt: time.Now().UTC(),
	}
	sm.waitlist[e.ID] = e
	return e, nil
}

func (sm *SchoolModule) ListWaitlist(sessionID string) []school.WaitlistEntry {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	out := make([]school.WaitlistEntry, 0)
	for _, w := range sm.waitlist {
		if sessionID == "" || w.SessionID == sessionID {
			out = append(out, *w)
		}
	}
	return out
}

// ClaimWaitlistOffer atomically enrolls student when capacity is available.
func (sm *SchoolModule) ClaimWaitlistOffer(entryID, studentID string) (*school.Booking, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	w, ok := sm.waitlist[entryID]
	if !ok {
		return nil, fmt.Errorf("waitlist entry not found")
	}
	if w.StudentID != studentID {
		return nil, fmt.Errorf("forbidden")
	}
	if w.Status != "offered" && w.Status != "waiting" {
		return nil, fmt.Errorf("not claimable")
	}
	if w.OfferExpiresAt.After(time.Time{}) && time.Now().UTC().After(w.OfferExpiresAt) {
		w.Status = "expired"
		return nil, fmt.Errorf("offer expired")
	}
	sess, ok := sm.sessions[w.SessionID]
	if !ok || sess.Enrolled >= sess.Capacity {
		return nil, fmt.Errorf("no capacity")
	}
	sess.Enrolled++
	w.Status = "claimed"
	b := &school.Booking{
		ID: uuid.NewString(), Type: "enrollment", SessionID: w.SessionID,
		StudentID: studentID, Status: "confirmed", CreatedAt: time.Now().UTC(),
	}
	sm.bookings[b.ID] = b
	return b, nil
}

func (sm *SchoolModule) OfferNextWaitlist(sessionID string) (*school.WaitlistEntry, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	var candidate *school.WaitlistEntry
	for _, w := range sm.waitlist {
		if w.SessionID != sessionID || w.Status != "waiting" {
			continue
		}
		if candidate == nil || w.Position < candidate.Position {
			cp := *w
			candidate = &cp
		}
	}
	if candidate == nil {
		return nil, fmt.Errorf("no waitlist")
	}
	w := sm.waitlist[candidate.ID]
	w.Status = "offered"
	w.OfferExpiresAt = time.Now().UTC().Add(24 * time.Hour)
	return w, nil
}

func (sm *SchoolModule) ListRentalsForStudent(studentID string) []school.Booking {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	out := make([]school.Booking, 0)
	for _, b := range sm.bookings {
		if b.Type == "rental" && b.StudentID == studentID {
			out = append(out, *b)
		}
	}
	return out
}

func (sm *SchoolModule) HallAvailability(hallID string, from, to time.Time) []school.Reservation {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	out := make([]school.Reservation, 0)
	for _, r := range sm.reserve {
		if r.HallID != hallID {
			continue
		}
		if !from.IsZero() && r.EndsAt.Before(from) {
			continue
		}
		if !to.IsZero() && r.StartsAt.After(to) {
			continue
		}
		out = append(out, *r)
	}
	for _, s := range sm.sessions {
		if s.HallID != hallID || s.Cancelled {
			continue
		}
		out = append(out, school.Reservation{
			ID: s.ID, HallID: s.HallID, Type: school.ReservationGroupSession,
			StartsAt: s.StartsAt, EndsAt: s.EndsAt,
		})
	}
	return out
}

func (sm *SchoolModule) RequestMasterRankReview(studentID, weaponKey string, rank int) (*school.MasterRankReview, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	if rank < 8 {
		return nil, fmt.Errorf("review required for rank 8+")
	}
	r := &school.MasterRankReview{
		ID: uuid.NewString(), StudentID: studentID, WeaponKey: weaponKey,
		RequestedRank: rank, Status: "pending", CreatedAt: time.Now().UTC(),
	}
	sm.rankReviews[r.ID] = r
	return r, nil
}

func (sm *SchoolModule) DecideMasterRankReview(reviewID, decision, note string) (*school.MasterRankReview, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	r, ok := sm.rankReviews[reviewID]
	if !ok {
		return nil, fmt.Errorf("review not found")
	}
	if decision != "approved" && decision != "rejected" {
		return nil, fmt.Errorf("invalid decision")
	}
	r.Status = decision
	r.ReviewerNote = note
	r.ReviewedAt = time.Now().UTC()
	return r, nil
}

func (sm *SchoolModule) ListMasterRankReviews(status string) []school.MasterRankReview {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	out := make([]school.MasterRankReview, 0)
	for _, r := range sm.rankReviews {
		if status == "" || r.Status == status {
			out = append(out, *r)
		}
	}
	return out
}
