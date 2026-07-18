package progression

import "testing"

func TestLevelForXP(t *testing.T) {
	tr := Standard100()
	if tr.LevelForXP(0) != 1 {
		t.Fatalf("expected level 1")
	}
	lvl, into, need, err := tr.Progress(0)
	if err != nil || lvl != 1 || into != 0 || need <= 0 {
		t.Fatalf("progress: %d %d %d %v", lvl, into, need, err)
	}
	xp, err := GrantXP(0, 500)
	if err != nil || xp != 500 {
		t.Fatalf("grant: %v %v", xp, err)
	}
	if _, err := GrantXP(0, -1); err == nil {
		t.Fatal("expected negative xp error")
	}
}
