package rbac

import "testing"

func TestAdministratorHasFullAccess(t *testing.T) {
	for _, role := range []string{RoleAdministrator, RolePlatformAdmin} {
		for _, perm := range allPermissions {
			if !HasPermission(role, perm) {
				t.Fatalf("role %q missing permission %q", role, perm)
			}
		}
		if !CanManageUsers(role) {
			t.Fatalf("role %q must manage users", role)
		}
	}
}

func TestCoachCanConfirmAttendanceOnly(t *testing.T) {
	if !HasPermission(RoleCoach, PermAttendanceConfirm) {
		t.Fatal("coach must confirm attendance")
	}
	if HasPermission(RoleCoach, PermUsersCreate) {
		t.Fatal("coach must not create users")
	}
}

func TestStudentCannotManageUsers(t *testing.T) {
	if HasPermission(RoleStudent, PermUsersDelete) {
		t.Fatal("student must not delete users")
	}
}

func TestMultiRoleAdministratorAndCoach(t *testing.T) {
	roles := []string{RoleAdministrator, RoleCoach}
	if !HasPermissionForRoles(roles, PermAttendanceConfirm) {
		t.Fatal("admin+coach must confirm attendance")
	}
	if !IsAdministratorInRoles(roles) {
		t.Fatal("admin+coach must remain administrator")
	}
}

func TestNormalizeRoleDefaultsToStudent(t *testing.T) {
	if NormalizeRole("") != RoleStudent {
		t.Fatal("empty role must default to student")
	}
	if NormalizeRole("unknown") != RoleStudent {
		t.Fatal("unknown role must default to student")
	}
}
