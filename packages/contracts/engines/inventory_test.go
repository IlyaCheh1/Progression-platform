package engines_test

import (
	"testing"

	"github.com/masterofsword/contracts/engines"
)

func TestOnboardingGrantsCharactersAndBackgrounds(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{
		ID: "s1", Login: "demo@test.local", Password: "secret", CharacterID: "char-s1",
	})

	if _, err := p.UpdateStudentProfile("s1", engines.ProfileInput{
		Username:        "Воин",
		SelectedSkinID:  "3",
		Gender:          "MALE",
		BackgroundKey:   "northern_lights",
		ProfileComplete: true,
	}); err != nil {
		t.Fatal(err)
	}

	inv, err := p.InventoryForStudent("s1")
	if err != nil {
		t.Fatal(err)
	}
	if len(inv.Items) < 5 {
		t.Fatalf("expected starter cosmetics, got %d items: %+v", len(inv.Items), inv.Items)
	}

	chars, bgs := 0, 0
	ownedChars := map[string]bool{}
	ownedBgs := map[string]bool{}
	for _, item := range inv.Items {
		switch item.Kind {
		case engines.InventoryKindCharacter:
			chars++
			ownedChars[item.RefID] = true
		case engines.InventoryKindBackground:
			bgs++
			ownedBgs[item.RefID] = true
		}
	}
	if chars != 1 {
		t.Fatalf("characters=%d want 1", chars)
	}
	if bgs < 5 {
		t.Fatalf("backgrounds=%d want >=5", bgs)
	}
	for _, id := range []string{"3"} {
		if !ownedChars[id] {
			t.Fatalf("missing character %s", id)
		}
	}
	for _, id := range []string{"northern_lights", "mountain_terrace", "prison", "building_castle", "volcano"} {
		if !ownedBgs[id] {
			t.Fatalf("missing background %s", id)
		}
	}
	if inv.EquippedCharacterID != "3" || inv.EquippedBackgroundKey != "northern_lights" {
		t.Fatalf("equipped=%s/%s", inv.EquippedCharacterID, inv.EquippedBackgroundKey)
	}
}

func TestEquipOwnedCosmetics(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "s1", Login: "x@local", Password: "p"})
	if _, err := p.UpdateStudentProfile("s1", engines.ProfileInput{
		Username: "Hero", SelectedSkinID: "3", Gender: "MALE",
		BackgroundKey: "northern_lights", ProfileComplete: true,
	}); err != nil {
		t.Fatal(err)
	}

	inv, err := p.EquipInventoryItem("s1", engines.EquipInventoryInput{
		Kind: engines.InventoryKindCharacter, RefID: "3",
	})
	if err != nil {
		t.Fatal(err)
	}
	if inv.EquippedCharacterID != "3" {
		t.Fatalf("character=%s", inv.EquippedCharacterID)
	}

	inv, err = p.EquipInventoryItem("s1", engines.EquipInventoryInput{
		Kind: engines.InventoryKindBackground, RefID: "volcano",
	})
	if err != nil {
		t.Fatal(err)
	}
	if inv.EquippedBackgroundKey != "volcano" {
		t.Fatalf("background=%s", inv.EquippedBackgroundKey)
	}

	profile, err := p.ProfileForStudent("s1")
	if err != nil {
		t.Fatal(err)
	}
	if profile.SelectedSkinID != "3" || profile.BackgroundKey != "volcano" {
		t.Fatalf("profile not updated: %+v", profile)
	}
}

func TestEquipRejectsNotOwned(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "s1", Login: "x@local", Password: "p"})
	if _, err := p.UpdateStudentProfile("s1", engines.ProfileInput{
		Username: "Hero", SelectedSkinID: "3", Gender: "MALE",
		BackgroundKey: "northern_lights", ProfileComplete: true,
	}); err != nil {
		t.Fatal(err)
	}

	if _, err := p.EquipInventoryItem("s1", engines.EquipInventoryInput{
		Kind: engines.InventoryKindCharacter, RefID: "8",
	}); err == nil {
		t.Fatal("expected not_owned for female character on male account")
	}
	if _, err := p.UpdateStudentProfile("s1", engines.ProfileInput{
		SelectedSkinID: "8",
	}); err == nil {
		t.Fatal("expected character_not_owned")
	}
}
