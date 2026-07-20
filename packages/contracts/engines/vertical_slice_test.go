package engines

import (
	"testing"
	"time"
)

func TestAttendanceToLevelExactlyOnce(t *testing.T) {
	p := NewPlatform()
	c, err := p.CreateCharacter("char-1", "user-1")
	if err != nil {
		t.Fatal(err)
	}
	lvl, granted, err := p.RecordAttendance(c.ID, "att-1", 500)
	if err != nil || !granted {
		t.Fatalf("first grant: lvl=%d granted=%v err=%v", lvl, granted, err)
	}
	lvl2, granted2, err := p.RecordAttendance(c.ID, "att-1", 500)
	if err != nil {
		t.Fatal(err)
	}
	if granted2 {
		t.Fatal("duplicate attendance must not grant again")
	}
	c2, _ := p.GetCharacter(c.ID)
	if c2.XP != 500 {
		t.Fatalf("xp=%d want 500", c2.XP)
	}
	if lvl2 != c2.Level {
		t.Fatalf("level mismatch")
	}
}

func TestMasteryPairAllocation(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{ID: "s1", DisplayName: "Test", Login: "demo_test", Password: "x"})
	if err := p.ApplyTrainingAllocation("s1", "due_spade", 100, true); err != nil {
		t.Fatal(err)
	}
	s, _ := p.GetStudent("s1")
	if s.Mastery["due_spade"] != 75 {
		t.Fatalf("primary=%d", s.Mastery["due_spade"])
	}
	if s.Mastery["spada_a_uno_mano"] != 25 {
		t.Fatalf("secondary=%d", s.Mastery["spada_a_uno_mano"])
	}
}

func TestFindStudentByLoginCaseInsensitive(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{
		ID: "s-email", Login: "Hero@MasterSword.ru", Password: "x", Role: RoleStudent,
	})
	found, ok := p.FindStudentByLogin("hero@mastersword.ru")
	if !ok || found.ID != "s-email" {
		t.Fatalf("case-insensitive login lookup failed: ok=%v id=%q", ok, found.ID)
	}
	if _, ok := p.FindStudentByLogin("missing@example.com"); ok {
		t.Fatal("missing login must not resolve")
	}
}

func TestTemporaryLocalAuthRoles(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{
		ID: "student-temp", Login: "temp.student@local", Password: "pass-student", Role: RoleStudent,
	})
	p.UpsertStudent(Student{
		ID: "admin-temp", Login: "temp.admin@local", Password: "pass-admin", Role: RoleAdministrator,
	})

	student, ok := p.Authenticate("temp.student@local", "pass-student")
	if !ok || student.IsPlatformAdmin() {
		t.Fatalf("student auth failed or wrong role: ok=%v role=%q", ok, student.NormalizedRole())
	}
	admin, ok := p.Authenticate("temp.admin@local", "pass-admin")
	if !ok || !admin.IsPlatformAdmin() {
		t.Fatalf("admin auth failed: ok=%v role=%q", ok, admin.NormalizedRole())
	}

	token, expiresAt, err := p.IssueAccessToken(admin.ID)
	if err != nil || token == "" {
		t.Fatalf("issue token: %v", err)
	}
	if expiresAt.Before(time.Now().Add(29 * 24 * time.Hour)) {
		t.Fatalf("expected ~30d expiry, got %v", expiresAt)
	}
	resolved, ok := p.ResolveAccessToken(token)
	if !ok || resolved.ID != "admin-temp" {
		t.Fatalf("token resolve failed: ok=%v id=%q", ok, resolved.ID)
	}
	if _, ok := p.ResolveAccessToken("demo.admin-temp"); ok {
		t.Fatal("predictable demo.<id> token must not resolve")
	}
	if _, ok := p.ResolveAccessToken("bad.token"); ok {
		t.Fatal("invalid token must not resolve")
	}
}
