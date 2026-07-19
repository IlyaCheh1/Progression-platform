package engines

import (
	"fmt"
	"time"

	"github.com/masterofsword/contracts/school"
)

type SeasonState struct {
	EditionKey  string    `json:"editionKey"`
	Status      string    `json:"status"` // scheduled | active | grace | closed
	StartsAt    time.Time `json:"startsAt"`
	EndsAt      time.Time `json:"endsAt"`
	GraceEndsAt time.Time `json:"graceEndsAt"`
}

type BattlePassState struct {
	StudentID   string         `json:"studentId"`
	SeasonKey   string         `json:"seasonKey"`
	PassXP      int64          `json:"passXp"`
	Tier        int            `json:"tier"`
	ClaimedFree map[int]bool   `json:"claimedFree"`
}

func (sm *SchoolModule) ActivateSeason(editionKey string, starts, ends time.Time) *SeasonState {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sm.activeSeason = &SeasonState{
		EditionKey: editionKey, Status: "active",
		StartsAt: starts, EndsAt: ends, GraceEndsAt: ends.Add(7 * 24 * time.Hour),
	}
	return sm.activeSeason
}

func (sm *SchoolModule) CurrentSeason() *SeasonState {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	if sm.activeSeason == nil {
		return nil
	}
	cp := *sm.activeSeason
	return &cp
}

func (sm *SchoolModule) GrantPassXP(studentID string, amount int64) (*BattlePassState, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	if sm.activeSeason == nil {
		return nil, fmt.Errorf("no active season")
	}
	if sm.battlePass[studentID] == nil {
		sm.battlePass[studentID] = &BattlePassState{
			StudentID: studentID, SeasonKey: sm.activeSeason.EditionKey,
			ClaimedFree: map[int]bool{},
		}
	}
	bp := sm.battlePass[studentID]
	bp.PassXP += amount
	bp.Tier = int(bp.PassXP / 500)
	return bp, nil
}

func (sm *SchoolModule) BattlePassForStudent(studentID string) *BattlePassState {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	bp := sm.battlePass[studentID]
	if bp == nil {
		return nil
	}
	cp := *bp
	return &cp
}

func (sm *SchoolModule) UnlockTalent(studentID, talentKey string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	if sm.talentUnlocks[studentID] == nil {
		sm.talentUnlocks[studentID] = map[string]bool{}
	}
	sm.talentUnlocks[studentID][talentKey] = true
	return nil
}

func (sm *SchoolModule) TalentsForStudent(studentID string) []string {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	m := sm.talentUnlocks[studentID]
	out := make([]string, 0, len(m))
	for k, v := range m {
		if v {
			out = append(out, k)
		}
	}
	return out
}

func (sm *SchoolModule) CreateRentalBooking(hallID string, starts, ends time.Time, studentID string) (*school.Booking, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	if sm.hasHallConflict(hallID, starts, ends, "") {
		return nil, fmt.Errorf("hall conflict")
	}
	resID := fmt.Sprintf("rental-%d", time.Now().UnixNano())
	sm.reserve[resID] = &school.Reservation{
		ID: resID, HallID: hallID, Type: school.ReservationRental,
		StartsAt: starts, EndsAt: ends, Reference: studentID,
	}
	b := &school.Booking{
		ID: resID, Type: "rental", StudentID: studentID, Status: "pending", CreatedAt: time.Now().UTC(),
	}
	sm.bookings[b.ID] = b
	return b, nil
}
