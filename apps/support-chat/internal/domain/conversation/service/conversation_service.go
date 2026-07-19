package service

import (
	"context"
	"log/slog"

	"github.com/masterofsword/support-chat/internal/domain/conversation/ports"
)

type TxManagerInterface interface {
	WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}

type ConversationDomainServiceImpl struct {
	repo      ports.ConversationRepository
	txManager TxManagerInterface
	logger    *slog.Logger
}

func NewConversationDomainService(
	conversationRepo ports.ConversationRepository,
	txManager TxManagerInterface,
	logger *slog.Logger,
) *ConversationDomainServiceImpl {
	return &ConversationDomainServiceImpl{
		repo:      conversationRepo,
		txManager: txManager,
		logger:    logger,
	}
}
