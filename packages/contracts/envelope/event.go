package envelope

import (
	"time"

	"github.com/google/uuid"
)

// Event is the canonical immutable event envelope (TZ §10.3).
type Event struct {
	EventID         string    `json:"eventId"`
	EventType       string    `json:"eventType"`
	SchemaVersion   int       `json:"schemaVersion"`
	Producer        string    `json:"producer"`
	OccurredAt      time.Time `json:"occurredAt"`
	RecordedAt      time.Time `json:"recordedAt"`
	TenantID        string    `json:"tenantId"`
	RealmKey        string    `json:"realmKey"`
	AggregateType   string    `json:"aggregateType"`
	AggregateID     string    `json:"aggregateId"`
	AggregateVersion int64    `json:"aggregateVersion"`
	PartitionKey    string    `json:"partitionKey"`
	CorrelationID   string    `json:"correlationId"`
	CausationID     string    `json:"causationId"`
	IdempotencyKey  string    `json:"idempotencyKey"`
	DataClass       string    `json:"dataClassification"`
	Payload         any       `json:"payload"`
}

func NewEvent(eventType, producer, tenantID, realmKey, aggregateType, aggregateID, idempotencyKey string, version int64, payload any) Event {
	now := time.Now().UTC()
	id := uuid.NewString()
	return Event{
		EventID:          id,
		EventType:        eventType,
		SchemaVersion:    1,
		Producer:         producer,
		OccurredAt:       now,
		RecordedAt:       now,
		TenantID:         tenantID,
		RealmKey:         realmKey,
		AggregateType:    aggregateType,
		AggregateID:      aggregateID,
		AggregateVersion: version,
		PartitionKey:     aggregateID,
		CorrelationID:    id,
		CausationID:      id,
		IdempotencyKey:   idempotencyKey,
		DataClass:        "INTERNAL",
		Payload:          payload,
	}
}
