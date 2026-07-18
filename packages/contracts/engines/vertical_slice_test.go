package engines

import "testing"

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
