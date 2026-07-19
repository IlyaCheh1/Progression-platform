package training

import (
	"fmt"
	"time"
)

type RecordStatus string

const (
	StatusDraft     RecordStatus = "DRAFT"
	StatusConfirmed RecordStatus = "CONFIRMED"
	StatusCorrected RecordStatus = "CORRECTED"
	StatusVoided    RecordStatus = "VOIDED"
)

type ExerciseEntry struct {
	EntryID                string   `json:"entryId"`
	ExerciseCode           string   `json:"exerciseCode"`
	WeaponConfigurationKey string   `json:"weaponConfigurationKey"`
	ActionCount            int64    `json:"actionCount"`
	MassGrams              int64    `json:"massGrams"`
	EquipmentSpecIDs       []string `json:"equipmentSpecIds,omitempty"`
}

type Record struct {
	TrainingRecordID    string          `json:"trainingRecordId"`
	Revision            int             `json:"revision"`
	StudentID           string          `json:"studentId"`
	CharacterID         string          `json:"characterId,omitempty"`
	SessionID           string          `json:"sessionId,omitempty"`
	CoachID             string          `json:"coachId,omitempty"`
	OccurredAt          time.Time       `json:"occurredAt"`
	CurriculumVersionID string          `json:"curriculumVersionId,omitempty"`
	Entries             []ExerciseEntry `json:"entries"`
	Status              RecordStatus    `json:"status"`
	CorrectionReason    string          `json:"correctionReason,omitempty"`
	VoidReason          string          `json:"voidReason,omitempty"`
}

func EntryUnits(e ExerciseEntry) int64 {
	if e.ActionCount <= 0 || e.MassGrams <= 0 {
		return 0
	}
	return e.ActionCount * e.MassGrams
}

func TotalUnits(entries []ExerciseEntry) int64 {
	var total int64
	for _, e := range entries {
		total += EntryUnits(e)
	}
	return total
}

func ValidateRecord(r *Record) error {
	if r == nil {
		return fmt.Errorf("record required")
	}
	if r.TrainingRecordID == "" || r.StudentID == "" {
		return fmt.Errorf("trainingRecordId and studentId required")
	}
	if r.Revision < 1 {
		return fmt.Errorf("revision must be >= 1")
	}
	switch r.Status {
	case StatusDraft, StatusConfirmed, StatusCorrected, StatusVoided:
	default:
		return fmt.Errorf("invalid status")
	}
	for _, e := range r.Entries {
		if e.ExerciseCode == "" {
			return fmt.Errorf("exerciseCode required")
		}
		if e.WeaponConfigurationKey == "" {
			return fmt.Errorf("weaponConfigurationKey required")
		}
	}
	return nil
}

type ExerciseSpec struct {
	Code                string   `json:"code"`
	Name                string   `json:"name"`
	AllowedWeapons      []string `json:"allowedWeapons"`
	CurriculumVersionID string   `json:"curriculumVersionId"`
}

type EquipmentSpec struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	MassGrams     int64  `json:"massGrams"`
	EffectiveFrom string `json:"effectiveFrom,omitempty"`
}
