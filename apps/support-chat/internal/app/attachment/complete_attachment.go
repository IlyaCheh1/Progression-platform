package attachment

import (
	"context"
	"fmt"

	"github.com/masterofsword/support-chat/internal/domain/attachment/model"
	"github.com/google/uuid"
)

func (s *AttachmentAppServiceImpl) CompleteAttachment(ctx context.Context, attachmentID, conversationID uuid.UUID) (*model.Attachment, error) {
	attachment, err := s.attachmentService.MarkComplete(ctx, attachmentID, conversationID)
	if err != nil {
		s.logger.Error("Failed to mark attachment complete", "attachment_id", attachmentID, "error", err)
		return nil, err
	}

	// Verify file exists in S3
	if _, err := s.s3Service.HeadObject(ctx, attachment.StorageKey); err != nil {
		s.logger.Error("File verification failed", "attachment_id", attachmentID, "storage_key", attachment.StorageKey, "error", err)
		return nil, fmt.Errorf("file verification failed: %w", err)
	}

	s.logger.Info("Attachment completed", "attachment_id", attachmentID)
	return attachment, nil
}
