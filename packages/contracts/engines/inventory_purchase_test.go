package engines

import "testing"

func TestPurchaseInventoryItemGrantsHolding(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{
		ID:              "s1",
		Login:           "buyer",
		Password:        "x",
		Role:            RoleStudent,
		ProfileComplete: true,
		Gender:          "MALE",
		SelectedSkinID:  "3",
		BackgroundKey:   "northern_lights",
	})

	view, err := p.PurchaseInventoryItem("s1", PurchaseInventoryInput{
		Kind:  InventoryKindBackground,
		RefID: "moon",
	})
	if err != nil {
		t.Fatalf("purchase: %v", err)
	}
	owned := false
	for _, item := range view.Items {
		if item.Kind == InventoryKindBackground && item.RefID == "moon" {
			owned = true
		}
	}
	if !owned {
		t.Fatalf("expected moon background in inventory, got %+v", view.Items)
	}
}
