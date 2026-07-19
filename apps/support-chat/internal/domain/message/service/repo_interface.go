package service

import (
	"context"

	"github.com/google/uuid"
)

type AttachmentRepository interface {
	FindByMessageIDs(ctx context.Context, messageID []uuid.UUID) (map[uuid.UUID][]uuid.UUID, error)
}
