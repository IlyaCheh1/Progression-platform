package attachment

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/attachment/model"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type AttachmentDomainService interface {
	CreateAttachment(ctx context.Context, attachmentInit *model.AttachmentInit) (*model.Attachment, error)
	MarkComplete(ctx context.Context, attachmentID, conversationID uuid.UUID) (*model.Attachment, error)
	GetByID(ctx context.Context, attachmentID uuid.UUID) (*model.Attachment, error)
	GetByIDs(ctx context.Context, conversationID uuid.UUID, attachmentIDs []uuid.UUID) ([]*model.Attachment, error)
	BindToMessage(ctx context.Context, conversationID, messageID uuid.UUID, attachmentIDs []uuid.UUID) error
}

type S3StorageService interface {
	GeneratePresignedUploadURL(ctx context.Context, key, contentType string) (string, error)
	GeneratePresignedDownloadURL(ctx context.Context, key string) (string, error)
	HeadObject(ctx context.Context, key string) (*s3.HeadObjectOutput, error)
	DeleteObject(ctx context.Context, key string) error
}
