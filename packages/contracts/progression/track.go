package progression

import "fmt"

// StandardLevelTrack thresholds for levels 1–100 (cumulative XP to reach level).
// Level 1 starts at 0 XP. Values are integers only.
type Track struct {
	Key      string
	Version  int
	Thresholds []int64 // index 0 unused; Thresholds[level] = XP required to be that level
}

func Standard100() Track {
	th := make([]int64, 101)
	// Simple deterministic curve for MVP; replace with 004a exact table when imported.
	var cum int64
	th[1] = 0
	for lvl := 2; lvl <= 100; lvl++ {
		need := int64(100 + (lvl-2)*50)
		cum += need
		th[lvl] = cum
	}
	return Track{Key: "platform.standard.100", Version: 1, Thresholds: th}
}

func (t Track) LevelForXP(xp int64) int {
	if xp < 0 {
		xp = 0
	}
	level := 1
	for lvl := 100; lvl >= 1; lvl-- {
		if xp >= t.Thresholds[lvl] {
			level = lvl
			break
		}
	}
	return level
}

func (t Track) Progress(xp int64) (level int, intoLevel int64, need int64, err error) {
	level = t.LevelForXP(xp)
	if level >= 100 {
		return 100, 0, 0, nil
	}
	base := t.Thresholds[level]
	next := t.Thresholds[level+1]
	return level, xp - base, next - base, nil
}

func GrantXP(current int64, amount int64) (int64, error) {
	if amount < 0 {
		return current, fmt.Errorf("negative experience forbidden")
	}
	return current + amount, nil
}
