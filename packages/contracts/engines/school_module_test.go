package engines

import (
	"fmt"
	"testing"
	"time"

	"github.com/masterofsword/contracts/mastery"
	"github.com/masterofsword/contracts/training"
)

func TestTrainingRecordMasteryUnits(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{ID: "s1", DisplayName: "T", Login: "t1", Password: "x", Mastery: map[string]int64{}, Ranks: map[string]int{}})
	rec, err := p.School.CreateTrainingRecord(training.Record{
		StudentID: "s1",
		Entries: []training.ExerciseEntry{{
			EntryID: "e1", ExerciseCode: "salute.basic", WeaponConfigurationKey: "due_spade",
			ActionCount: 10, MassGrams: 800,
		}},
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := p.School.ConfirmTrainingRecord(rec.TrainingRecordID, "coach-1"); err != nil {
		t.Fatal(err)
	}
	s, _ := p.GetStudent("s1")
	want := int64(10 * 800)
	prim, sec := mastery.AllocatePair(want)
	if s.Mastery["due_spade"] != prim || s.Mastery["spada_a_uno_mano"] != sec {
		t.Fatalf("mastery due_spade=%d spada=%d want %d %d", s.Mastery["due_spade"], s.Mastery["spada_a_uno_mano"], prim, sec)
	}
}

func TestSixDayDecay(t *testing.T) {
	p := NewPlatform()
	start := int64(1200000)
	p.UpsertStudent(Student{ID: "s1", DisplayName: "T", Login: "t2", Password: "x", Mastery: map[string]int64{"spadone": start}, Ranks: map[string]int{"spadone": 6}})
	p.School.rankFloors["s1"] = map[string]int64{"spadone": 600000}
	applied := 0
	for i := 0; i < 6; i++ {
		n, err := p.School.RunDailyDecay(fmt.Sprintf("2026-07-%02d", 10+i))
		if err != nil {
			t.Fatal(err)
		}
		applied += n
	}
	if applied != 6 {
		t.Fatalf("decay entries=%d want 6", applied)
	}
	s, _ := p.GetStudent("s1")
	if s.Mastery["spadone"] != start-mastery.DailyDecayUnits()*6 {
		t.Fatalf("units=%d want %d", s.Mastery["spadone"], start-mastery.DailyDecayUnits()*6)
	}
}

func TestDecayFloor(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{ID: "s1", Mastery: map[string]int64{"spadone": 650000}, Ranks: map[string]int{"spadone": 6}})
	p.School.rankFloors["s1"] = map[string]int64{"spadone": 600000}
	for i := 0; i < 10; i++ {
		_, _ = p.School.RunDailyDecay(fmt.Sprintf("2026-08-%02d", i+1))
	}
	s, _ := p.GetStudent("s1")
	if s.Mastery["spadone"] < 600000 {
		t.Fatalf("below floor: %d", s.Mastery["spadone"])
	}
}

func TestTrainingRecordCorrection(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{ID: "s1", Mastery: map[string]int64{}, Ranks: map[string]int{}})
	rec, _ := p.School.CreateTrainingRecord(training.Record{
		StudentID: "s1",
		Entries: []training.ExerciseEntry{{
			ExerciseCode: "salute.basic", WeaponConfigurationKey: "spadone", ActionCount: 5, MassGrams: 1000,
		}},
	})
	_, _ = p.School.ConfirmTrainingRecord(rec.TrainingRecordID, "c1")
	corrected, err := p.School.CorrectTrainingRecord(rec.TrainingRecordID, "fix count", []training.ExerciseEntry{{
		ExerciseCode: "salute.basic", WeaponConfigurationKey: "spadone", ActionCount: 8, MassGrams: 1000,
	}})
	if err != nil {
		t.Fatal(err)
	}
	if corrected.Revision != 2 {
		t.Fatalf("revision=%d", corrected.Revision)
	}
	s, _ := p.GetStudent("s1")
	if s.Mastery["spadone"] != 8000 {
		t.Fatalf("units=%d want 8000", s.Mastery["spadone"])
	}
}

func TestMembershipCheckoutWebhook(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{ID: "s1", Login: "buyer", Password: "x"})
	pay, err := p.School.CreateMembershipCheckout("s1", "membership.month", "http://localhost/return")
	if err != nil {
		t.Fatal(err)
	}
	mem, err := p.School.HandleYooMoneyWebhook(pay.ProviderPaymentID, "evt-1")
	if err != nil {
		t.Fatal(err)
	}
	if mem.Status != "active" {
		t.Fatalf("status=%s", mem.Status)
	}
	mem2, err := p.School.HandleYooMoneyWebhook(pay.ProviderPaymentID, "evt-1")
	if err != nil || mem2.ID != mem.ID {
		t.Fatal("duplicate webhook should be idempotent")
	}
}

func TestQuestProgressOnAttendance(t *testing.T) {
	p := NewPlatform()
	c, _ := p.CreateCharacter("c1", "u1")
	p.UpsertStudent(Student{ID: "s1", CharacterID: c.ID, Login: "q1", Password: "x"})
	_, granted, _ := p.RecordAttendance(c.ID, "att-q1", 500)
	if !granted {
		t.Fatal("expected grant")
	}
	quests := p.School.QuestProgressForStudent("s1")
	found := false
	for _, q := range quests {
		if q.QuestKey == "training.ready" && q.Completed {
			found = true
		}
	}
	if !found {
		t.Fatal("training.ready not completed")
	}
}

func init() {
	_ = time.Now
}
