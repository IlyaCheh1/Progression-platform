package http

import (
	"context"

	"github.com/masterofsword/support-chat/internal/app/conversation"
	"github.com/masterofsword/support-chat/internal/app/telegram"
	am "github.com/masterofsword/support-chat/internal/domain/attachment/model"
	cm "github.com/masterofsword/support-chat/internal/domain/conversation/model"
	mm "github.com/masterofsword/support-chat/internal/domain/message/model"
	"github.com/google/uuid"
)

type ConvAppService interface {
	CreateConversation(ctx context.Context, info *conversation.CreateConversationInfo) (*cm.Conversation, error)
	GetMyConversations(ctx context.Context, userId uuid.UUID, limit int32) ([]*cm.Conversation, error)
	UpdateConversationStatus(ctx context.Context, conversationId uuid.UUID, status cm.ConversationStatus) (*cm.Conversation, error)
	RateConversation(ctx context.Context, conversationId uuid.UUID, isLike bool) (*cm.Conversation, error)
}

type TelegramAppService interface {
	ProcessWebhook(ctx context.Context, secret string, incomingMessage *telegram.IncomingMessage) error
}

type MessageAppService interface {
	GetMessagesByConvId(ctx context.Context, convID uuid.UUID, afterSeq int64, limit int32, isAsc bool) ([]*mm.Message, error)
	SendMessage(ctx context.Context, message *mm.Message) (*mm.Message, error)
}

type AttachmentAppService interface {
	InitAttachment(ctx context.Context, init *am.AttachmentInit) (*am.Attachment, string, int, error)
	CompleteAttachment(ctx context.Context, attachmentID, conversationID uuid.UUID) (*am.Attachment, error)
	GetDownloadURL(ctx context.Context, attachmentID uuid.UUID) (*am.AttachmentDownloadUrl, error)
	GetAttachmentsByIDs(ctx context.Context, conversationID uuid.UUID, attachmentIDs []uuid.UUID) ([]*am.Attachment, error)
}
