package engines

import "testing"

func TestRankGrantsTitle(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{ID: "s1", Login: "t@local", Password: "x", Mastery: map[string]int64{}, Ranks: map[string]int{}})
	p.grantTitleForRankFromSchool("s1", 1)
	inv, err := p.InventoryForStudent("s1")
	if err != nil {
		t.Fatal(err)
	}
	found := false
	for _, item := range inv.Items {
		if item.Kind == InventoryKindTitle && item.RefID == "school.fencing.title.student" {
			found = true
		}
	}
	if !found {
		t.Fatalf("title not granted: %+v", inv.Items)
	}
}
