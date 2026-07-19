package rbac

// Platform roles from TZ §24 (items 1–6 implemented in this slice).
const (
	RoleGuest         = "guest"
	RoleStudent       = "student"
	RoleGuardian      = "guardian"
	RoleCoach         = "coach"
	RoleRenter        = "renter"
	RoleAdministrator = "administrator"
	// Legacy local role — same privileges as administrator.
	RolePlatformAdmin = "platform_admin"
)

type Permission string

const (
	PermUsersRead         Permission = "users.read"
	PermUsersCreate       Permission = "users.create"
	PermUsersUpdate       Permission = "users.update"
	PermUsersDelete       Permission = "users.delete"
	PermContentRead       Permission = "content.read"
	PermContentWrite      Permission = "content.write"
	PermContentDelete     Permission = "content.delete"
	PermSchoolRead        Permission = "school.read"
	PermAttendanceConfirm Permission = "attendance.confirm"
	PermDependantsRead    Permission = "dependants.read"
	PermHallsRead         Permission = "halls.read"
)

var allPermissions = []Permission{
	PermUsersRead,
	PermUsersCreate,
	PermUsersUpdate,
	PermUsersDelete,
	PermContentRead,
	PermContentWrite,
	PermContentDelete,
	PermSchoolRead,
	PermAttendanceConfirm,
	PermDependantsRead,
	PermHallsRead,
}

var rolePermissions = map[string][]Permission{
	RoleStudent: {
		PermSchoolRead,
	},
	RoleGuardian: {
		PermDependantsRead,
		PermSchoolRead,
	},
	RoleCoach: {
		PermSchoolRead,
		PermAttendanceConfirm,
	},
	RoleRenter: {
		PermHallsRead,
	},
	RoleAdministrator: allPermissions,
	RolePlatformAdmin:   allPermissions,
}

// NormalizeRole maps empty/unknown values to student for authenticated principals.
func NormalizeRole(role string) string {
	if role == "" {
		return RoleStudent
	}
	if IsKnownRole(role) {
		return role
	}
	return RoleStudent
}

func IsKnownRole(role string) bool {
	switch role {
	case RoleGuest, RoleStudent, RoleGuardian, RoleCoach, RoleRenter, RoleAdministrator, RolePlatformAdmin:
		return true
	default:
		return false
	}
}

func IsAdministrator(role string) bool {
	role = NormalizeRole(role)
	return role == RoleAdministrator || role == RolePlatformAdmin
}

func PermissionsFor(role string) map[Permission]bool {
	role = NormalizeRole(role)
	grants := rolePermissions[role]
	if grants == nil {
		grants = rolePermissions[RoleStudent]
	}
	out := make(map[Permission]bool, len(grants))
	for _, p := range grants {
		out[p] = true
	}
	return out
}

func HasPermission(role string, perm Permission) bool {
	return PermissionsFor(role)[perm]
}

func CanManageUsers(role string) bool {
	role = NormalizeRole(role)
	return HasPermission(role, PermUsersCreate) &&
		HasPermission(role, PermUsersUpdate) &&
		HasPermission(role, PermUsersDelete)
}

func AssignableRoles() []string {
	return []string{
		RoleStudent,
		RoleGuardian,
		RoleCoach,
		RoleRenter,
		RoleAdministrator,
	}
}

var rolePriority = []string{
	RolePlatformAdmin,
	RoleAdministrator,
	RoleCoach,
	RoleGuardian,
	RoleRenter,
	RoleStudent,
}

// NormalizeRolesList deduplicates and drops unknown roles.
func NormalizeRolesList(roles []string) []string {
	if len(roles) == 0 {
		return []string{RoleStudent}
	}
	seen := map[string]struct{}{}
	out := make([]string, 0, len(roles))
	for _, role := range roles {
		n := NormalizeRole(role)
		if n == RoleGuest {
			continue
		}
		if _, ok := seen[n]; ok {
			continue
		}
		seen[n] = struct{}{}
		out = append(out, n)
	}
	if len(out) == 0 {
		return []string{RoleStudent}
	}
	return out
}

// PrimaryRole picks the highest-priority role for routing/display.
func PrimaryRole(roles []string) string {
	roles = NormalizeRolesList(roles)
	set := map[string]struct{}{}
	for _, role := range roles {
		set[role] = struct{}{}
	}
	for _, role := range rolePriority {
		if _, ok := set[role]; ok {
			return role
		}
	}
	return RoleStudent
}

func MergePermissions(roles []string) map[Permission]bool {
	out := map[Permission]bool{}
	for _, role := range NormalizeRolesList(roles) {
		for perm, ok := range PermissionsFor(role) {
			if ok {
				out[perm] = true
			}
		}
	}
	return out
}

func HasPermissionForRoles(roles []string, perm Permission) bool {
	return MergePermissions(roles)[perm]
}

func HasRole(roles []string, role string) bool {
	role = NormalizeRole(role)
	for _, item := range NormalizeRolesList(roles) {
		if item == role {
			return true
		}
	}
	return false
}

func IsAdministratorInRoles(roles []string) bool {
	return HasRole(roles, RoleAdministrator) || HasRole(roles, RolePlatformAdmin)
}

