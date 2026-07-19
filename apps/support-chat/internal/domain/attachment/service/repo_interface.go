package service

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/attachment/model"
	"github.com/google/uuid"
)

type AttachmentRepository interface {
	CreateAttachment(ctx context.Context, conversationID uuid.UUID, storageKey, fileName, contentType string, sizeBytes int64) (*model.Attachment, error)
	MarkComplete(ctx context.Context, attachmentID, conversationID uuid.UUID) (*model.Attachment, error)
	FindByID(ctx context.Context, attachmentID uuid.UUID) (*model.Attachment, error)
	FindByIDs(ctx context.Context, conversationID uuid.UUID, attachmentIDs []uuid.UUID) ([]*model.Attachment, error)
	FindByMessageID(ctx context.Context, messageID uuid.UUID) ([]*model.Attachment, error)
	BindToMessage(ctx context.Context, conversationID, messageID uuid.UUID, attachmentIDs []uuid.UUID) error
}
