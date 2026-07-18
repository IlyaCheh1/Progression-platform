package envelope

import "time"

// Command is the canonical command envelope (TZ §10.2).
type Command struct {
	CommandID       string    `json:"commandId"`
	CommandType     string    `json:"commandType"`
	SchemaVersion   int       `json:"schemaVersion"`
	ActorID         string    `json:"actorId"`
	ActorType       string    `json:"actorType"`
	TenantID        string    `json:"tenantId"`
	RealmKey        string    `json:"realmKey"`
	TargetAggregate string    `json:"targetAggregate"`
	ExpectedVersion *int64    `json:"expectedVersion,omitempty"`
	IdempotencyKey  string    `json:"idempotencyKey"`
	RequestedAt     time.Time `json:"requestedAt"`
	Reason          string    `json:"reason,omitempty"`
	Payload         any       `json:"payload"`
}
