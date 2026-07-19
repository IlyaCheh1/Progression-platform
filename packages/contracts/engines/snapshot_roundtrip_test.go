package engines

import (
	"testing"
	"time"

	"github.com/masterofsword/contracts/school"
)

func TestSnapshotRoundtripExtendedFields(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{ID: "g1", Login: "g@local", Password: "x", Role: RoleGuardian, Mastery: map[string]int64{}, Ranks: map[string]int{}})
	p.UpsertStudent(Student{ID: "s1", Login: "s@local", Password: "x", Mastery: map[string]int64{}, Ranks: map[string]int{}})
	_ = p.LinkGuardian("g1", "s1")
	p.School.SetMinor("s1", true)
	p.School.battlePass["s1"] = &BattlePassState{StudentID: "s1", PassXP: 100, Tier: 1, ClaimedFree: map[int]bool{1: true}}
	p.School.talentUnlocks["s1"] = map[string]bool{"t1": true}
	p.School.reserve["r1"] = &school.Reservation{ID: "r1", HallID: "hall-main", StartsAt: time.Now(), EndsAt: time.Now().Add(time.Hour)}

	snap := p.ExportSnapshot()
	p2 := NewPlatform()
	p2.RestoreSnapshot(snap)

	if len(p2.guardianLinks["g1"]) != 1 {
		t.Fatalf("guardian links lost")
	}
	if !p2.School.isMinor["s1"] {
		t.Fatal("minor flag lost")
	}
	if p2.School.battlePass["s1"] == nil || p2.School.battlePass["s1"].PassXP != 100 {
		t.Fatal("battle pass lost")
	}
	if !p2.School.talentUnlocks["s1"]["t1"] {
		t.Fatal("talents lost")
	}
	if p2.School.reserve["r1"] == nil {
		t.Fatal("reservations lost")
	}
}
