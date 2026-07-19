package telegram

import (
	"context"
	"time"

	cm "github.com/masterofsword/support-chat/internal/domain/conversation/model"
	mm "github.com/masterofsword/support-chat/internal/domain/message/model"
	um "github.com/masterofsword/support-chat/internal/domain/user/model"
	"github.com/google/uuid"
)

// TelegramAdapter defines the outbound port for external Telegram Bot API integration
type TelegramAdapter interface {
	CreateSupportTopic(ctx context.Context, conversation *cm.Conversation, user *um.User) (*TopicInfo, error)
	SendMessageToTopic(ctx context.Context, chatID int64, topicID int32, message *mm.Message, user *um.User) (*SentMessage, error)
}

// ConversationDomainService interface for domain layer interaction
type ConversationDomainService interface {
	UpdateConversationStatus(ctx context.Context, conversationId uuid.UUID, status cm.ConversationStatus) (*cm.Conversation, error)
	UpdateTelegramInfo(ctx context.Context, conversationId uuid.UUID, chatId int64, topicId int32) (*cm.Conversation, error)
	GetConversationById(ctx context.Context, conversationId uuid.UUID) (*cm.Conversation, error)
	GetConversationByThreadId(ctx context.Context, chatId int64, topicId int32) (*cm.Conversation, error)
}

// MessageDomainService interface for domain layer interaction
type MessageDomainService interface {
	CreateMessage(ctx context.Context, message *mm.Message) (*mm.Message, error)
}

// MessageBroadcaster defines interface for broadcasting messages to connected clients
type MessageBroadcaster interface {
	BroadcastMessage(message *mm.Message) error
}

// ConversationBroadcaster defines interface for broadcasting conversation events to connected clients
type ConversationBroadcaster interface {
	BroadcastConversationClosed(conversationID, closedBy, reason string, closedAt time.Time) error
}

// UserDomainService interface for domain layer interaction
type UserDomainService interface {
	GetUserById(ctx context.Context, userId uuid.UUID) (*um.User, error)
}
