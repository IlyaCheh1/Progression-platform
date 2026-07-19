package ws

import (
	"context"

	am "github.com/masterofsword/support-chat/internal/domain/attachment/model"
	mm "github.com/masterofsword/support-chat/internal/domain/message/model"
	"github.com/google/uuid"
)

type MessageAppService interface {
	SendMessage(ctx context.Context, message *mm.Message) (*mm.Message, error)
	SendMessageWithAttachments(ctx context.Context, message *mm.Message, attachmentIDs []uuid.UUID) (*mm.Message, error)
	GetMessagesByConvId(ctx context.Context, conversationID uuid.UUID, afterSeqNo int64, limit int32, isAsc bool) ([]*mm.Message, error)
}

type AttachmentAppService interface {
	GetAttachmentsByIDs(ctx context.Context, conversationID uuid.UUID, attachmentIDs []uuid.UUID) ([]*am.Attachment, error)
	GetDownloadURL(ctx context.Context, attachmentID uuid.UUID) (*am.AttachmentDownloadUrl, error)
	GetAttachmentDataWithDownloadURLs(ctx context.Context, attachments []*am.Attachment) ([]AttachmentData, error)
}
