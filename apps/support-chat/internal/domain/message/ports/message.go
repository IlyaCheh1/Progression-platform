package ports

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/message/model"
	"github.com/google/uuid"
)

type MessageReader interface {
	FindMessagesByConvId(ctx context.Context, conversationID uuid.UUID, afterSeqNo int64, limit int32) ([]*model.Message, error)
	FindMessagesByConvIdDesc(ctx context.Context, conversationID uuid.UUID, afterSeqNo int64, limit int32) ([]*model.Message, error)
	GetLastSeq(ctx context.Context, conversationID uuid.UUID) (int64, error)
}

type MessageWriter interface {
	CreateMessage(ctx context.Context, message *model.Message) (*model.Message, error)
	UpdateMessageTelegramID(ctx context.Context, messageID uuid.UUID, tgMessageID *int64) error
}

type MessageRepository interface {
	MessageReader
	MessageWriter
}
