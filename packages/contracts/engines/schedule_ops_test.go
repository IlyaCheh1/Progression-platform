package engines_test

import (
	"testing"
	"time"

	"github.com/masterofsword/contracts/engines"
	"github.com/masterofsword/contracts/school"
)

func TestCreateSessionGroupEnrollAttendance(t *testing.T) {
	p := engines.NewPlatform()
	coach, err := p.CreateUser(engines.UserInput{
		DisplayName: "Coach", Login: "coach@test", Password: "x", Role: engines.RoleCoach, Roles: []string{engines.RoleCoach},
	})
	if err != nil {
		t.Fatal(err)
	}
	stu, err := p.CreateUser(engines.UserInput{
		DisplayName: "Student", Login: "stu@test", Password: "x", Role: engines.RoleStudent,
	})
	if err != nil {
		t.Fatal(err)
	}
	g, err := p.School.UpsertGroup(school.Group{
		Name: "Вечерняя сабля", CoachID: coach.ID, StudentIDs: []string{stu.ID}, Direction: "saber",
	})
	if err != nil {
		t.Fatal(err)
	}
	start := time.Now().UTC().Add(2 * time.Hour).Truncate(time.Minute)
	end := start.Add(90 * time.Minute)
	sess, err := p.School.CreateSession(school.Session{
		HallID: "hall-main", GroupKey: g.ID, Title: "Техника", StartsAt: start, EndsAt: end, Capacity: 10,
	})
	if err != nil {
		t.Fatal(err)
	}
	if sess.CoachID != coach.ID {
		t.Fatalf("coach expected %s got %s", coach.ID, sess.CoachID)
	}
	if len(sess.StudentIDs) != 1 || sess.StudentIDs[0] != stu.ID {
		t.Fatalf("students not copied from group: %+v", sess.StudentIDs)
	}
	att, err := p.School.MarkSessionAttendance(sess.ID, stu.ID, coach.ID, true, "хорошая работа")
	if err != nil {
		t.Fatal(err)
	}
	if !att.Present || att.ResultNotes == "" {
		t.Fatalf("bad attendance: %+v", att)
	}
	// conflict
	_, err = p.School.CreateSession(school.Session{
		HallID: "hall-main", Title: "Другое", StartsAt: start.Add(30 * time.Minute), EndsAt: end.Add(30 * time.Minute), Capacity: 5,
	})
	if err == nil {
		t.Fatal("expected hall conflict")
	}
}
