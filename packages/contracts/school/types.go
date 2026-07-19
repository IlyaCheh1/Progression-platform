package school

import "time"

type FunnelStage string

const (
	FunnelInquiry     FunnelStage = "inquiry"
	FunnelContacted   FunnelStage = "contacted"
	FunnelTrialBooked FunnelStage = "trial_booked"
	FunnelAttended    FunnelStage = "attended"
	FunnelPurchased   FunnelStage = "purchased"
	FunnelActive      FunnelStage = "active"
	FunnelAtRisk      FunnelStage = "at_risk"
	FunnelLeft        FunnelStage = "left"
)

type Lead struct {
	ID        string      `json:"id"`
	Name      string      `json:"name"`
	Phone     string      `json:"phone,omitempty"`
	Email     string      `json:"email,omitempty"`
	Source    string      `json:"source,omitempty"`
	UTM       string      `json:"utm,omitempty"`
	Direction string      `json:"direction,omitempty"`
	Stage     FunnelStage `json:"stage"`
	Notes     string      `json:"notes,omitempty"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`
}

type Task struct {
	ID        string    `json:"id"`
	LeadID    string    `json:"leadId,omitempty"`
	Title     string    `json:"title"`
	DueAt     time.Time `json:"dueAt,omitempty"`
	Done      bool      `json:"done"`
	CreatedAt time.Time `json:"createdAt"`
}

type Hall struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type Session struct {
	ID        string    `json:"id"`
	HallID    string    `json:"hallId"`
	GroupKey  string    `json:"groupKey"`
	Title     string    `json:"title"`
	StartsAt  time.Time `json:"startsAt"`
	EndsAt    time.Time `json:"endsAt"`
	Capacity  int       `json:"capacity"`
	Enrolled  int       `json:"enrolled"`
	CoachID   string    `json:"coachId,omitempty"`
	Cancelled bool      `json:"cancelled"`
}

type ReservationType string

const (
	ReservationGroupSession ReservationType = "GROUP_SESSION"
	ReservationTrialSlot    ReservationType = "TRIAL_SLOT"
	ReservationRental       ReservationType = "RENTAL"
	ReservationBlock          ReservationType = "BLOCK"
)

type Reservation struct {
	ID        string          `json:"id"`
	HallID    string          `json:"hallId"`
	Type      ReservationType `json:"type"`
	StartsAt  time.Time       `json:"startsAt"`
	EndsAt    time.Time       `json:"endsAt"`
	Reference string          `json:"reference,omitempty"`
}

type Booking struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	SessionID string    `json:"sessionId,omitempty"`
	LeadID    string    `json:"leadId,omitempty"`
	StudentID string    `json:"studentId,omitempty"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

type Tariff struct {
	Key         string `json:"key"`
	Title       string `json:"title"`
	AmountMinor int64  `json:"amountMinor"`
	Currency    string `json:"currency"`
	Kind        string `json:"kind"`
}

type MembershipStatus string

const (
	MembershipPending MembershipStatus = "pending"
	MembershipActive  MembershipStatus = "active"
	MembershipExpired MembershipStatus = "expired"
	MembershipFrozen  MembershipStatus = "frozen"
)

type Membership struct {
	ID        string           `json:"id"`
	StudentID string           `json:"studentId"`
	TariffKey string           `json:"tariffKey"`
	Status    MembershipStatus `json:"status"`
	StartsAt  time.Time        `json:"startsAt,omitempty"`
	ExpiresAt time.Time        `json:"expiresAt,omitempty"`
	OrderID   string           `json:"orderId,omitempty"`
}

type Order struct {
	ID          string    `json:"id"`
	StudentID   string    `json:"studentId"`
	TariffKey   string    `json:"tariffKey"`
	AmountMinor int64     `json:"amountMinor"`
	Currency    string    `json:"currency"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}

type PaymentStatus string

const (
	PaymentPending   PaymentStatus = "pending"
	PaymentSucceeded PaymentStatus = "succeeded"
	PaymentCanceled  PaymentStatus = "canceled"
	PaymentRefunded  PaymentStatus = "refunded"
)

type Payment struct {
	ID                string        `json:"id"`
	OrderID           string        `json:"orderId"`
	AttemptID         string        `json:"attemptId"`
	Provider          string        `json:"provider"`
	ProviderPaymentID string        `json:"providerPaymentId,omitempty"`
	AmountMinor       int64         `json:"amountMinor"`
	Currency          string        `json:"currency"`
	Status            PaymentStatus `json:"status"`
	ConfirmationURL   string        `json:"confirmationUrl,omitempty"`
	CreatedAt         time.Time     `json:"createdAt"`
	UpdatedAt         time.Time     `json:"updatedAt"`
}

type FiscalReceipt struct {
	ID        string    `json:"id"`
	PaymentID string    `json:"paymentId"`
	Status    string    `json:"status"`
	Reference string    `json:"reference,omitempty"`
	UpdatedAt time.Time `json:"updatedAt"`
}
