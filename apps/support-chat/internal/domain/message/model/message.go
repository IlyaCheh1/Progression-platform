package model

import (
	"time"

	"github.com/google/uuid"
)

type Message struct {
	ID               uuid.UUID
	ConversationID   uuid.UUID
	SeqNo            int64
	SenderKind       SenderKind
	Source           MessageSource
	ContentType      ContentType
	ContentText      *string
	ClientID         *string
	SourceKey        *string
	TgMessageID      *int64
	ReplyToMessageID *uuid.UUID
	AttachmentIDs    []uuid.UUID
	CreatedAt        time.Time
}

type SenderKind string

const (
	UserSenderKind      SenderKind = "user"
	SystemSenderKind    SenderKind = "system"
	AssistantSenderKind SenderKind = "assistant"
	SupportSenderKind   SenderKind = "support"
)

type MessageSource string

const (
	WebMessageSource      MessageSource = "web"
	TelegramMessageSource MessageSource = "telegram"
	SystemMessageSource   MessageSource = "system"
)

type ContentType string

const (
	TextContentType ContentType = "text"
)
