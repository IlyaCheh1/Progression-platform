package attachment

import (
	"context"
	"fmt"

	"github.com/masterofsword/support-chat/internal/domain/attachment/model"
	"github.com/google/uuid"
)

func (s *AttachmentAppServiceImpl) GetDownloadURL(ctx context.Context, attachmentID uuid.UUID) (*model.AttachmentDownloadUrl, error) {
	attachment, err := s.attachmentService.GetByID(ctx, attachmentID)
	if err != nil {
		return nil, err
	}

	if attachment.Status != model.CompleteAttachmentStatus {
		return nil, fmt.Errorf("attachment is not complete")
	}

	downloadURL, err := s.s3Service.GeneratePresignedDownloadURL(ctx, attachment.StorageKey)
	if err != nil {
		s.logger.Error("Failed to generate download URL", "attachment_id", attachmentID, "error", err)
		return nil, err
	}

	return &model.AttachmentDownloadUrl{
		ID:          attachmentID,
		DownloadUrl: downloadURL,
		ExpiresIn:   s.storageConfig.PresignedTTL,
	}, nil
}
