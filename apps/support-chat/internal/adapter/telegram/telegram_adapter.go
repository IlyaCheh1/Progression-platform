package telegram

import (
	"context"
	"log/slog"

	client2 "github.com/masterofsword/support-chat/internal/adapter/telegram/client"
	telegramApp "github.com/masterofsword/support-chat/internal/app/telegram"
	"github.com/masterofsword/support-chat/internal/domain/attachment/model"
	"github.com/masterofsword/support-chat/internal/infra/config"
	"github.com/google/uuid"
)

// AttachmentService interface for getting attachment data
type AttachmentService interface {
	GetAttachmentsByIDs(ctx context.Context, conversationID uuid.UUID, attachmentIDs []uuid.UUID) ([]*model.Attachment, error)
	GetDownloadURL(ctx context.Context, attachmentID uuid.UUID) (*model.AttachmentDownloadUrl, error)
}

// TelegramAdapterImpl implements TelegramAdapter interface from app layer
type TelegramAdapterImpl struct {
	client            *client2.TelegramBotClient
	attachmentService AttachmentService
	supportChatID     int64
	logger            *slog.Logger
}

// NewTelegramAdapter creates new Telegram adapter
func NewTelegramAdapter(client *client2.TelegramBotClient, attachmentService AttachmentService, cfg *config.TelegramConfig, logger *slog.Logger) telegramApp.TelegramAdapter {
	return &TelegramAdapterImpl{
		client:            client,
		attachmentService: attachmentService,
		supportChatID:     cfg.SupportChatID,
		logger:            logger,
	}
}
