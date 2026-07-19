package model

import (
	"time"

	"github.com/google/uuid"
)

type Conversation struct {
	Id               uuid.UUID
	Type             ConversationType
	Status           ConversationStatus
	Topic            *string
	TgSupportChatID  *int64
	TgSupportTopicID *int32
	Source           ConversationSource
	PageUrl          *string
	Locale           *string
	Timezone         *int
	AppVersion       *string
	IsLike           *bool
	CreatedBy        uuid.UUID
	CreatedAt        time.Time
}

type ConversationType string

const (
	SupportConversationType ConversationType = "support"
	DirectConversationType  ConversationType = "direct"
	GroupConversationType   ConversationType = "group"
	AiConversationType      ConversationType = "ai"
)

type ConversationStatus string

const (
	OpenConversationStatus    ConversationStatus = "open"
	PendingConversationStatus ConversationStatus = "pending"
	ClosedConversationStatus  ConversationStatus = "closed"
)

type ConversationSource string

const (
	WebConversation      ConversationSource = "web"
	TelegramConversation ConversationSource = "telegram"
	SystemConversation   ConversationSource = "system"
)
