package engines_test

import (
	"fmt"
	"testing"
	"time"

	"github.com/masterofsword/contracts/engines"
	"github.com/masterofsword/contracts/school"
)

func TestWaitlistJoinAndClaim(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "s1", Login: "w1@local", Password: "x", Mastery: map[string]int64{}, Ranks: map[string]int{}})
	now := time.Now().UTC()
	p.School.UpsertSession(school.Session{
		ID: "sess-test-1", HallID: "hall-main", GroupKey: "test-group", Title: "Test session",
		StartsAt: now.Add(24 * time.Hour), EndsAt: now.Add(26 * time.Hour), Capacity: 16, Enrolled: 0,
	})
	sess := p.School.ListSessions(time.Time{}, time.Time{})
	if len(sess) == 0 {
		t.Fatal("expected test session")
	}
	id := sess[0].ID
	var lastBookingID string
	for i := 0; i < sess[0].Capacity; i++ {
		b, err := p.School.CreateTrialBooking(id, "", fmt.Sprintf("fill-%d", i))
		if err != nil {
			t.Fatal(err)
		}
		lastBookingID = b.ID
	}
	e, err := p.School.JoinWaitlist(id, "s1")
	if err != nil {
		t.Fatal(err)
	}
	if e.Position != 1 {
		t.Fatalf("position=%d", e.Position)
	}
	if err := p.School.CancelBooking(lastBookingID); err != nil {
		t.Fatal(err)
	}
	_, _ = p.School.OfferNextWaitlist(id)
	b, err := p.School.ClaimWaitlistOffer(e.ID, "s1")
	if err != nil {
		t.Fatal(err)
	}
	if b.Status != "confirmed" {
		t.Fatalf("status=%s", b.Status)
	}
}
