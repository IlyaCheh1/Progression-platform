package admincontent

import "testing"

func TestQuestClaimXPCoinOnly(t *testing.T) {
	q := Quest{Key: "weekly.community", XP: 0, Coins: 300}
	if got := QuestClaimXP(q); got != 0 {
		t.Fatalf("coin-only quest XP=%d, want 0", got)
	}
}

func TestQuestClaimXPLegacyFallback(t *testing.T) {
	q := Quest{Key: "custom", XP: 0, Coins: 0}
	if got := QuestClaimXP(q); got != 100 {
		t.Fatalf("legacy fallback XP=%d, want 100", got)
	}
}

func TestAchievementStageCoinOnly(t *testing.T) {
	a := Achievement{Key: "start.inventory", Tiers: 1, XP: 0, Coins: 250}
	if got := AchievementStageXP(a, 0); got != 0 {
		t.Fatalf("coin-only achievement XP=%d, want 0", got)
	}
	if got := AchievementStageCoins(a, 0); got != 250 {
		t.Fatalf("coins=%d, want 250", got)
	}
}

func TestAchievementStageCoinsMultiTier(t *testing.T) {
	a := Achievement{Key: "demo", Tiers: []any{1, 5, 10}, XP: 0, Coins: 50}
	if got := AchievementStageCoins(a, 2); got != 150 {
		t.Fatalf("stage coins=%d, want 150", got)
	}
}
