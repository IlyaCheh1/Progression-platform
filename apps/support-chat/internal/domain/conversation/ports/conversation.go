package ports

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
	"github.com/google/uuid"
)

type ConversationReader interface {
	IsParticipant(ctx context.Context, conversationId uuid.UUID, userId uuid.UUID) (bool, error)
	FindConversationByThreadId(ctx context.Context, thSupportChatId int64, thSupportTopicId int32) (*model.Conversation, error)
	FindConversationsByUser(ctx context.Context, userID uuid.UUID, limit int32) ([]*model.Conversation, error)
	FindOpenConversationByUser(ctx context.Context, userId uuid.UUID, typeC model.ConversationType) (*model.Conversation, error)
	FindConversationById(ctx context.Context, conversationId uuid.UUID) (*model.Conversation, error)
}

type ConversationWriter interface {
	CreateConversation(ctx context.Context, conversation *model.Conversation) (*model.Conversation, error)
	UpdateConversationStatus(ctx context.Context, conversationID uuid.UUID, status model.ConversationStatus) (*model.Conversation, error)
	RateConversation(ctx context.Context, conversationID uuid.UUID, isLike bool) (*model.Conversation, error)
	AddParticipant(ctx context.Context, conversationId uuid.UUID, userId uuid.UUID) error
	UpdateTelegramInfo(ctx context.Context, conversationId uuid.UUID, chatId int64, topicId int32) (*model.Conversation, error)
}

type ConversationRepository interface {
	ConversationReader
	ConversationWriter
}
