package profile_test

import (
	"testing"

	"github.com/masterofsword/contracts/engines"
)

func TestUpdateStudentProfileCompletesOnboarding(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{
		ID:          "s1",
		DisplayName: "Seed User",
		Login:       "demo@test.local",
		Password:    "secret",
		CharacterID: "char-s1",
	})

	view, err := p.UpdateStudentProfile("s1", engines.ProfileInput{
		Username:        "Алиса",
		Skin:            "scholar",
		Gender:          "FEMALE",
		BackgroundKey:   "5",
		ProfileComplete: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if !view.ProfileComplete {
		t.Fatal("expected profileComplete=true")
	}
	if view.Username != "Алиса" || view.Skin != "scholar" || view.Gender != "FEMALE" {
		t.Fatalf("unexpected profile: %+v", view)
	}

	st, _ := p.GetStudent("s1")
	if st.DisplayName != "Алиса" {
		t.Fatalf("displayName=%q", st.DisplayName)
	}
}

func TestUpdateStudentProfileRejectsInvalidSkin(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "s1", Login: "x@local", Password: "p"})
	if _, err := p.UpdateStudentProfile("s1", engines.ProfileInput{Skin: "invalid"}); err == nil {
		t.Fatal("expected invalid_skin error")
	}
}

func TestProfileForStudentIncludesCharacterProgress(t *testing.T) {
	p := engines.NewPlatform()
	if _, err := p.CreateCharacter("char-1", "user-1"); err != nil {
		t.Fatal(err)
	}
	p.UpsertStudent(engines.Student{
		ID: "s1", Login: "x@local", Password: "p", CharacterID: "char-1",
		ProfileComplete: true, ProfileUsername: "Hero", Skin: "duelist", Gender: "MALE",
	})

	view, err := p.ProfileForStudent("s1")
	if err != nil {
		t.Fatal(err)
	}
	if !view.ProfileComplete || view.Username != "Hero" {
		t.Fatalf("profile view: %+v", view)
	}
	if view.Level < 1 {
		t.Fatalf("level=%d", view.Level)
	}
}
