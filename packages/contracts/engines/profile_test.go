package engines_test

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
		SelectedSkinID:    "8",
		Gender:          "FEMALE",
		BackgroundKey:   "northern_lights",
		ProfileComplete: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if !view.ProfileComplete {
		t.Fatal("expected profileComplete=true")
	}
	if view.Username != "Алиса" || view.SelectedSkinID != "8" || view.Gender != "FEMALE" {
		t.Fatalf("unexpected profile: %+v", view)
	}

	st, _ := p.GetStudent("s1")
	if st.DisplayName != "Алиса" {
		t.Fatalf("displayName=%q", st.DisplayName)
	}
}

func TestUpdateStudentProfileRejectsInvalidCharacter(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "s1", Login: "x@local", Password: "p"})
	if _, err := p.UpdateStudentProfile("s1", engines.ProfileInput{SelectedSkinID: "99"}); err == nil {
		t.Fatal("expected invalid_character error")
	}
}

func TestUpdateStudentProfileMigratesLegacySkin(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "s1", Login: "x@local", Password: "p"})

	view, err := p.UpdateStudentProfile("s1", engines.ProfileInput{
		Username: "Hero",
		Skin:     "scholar",
		Gender:   "MALE",
	})
	if err != nil {
		t.Fatal(err)
	}
	if view.SelectedSkinID != "3" {
		t.Fatalf("selectedSkinId=%q want 3", view.SelectedSkinID)
	}
}

func TestUpdateStudentProfileAllowsNicknameWithoutReowningCurrentSkin(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "s1", Login: "x@local", Password: "p"})
	if _, err := p.UpdateStudentProfile("s1", engines.ProfileInput{
		Username: "Hero", SelectedSkinID: "3", Gender: "MALE",
		BackgroundKey: "northern_lights", ProfileComplete: true,
	}); err != nil {
		t.Fatal(err)
	}

	view, err := p.UpdateStudentProfile("s1", engines.ProfileInput{
		Username:       "НовыйНик",
		SelectedSkinID: "3",
		Gender:         "MALE",
		BackgroundKey:  "northern_lights",
	})
	if err != nil {
		t.Fatal(err)
	}
	if view.Username != "НовыйНик" {
		t.Fatalf("username=%q", view.Username)
	}
}

func TestUpdateStudentProfileStoresAvatarURL(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "s1", Login: "x@local", Password: "p", ProfileComplete: true})
	avatar := "data:image/png;base64,iVBORw0KGgo="
	view, err := p.UpdateStudentProfile("s1", engines.ProfileInput{
		Username: "Hero",
		AvatarURL: &avatar,
	})
	if err != nil {
		t.Fatal(err)
	}
	if view.AvatarURL != avatar {
		t.Fatalf("avatarUrl=%q", view.AvatarURL)
	}
	cleared := ""
	view, err = p.UpdateStudentProfile("s1", engines.ProfileInput{AvatarURL: &cleared})
	if err != nil {
		t.Fatal(err)
	}
	if view.AvatarURL != "" {
		t.Fatalf("expected cleared avatar, got %q", view.AvatarURL)
	}
}

func TestUpdateStudentProfileStoresHTTPSAvatarURL(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "s1", Login: "x@local", Password: "p", ProfileComplete: true})
	avatar := "https://cdn.example.selstorage.ru/media/avatars/s1/photo.webp"
	view, err := p.UpdateStudentProfile("s1", engines.ProfileInput{
		Username:  "Hero",
		AvatarURL: &avatar,
	})
	if err != nil {
		t.Fatal(err)
	}
	if view.AvatarURL != avatar {
		t.Fatalf("avatarUrl=%q", view.AvatarURL)
	}
}

func TestUpdateStudentProfileRejectsHTTPAvatarURL(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "s1", Login: "x@local", Password: "p", ProfileComplete: true})
	avatar := "http://cdn.example.selstorage.ru/media/avatars/s1/photo.webp"
	_, err := p.UpdateStudentProfile("s1", engines.ProfileInput{AvatarURL: &avatar})
	if err == nil || err.Error() != "invalid_avatar" {
		t.Fatalf("expected invalid_avatar, got %v", err)
	}
}

func TestProfileForStudentIncludesCharacterProgress(t *testing.T) {
	p := engines.NewPlatform()
	if _, err := p.CreateCharacter("char-1", "user-1"); err != nil {
		t.Fatal(err)
	}
	p.UpsertStudent(engines.Student{
		ID: "s1", Login: "x@local", Password: "p", CharacterID: "char-1",
		ProfileComplete: true, ProfileUsername: "Hero", SelectedSkinID: "4", Gender: "MALE",
	})

	view, err := p.ProfileForStudent("s1")
	if err != nil {
		t.Fatal(err)
	}
	if !view.ProfileComplete || view.Username != "Hero" || view.SelectedSkinID != "4" {
		t.Fatalf("profile view: %+v", view)
	}
	if view.Level < 1 {
		t.Fatalf("level=%d", view.Level)
	}
}
