package engines_test

import (
	"testing"

	"github.com/masterofsword/contracts/engines"
)

func TestClaimRewardXPGrantsOnce(t *testing.T) {
	p := engines.NewPlatform()
	_, err := p.CreateCharacter("char-1", "user-1")
	if err != nil {
		t.Fatal(err)
	}
	p.UpsertStudent(engines.Student{
		ID: "s1", Login: "x@local", Password: "p", CharacterID: "char-1",
	})

	level, granted, already, err := p.ClaimRewardXP("s1", "achievement:start.inventory:0", 250)
	if err != nil {
		t.Fatal(err)
	}
	if already || granted != 250 {
		t.Fatalf("first claim: level=%d granted=%d already=%v", level, granted, already)
	}

	level2, granted2, already2, err := p.ClaimRewardXP("s1", "achievement:start.inventory:0", 250)
	if err != nil {
		t.Fatal(err)
	}
	if !already2 || granted2 != 0 {
		t.Fatalf("second claim: level=%d granted=%d already=%v", level2, granted2, already2)
	}

	profile, err := p.ProfileForStudent("s1")
	if err != nil {
		t.Fatal(err)
	}
	if profile.Level < 1 {
		t.Fatalf("profile level=%d", profile.Level)
	}
}
