package message

import (
	"context"

	am "github.com/masterofsword/support-chat/internal/domain/attachment/model"
	cm "github.com/masterofsword/support-chat/internal/domain/conversation/model"
	"github.com/masterofsword/support-chat/internal/domain/message/model"
	"github.com/google/uuid"
)

type MessageBroadcaster interface {
	BroadcastMessage(message *model.Message) error
}

type MessageDomainService interface {
	CreateMessage(ctx context.Context, message *model.Message) (*model.Message, error)
	GetLastSeq(ctx context.Context, conversationID uuid.UUID) (int64, error)
	GetMessagesByConvId(ctx context.Context, conversationID uuid.UUID, afterSeqNo int64, limit int32, isAsc bool) ([]*model.Message, error)
}

type ConversationDomainService interface {
	GetConversationById(ctx context.Context, conversationId uuid.UUID) (*cm.Conversation, error)
}

type TelegramAppService interface {
	SendMessageToTelegram(ctx context.Context, message *model.Message) error
}

type AttachmentAppService interface {
	BindAttachmentsToMessage(ctx context.Context, conversationID, messageID uuid.UUID, attachmentIDs []uuid.UUID) error
	GetAttachmentsByIDs(ctx context.Context, conversationID uuid.UUID, attachmentIDs []uuid.UUID) ([]*am.Attachment, error)
}
