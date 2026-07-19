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

func TestUpsertQuestUpdatesExisting(t *testing.T) {
	s := New()
	if err := s.UpsertQuest(Quest{Key: "path.safety", Title: "Сначала безопасность", Type: "ONBOARDING", XP: 300}); err != nil {
		t.Fatal(err)
	}
	if err := s.UpsertQuest(Quest{Key: "path.safety", Title: "Безопасность обновлена", Type: "ONBOARDING", XP: 350}); err != nil {
		t.Fatal(err)
	}
	snap := s.Snapshot()
	if len(snap.Quests) != 1 {
		t.Fatalf("expected single quest after update, got %d", len(snap.Quests))
	}
	q := snap.Quests[0]
	if q.Title != "Безопасность обновлена" || q.XP != 350 {
		t.Fatalf("quest was not updated: %+v", q)
	}
}

func TestUpsertAllEntityKinds(t *testing.T) {
	s := New()
	if err := s.UpsertTalent(Talent{Key: "discipline.demo", Title: "Демо", Rank: 1}); err != nil {
		t.Fatal(err)
	}
	if err := s.UpsertItem(Item{Key: "school.fencing.title.demo", Title: "Демо-титул", Type: "COSMETIC", Category: "title"}); err != nil {
		t.Fatal(err)
	}
	if err := s.UpsertReward(Reward{Key: "school.fencing.reward.demo", Title: "Демо-награда", Components: "100 опыта"}); err != nil {
		t.Fatal(err)
	}
	if err := s.UpsertSchool(School{Key: "demo", Title: "Демо-школа", Description: "Описание"}); err != nil {
		t.Fatal(err)
	}
	if err := s.UpsertReward(Reward{Key: "bad", Title: "Без состава"}); err == nil {
		t.Fatal("expected components_required")
	}
	snap := s.Snapshot()
	if len(snap.Talents) != 1 || len(snap.Items) != 1 || len(snap.Rewards) != 1 || len(snap.Schools) != 1 {
		t.Fatalf("unexpected snapshot: %+v", snap)
	}
	if err := s.DeleteItem("school.fencing.title.demo"); err != nil {
		t.Fatal(err)
	}
	if len(s.Snapshot().Items) != 0 {
		t.Fatal("item should be deleted")
	}
}
