package service

import (
	"context"
	"log/slog"

	"github.com/masterofsword/support-chat/internal/domain/message/ports"
)

type TxManagerInterface interface {
	WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}

type MessageDomainServiceImpl struct {
	repo           ports.MessageRepository
	attachmentRepo AttachmentRepository
	txManager      TxManagerInterface
	logger         *slog.Logger
}

func NewMessageDomainService(
	messageRepo ports.MessageRepository,
	attachmentRepo AttachmentRepository,
	txManager TxManagerInterface,
	logger *slog.Logger,
) *MessageDomainServiceImpl {
	return &MessageDomainServiceImpl{
		repo:           messageRepo,
		attachmentRepo: attachmentRepo,
		txManager:      txManager,
		logger:         logger,
	}
}
