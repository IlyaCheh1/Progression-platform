package mastery

import (
	"fmt"
	"math"
)

// Weapon keys (canonical Italian labels from school docs / Excel).
var WeaponKeys = []string{
	"spada_a_uno_mano",
	"due_spade",
	"spada_e_scudo",
	"spada_a_due_mani",
	"spadone",
	"acia_alabarda",
	"spiedo_partesana",
	"spiedo_e_scudo",
}

// AliasMap maps Excel headings to canonical keys.
var AliasMap = map[string]string{
	"spada a uno mano":   "spada_a_uno_mano",
	"due spade":          "due_spade",
	"spada e scudo":      "spada_e_scudo",
	"spada a due mani":   "spada_a_due_mani",
	"spadone":            "spadone",
	"acia & alabarda":    "acia_alabarda",
	"spiedo & partesana": "spiedo_partesana",
	"spiedo & scudo":     "spiedo_e_scudo",
	"spiedo e scudo":     "spiedo_e_scudo",
}

// PointsToUnits converts displayed decimal mastery points to integer units (doc 107).
func PointsToUnits(points float64) int64 {
	return int64(math.Round(points * 10000))
}

// AllocatePair applies 75/25 split for paired tracks (integer, conserved).
func AllocatePair(total int64) (primary int64, secondary int64) {
	primary = (total * 75) / 100
	secondary = total - primary
	return primary, secondary
}

// DailyDecayUnits is the fixed daily decay in units equivalent to -10 points display.
func DailyDecayUnits() int64 {
	return PointsToUnits(10)
}

// ApplyDecay subtracts daily decay but never below earned rank floor units.
func ApplyDecay(current, floor int64) int64 {
	next := current - DailyDecayUnits()
	if next < floor {
		return floor
	}
	if next < 0 {
		return 0
	}
	return next
}

// RankFromUnits placeholder thresholds: every 100_000 units ≈ 1 rank, max 10.
func RankFromUnits(units int64) int {
	if units <= 0 {
		return 0
	}
	r := int(units / 100000)
	if r > 10 {
		return 10
	}
	return r
}

func ValidateNonFloatAuthoritative(v float64) error {
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return fmt.Errorf("invalid mastery value")
	}
	return nil
}
