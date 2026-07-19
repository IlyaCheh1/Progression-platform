package service

import (
	"context"
	"log/slog"

	"github.com/masterofsword/support-chat/internal/domain/user/ports"
)

type TxManagerInterface interface {
	WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}

type UserDomainServiceImpl struct {
	repo      ports.UserRepository
	txManager TxManagerInterface
	logger    *slog.Logger
}

func NewUserDomainService(
	userRepo ports.UserRepository,
	txManager TxManagerInterface,
	logger *slog.Logger,
) *UserDomainServiceImpl {
	return &UserDomainServiceImpl{
		repo:      userRepo,
		txManager: txManager,
		logger:    logger,
	}
}
