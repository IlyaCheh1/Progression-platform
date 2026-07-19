package engines

import "github.com/masterofsword/contracts/rbac"

func (s *Student) syncRoles() {
	if len(s.Roles) == 0 && s.Role != "" {
		s.Roles = []string{rbac.NormalizeRole(s.Role)}
	}
	if len(s.Roles) == 0 {
		s.Roles = []string{RoleStudent}
	}
	s.Roles = rbac.NormalizeRolesList(s.Roles)
	s.Role = rbac.PrimaryRole(s.Roles)
}

// RolesList returns normalized role assignments for the principal.
func (s *Student) RolesList() []string {
	if s == nil {
		return []string{RoleStudent}
	}
	if len(s.Roles) == 0 {
		return []string{s.NormalizedRole()}
	}
	return rbac.NormalizeRolesList(s.Roles)
}

// HasRole reports whether the principal has a specific role assignment.
func (s *Student) HasRole(role string) bool {
	return s != nil && rbac.HasRole(s.RolesList(), role)
}
