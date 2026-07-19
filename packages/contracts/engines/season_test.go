package engines_test

import (
	"testing"
	"time"

	"github.com/masterofsword/contracts/engines"
)

func TestSeasonAndBattlePass(t *testing.T) {
	p := engines.NewPlatform()
	now := time.Now().UTC()
	p.School.ActivateSeason("eight_paths", now, now.Add(90*24*time.Hour))
	bp, err := p.School.GrantPassXP("s1", 1000)
	if err != nil {
		t.Fatal(err)
	}
	if bp.Tier < 2 {
		t.Fatalf("tier=%d", bp.Tier)
	}
}

func TestRentalConflict(t *testing.T) {
	p := engines.NewPlatform()
	start := time.Now().UTC().Add(48 * time.Hour)
	end := start.Add(2 * time.Hour)
	_, err := p.School.CreateRentalBooking("hall-main", start, end, "renter-1")
	if err != nil {
		t.Fatal(err)
	}
	_, err = p.School.CreateRentalBooking("hall-main", start.Add(30*time.Minute), end.Add(30*time.Minute), "renter-2")
	if err == nil {
		t.Fatal("expected conflict")
	}
}
