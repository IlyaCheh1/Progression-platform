package conversation

import (
	"context"

	cm "github.com/masterofsword/support-chat/internal/domain/conversation/model"
	um "github.com/masterofsword/support-chat/internal/domain/user/model"
	"github.com/google/uuid"
)

type ConversationDomainService interface {
	CreateConversation(ctx context.Context, conversation *cm.Conversation) (*cm.Conversation, error)
	GetConversationsByUser(ctx context.Context, userId uuid.UUID, limit int32) ([]*cm.Conversation, error)
	GetConversationById(ctx context.Context, conversationId uuid.UUID) (*cm.Conversation, error)
	UpdateConversationStatus(ctx context.Context, conversationId uuid.UUID, status cm.ConversationStatus) (*cm.Conversation, error)
	RateConversation(ctx context.Context, conversationId uuid.UUID, isLike bool) (*cm.Conversation, error)
}

type UserDomainService interface {
	CreateOrGetUser(ctx context.Context, user *um.User) (*um.User, error)
}

type TelegramAppService interface {
	EnsureSupportTopic(ctx context.Context, conversation *cm.Conversation) (*cm.Conversation, error)
}
