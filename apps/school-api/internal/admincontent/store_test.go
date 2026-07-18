package admincontent

import "testing"

func TestUpsertQuestAndAchievement(t *testing.T) {
	s := New()
	if err := s.UpsertQuest(Quest{Key: "q1", Title: "Quest"}); err != nil {
		t.Fatal(err)
	}
	if err := s.UpsertAchievement(Achievement{Key: "a1", Title: "Ach"}); err != nil {
		t.Fatal(err)
	}
	if err := s.UpsertQuest(Quest{Title: "no-key"}); err == nil {
		t.Fatal("expected validation error")
	}
	snap := s.Snapshot()
	if len(snap.Quests) != 1 || len(snap.Achievements) != 1 {
		t.Fatalf("unexpected catalog size: %+v", snap)
	}
}
