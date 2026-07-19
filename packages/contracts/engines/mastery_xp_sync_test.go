package engines_test

import (
	"testing"

	"github.com/masterofsword/contracts/engines"
	"github.com/masterofsword/contracts/mastery"
	"github.com/masterofsword/contracts/progression"
)

func TestSyncCharacterXPFromMasteryRaisesLevel(t *testing.T) {
	p := engines.NewPlatform()
	if _, err := p.CreateCharacter("char-1", "user-1"); err != nil {
		t.Fatal(err)
	}
	// ~47344 display points ≈ Макс Киселев sum → level 43
	units := map[string]int64{
		"spada_e_scudo":    mastery.PointsToUnits(9064.74),
		"spada_a_due_mani": mastery.PointsToUnits(8806.87),
		"spadone":          mastery.PointsToUnits(8130.84),
		"spada_a_uno_mano": mastery.PointsToUnits(7896.92),
		"acia_alabarda":    mastery.PointsToUnits(7444.63),
		"due_spade":        mastery.PointsToUnits(2000),
		"spiedo_partesana": mastery.PointsToUnits(2000),
		"spiedo_e_scudo":   mastery.PointsToUnits(2000),
	}
	p.UpsertStudent(engines.Student{
		ID: "s1", Login: "x@local", Password: "p", CharacterID: "char-1",
		Mastery: units, Ranks: map[string]int{},
	})

	n := p.SyncCharacterXPFromMastery()
	if n != 1 {
		t.Fatalf("updated=%d want 1", n)
	}
	c, ok := p.GetCharacter("char-1")
	if !ok {
		t.Fatal("character missing")
	}
	wantXP := mastery.CharacterXPFromMasteryUnits(units)
	if c.XP != wantXP {
		t.Fatalf("xp=%d want %d", c.XP, wantXP)
	}
	wantLevel := progression.Standard100().LevelForXP(wantXP)
	if c.Level != wantLevel {
		t.Fatalf("level=%d want %d", c.Level, wantLevel)
	}
	view, err := p.ProfileForStudent("s1")
	if err != nil {
		t.Fatal(err)
	}
	if view.Level != wantLevel {
		t.Fatalf("profile level=%d want %d", view.Level, wantLevel)
	}
}

func TestSyncCharacterXPFromMasteryDoesNotDecrease(t *testing.T) {
	p := engines.NewPlatform()
	if _, err := p.CreateCharacter("char-1", "user-1"); err != nil {
		t.Fatal(err)
	}
	c, _ := p.GetCharacter("char-1")
	c.XP = 200_000
	c.Level = progression.Standard100().LevelForXP(c.XP)

	p.UpsertStudent(engines.Student{
		ID: "s1", Login: "x@local", Password: "p", CharacterID: "char-1",
		Mastery: map[string]int64{"spadone": mastery.PointsToUnits(1000)},
		Ranks:   map[string]int{},
	})
	if n := p.SyncCharacterXPFromMastery(); n != 0 {
		t.Fatalf("updated=%d want 0", n)
	}
	c, _ = p.GetCharacter("char-1")
	if c.XP != 200_000 {
		t.Fatalf("xp decreased to %d", c.XP)
	}
}
