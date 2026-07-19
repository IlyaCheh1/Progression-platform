package admincontent

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMustLoadLoadsStarterTalents(t *testing.T) {
	root := t.TempDir()
	schemaDir := filepath.Join(root, "schemas", "content")
	if err := os.MkdirAll(schemaDir, 0o755); err != nil {
		t.Fatal(err)
	}
	starter := `{
		"talentTrees":[{"id":"arsenal.paths","title":"Путь клинка","theme":"blade"}],
		"talents":[{"key":"arsenal.stance","title":"Стойка","rank":1,"treeId":"arsenal.paths"}],
		"quests":[{"key":"starter.q","title":"Starter quest","type":"DAILY","xp":10}],
		"achievements":[]
	}`
	if err := os.WriteFile(filepath.Join(schemaDir, "school.fencing.starter.json"), []byte(starter), 0o644); err != nil {
		t.Fatal(err)
	}

	st := MustLoad(root)
	if _, ok := st.GetTalent("arsenal.stance"); !ok {
		t.Fatal("expected talent from starter catalog")
	}
	snap := st.Snapshot()
	if len(snap.Talents) != 1 {
		t.Fatalf("expected 1 talent, got %d", len(snap.Talents))
	}
	if len(snap.Quests) != 1 {
		t.Fatalf("expected 1 quest, got %d", len(snap.Quests))
	}
}

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
