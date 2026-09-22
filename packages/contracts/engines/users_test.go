package engines

import (
	"strings"
	"testing"

	"github.com/masterofsword/contracts/rbac"
)

func TestUserCRUD(t *testing.T) {
	p := NewPlatform()
	created, err := p.CreateUser(UserInput{
		DisplayName: "Demo Coach",
		Login:       "demo.coach@test.local",
		Password:    "pass-coach",
		Role:        RoleCoach,
	})
	if err != nil {
		t.Fatal(err)
	}
	if created.Role != RoleCoach {
		t.Fatalf("role=%q", created.Role)
	}

	updated, err := p.UpdateUser(created.ID, UserInput{
		DisplayName: "Coach Updated",
		Role:        RoleCoach,
	})
	if err != nil {
		t.Fatal(err)
	}
	if updated.DisplayName != "Coach Updated" {
		t.Fatalf("name=%q", updated.DisplayName)
	}

	if !p.HasPermission(created.ID, rbac.PermAttendanceConfirm) {
		t.Fatal("coach must confirm attendance")
	}

	if err := p.DeleteUser(created.ID); err != nil {
		t.Fatal(err)
	}
	if _, ok := p.GetStudent(created.ID); ok {
		t.Fatal("user must be deleted")
	}
}

func TestEnsureUserFromOnlyIDCreatesStudent(t *testing.T) {
	p := NewPlatform()
	first, created, err := p.EnsureUserFromOnlyID("new.hero@example.com", "New Hero", "user_abc")
	if err != nil || !created {
		t.Fatalf("create: created=%v err=%v", created, err)
	}
	if first.Login != "new.hero@example.com" || first.DisplayName != "New Hero" {
		t.Fatalf("unexpected user: %+v", first)
	}
	if first.NormalizedRole() != RoleStudent {
		t.Fatalf("role=%q", first.NormalizedRole())
	}
	if !first.ProfileComplete {
		t.Fatal("new OnlyID users must open profile without onboarding")
	}
	if first.ProfileUsername != "New Hero" {
		t.Fatalf("username=%q", first.ProfileUsername)
	}

	again, createdAgain, err := p.EnsureUserFromOnlyID("New.Hero@example.com", "Ignored", "user_abc")
	if err != nil || createdAgain {
		t.Fatalf("idempotent: created=%v err=%v", createdAgain, err)
	}
	if again.ID != first.ID {
		t.Fatalf("expected same student id %q got %q", first.ID, again.ID)
	}
}

func TestEnsureUserFromOnlyIDBindsAdminEmail(t *testing.T) {
	const email = "ilya@spacecyborg.ru"
	p := NewPlatform()
	created, isNew, err := p.EnsureUserFromOnlyID(email, "Owner", "onlyid-sub")
	if err != nil || !isNew {
		t.Fatalf("create: new=%v err=%v", isNew, err)
	}
	if !created.IsPlatformAdmin() {
		t.Fatal("bound email must be created as administrator")
	}
	if created.Password == "" || !strings.HasPrefix(created.Password, "onlyid:") {
		t.Fatal("provision must keep an unusable OnlyID password")
	}

	again, isNewAgain, err := p.EnsureUserFromOnlyID("ILYA@SPACECYBORG.RU", "Owner", "onlyid-sub")
	if err != nil || isNewAgain || again.ID != created.ID || !again.IsPlatformAdmin() {
		t.Fatalf("repeat login: new=%v id=%s admin=%v err=%v", isNewAgain, again.ID, again.IsPlatformAdmin(), err)
	}

	existing := NewPlatform()
	existing.UpsertStudent(Student{
		ID: "already", Login: email, Password: "kept-secret", Role: RoleStudent, Roles: []string{RoleStudent},
	})
	promoted, isNew, err := existing.EnsureUserFromOnlyID(email, "Owner", "onlyid-sub")
	if err != nil || isNew || !promoted.IsPlatformAdmin() {
		t.Fatalf("promote: new=%v admin=%v err=%v", isNew, promoted.IsPlatformAdmin(), err)
	}
	if promoted.Password != "kept-secret" {
		t.Fatal("promotion must not replace the existing password")
	}
}

func TestAdministratorCanManageUsers(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{
		ID: "admin-1", Login: "admin@test.local", Password: "pass", Role: RoleAdministrator,
	})
	if !p.HasPermission("admin-1", rbac.PermUsersDelete) {
		t.Fatal("administrator must delete users")
	}
}
