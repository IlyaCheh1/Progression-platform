package mastery

import "testing"

func TestAllocatePairConserves(t *testing.T) {
	p, s := AllocatePair(100)
	if p+s != 100 || p != 75 || s != 25 {
		t.Fatalf("got %d %d", p, s)
	}
	p, s = AllocatePair(101)
	if p+s != 101 {
		t.Fatalf("not conserved: %d+%d", p, s)
	}
}

func TestPointsToUnits(t *testing.T) {
	if PointsToUnits(10) != 100000 {
		t.Fatalf("unexpected")
	}
}

func TestApplyDecayFloor(t *testing.T) {
	floor := int64(50000)
	if ApplyDecay(60000, floor) < floor {
		t.Fatal("broke floor")
	}
}
