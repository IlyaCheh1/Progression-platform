package school

import "time"

type WaitlistEntry struct {
	ID             string    `json:"id"`
	SessionID      string    `json:"sessionId"`
	StudentID      string    `json:"studentId"`
	Position       int       `json:"position"`
	Status         string    `json:"status"` // waiting | offered | claimed | expired
	OfferExpiresAt time.Time `json:"offerExpiresAt,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
}

type MasterRankReview struct {
	ID            string    `json:"id"`
	StudentID     string    `json:"studentId"`
	WeaponKey     string    `json:"weaponKey"`
	RequestedRank int       `json:"requestedRank"`
	Status        string    `json:"status"` // pending | approved | rejected
	ReviewerNote  string    `json:"reviewerNote,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	ReviewedAt    time.Time `json:"reviewedAt,omitempty"`
}
