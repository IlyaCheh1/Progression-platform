package service

import (
	"context"
	"log/slog"

	"github.com/masterofsword/support-chat/internal/domain/attachment/model"
	"github.com/google/uuid"
)

type TxManagerInterface interface {
	WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}

type AttachmentDomainServiceImpl struct {
	repo      AttachmentRepository
	txManager TxManagerInterface
	logger    *slog.Logger
}

func NewAttachmentDomainService(
	attachmentRepo AttachmentRepository,
	txManager TxManagerInterface,
	logger *slog.Logger,
) *AttachmentDomainServiceImpl {
	return &AttachmentDomainServiceImpl{
		repo:      attachmentRepo,
		txManager: txManager,
		logger:    logger,
	}
}

func (s *AttachmentDomainServiceImpl) CreateAttachment(ctx context.Context, init *model.AttachmentInit) (*model.Attachment, error) {
	return s.repo.CreateAttachment(ctx, init.ConversationID, init.StorageKey, init.FileName, init.ContentType, init.SizeBytes)
}

func (s *AttachmentDomainServiceImpl) MarkComplete(ctx context.Context, attachmentID, conversationID uuid.UUID) (*model.Attachment, error) {
	return s.repo.MarkComplete(ctx, attachmentID, conversationID)
}

func (s *AttachmentDomainServiceImpl) GetByID(ctx context.Context, attachmentID uuid.UUID) (*model.Attachment, error) {
	return s.repo.FindByID(ctx, attachmentID)
}

func (s *AttachmentDomainServiceImpl) GetByIDs(ctx context.Context, conversationID uuid.UUID, attachmentIDs []uuid.UUID) ([]*model.Attachment, error) {
	return s.repo.FindByIDs(ctx, conversationID, attachmentIDs)
}

func (s *AttachmentDomainServiceImpl) BindToMessage(ctx context.Context, conversationID, messageID uuid.UUID, attachmentIDs []uuid.UUID) error {
	return s.txManager.WithTransaction(ctx, func(ctx context.Context) error {
		return s.repo.BindToMessage(ctx, conversationID, messageID, attachmentIDs)
	})
}
