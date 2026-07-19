package engines_test

import (
	"testing"

	"github.com/masterofsword/contracts/engines"
)

func TestMinorPublicShareBlocked(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "minor1", Login: "m@local", Password: "x", Mastery: map[string]int64{}, Ranks: map[string]int{}})
	p.School.SetMinor("minor1", true)
	if err := p.RequestPublicShare("minor1"); err == nil {
		t.Fatal("expected minor share block")
	}
}

func TestLeaderboardExcludesMinor(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "minor1", Login: "m@local", Password: "x", CharacterID: "c1", Mastery: map[string]int64{}, Ranks: map[string]int{}})
	p.UpsertStudent(engines.Student{ID: "adult1", Login: "a@local", Password: "x", CharacterID: "c2", Mastery: map[string]int64{}, Ranks: map[string]int{}})
	p.School.SetMinor("minor1", true)
	_, _ = p.CreateCharacter("c1", "u1")
	_, _ = p.CreateCharacter("c2", "u2")
	_, _, err := p.RecordAttendance("c2", "att-leader-1", 5000)
	if err != nil {
		t.Fatal(err)
	}
	board := p.Leaderboard(10)
	for _, row := range board {
		if row.StudentID == "minor1" {
			t.Fatal("minor on leaderboard")
		}
	}
}
