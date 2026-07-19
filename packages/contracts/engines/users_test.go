package engines

import (
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

func TestAdministratorCanManageUsers(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{
		ID: "admin-1", Login: "admin@test.local", Password: "pass", Role: RoleAdministrator,
	})
	if !p.HasPermission("admin-1", rbac.PermUsersDelete) {
		t.Fatal("administrator must delete users")
	}
}
