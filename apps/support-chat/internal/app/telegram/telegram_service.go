package telegram

import (
	"log/slog"
	"time"

	"github.com/masterofsword/support-chat/internal/infra/config"
)

// TopicInfo represents information about created Telegram forum topic
type TopicInfo struct {
	ChatID   int64
	TopicID  int32
	TopicURL string
}

// SentMessage represents information about message sent to Telegram
type SentMessage struct {
	TelegramMessageID int64
	SentAt            time.Time
}

// IncomingMessage represents a message received from Telegram webhook
type IncomingMessage struct {
	ChatID            int64 // Telegram chat ID
	TopicID           int32 // Telegram forum topic ID
	Text              string
	SenderName        string
	TelegramMessageID int64
}

type TelegramAppServiceImpl struct {
	telegramAdapter         TelegramAdapter
	conversationService     ConversationDomainService
	messageService          MessageDomainService
	userService             UserDomainService
	broadcaster             MessageBroadcaster
	conversationBroadcaster ConversationBroadcaster
	webhookSecret           string
	supportChatID           int64
	logger                  *slog.Logger
}

func NewAppService(
	telegramAdapter TelegramAdapter,
	conversationService ConversationDomainService,
	messageService MessageDomainService,
	userService UserDomainService,
	broadcaster MessageBroadcaster,
	conversationBroadcaster ConversationBroadcaster,
	cfg *config.TelegramConfig,
	logger *slog.Logger,
) *TelegramAppServiceImpl {
	return &TelegramAppServiceImpl{
		telegramAdapter:         telegramAdapter,
		conversationService:     conversationService,
		messageService:          messageService,
		userService:             userService,
		broadcaster:             broadcaster,
		conversationBroadcaster: conversationBroadcaster,
		webhookSecret:           cfg.WebhookSecret,
		supportChatID:           cfg.SupportChatID,
		logger:                  logger,
	}
}
