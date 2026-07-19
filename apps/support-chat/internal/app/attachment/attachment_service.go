package attachment

import (
	"context"
	"log/slog"

	"github.com/masterofsword/support-chat/internal/api/ws"
	"github.com/masterofsword/support-chat/internal/domain/attachment/model"
	"github.com/masterofsword/support-chat/internal/infra/config"
	"github.com/google/uuid"
)

type AttachmentAppServiceImpl struct {
	attachmentService AttachmentDomainService
	s3Service         S3StorageService
	storageConfig     config.StorageConfig
	logger            *slog.Logger
}

func NewAppService(
	attachmentService AttachmentDomainService,
	s3Service S3StorageService,
	storageConfig config.StorageConfig,
	logger *slog.Logger,
) *AttachmentAppServiceImpl {
	return &AttachmentAppServiceImpl{
		attachmentService: attachmentService,
		s3Service:         s3Service,
		storageConfig:     storageConfig,
		logger:            logger,
	}
}

func (s *AttachmentAppServiceImpl) GetAttachmentsByIDs(ctx context.Context, conversationID uuid.UUID, attachmentIDs []uuid.UUID) ([]*model.Attachment, error) {
	return s.attachmentService.GetByIDs(ctx, conversationID, attachmentIDs)
}

func (s *AttachmentAppServiceImpl) BindAttachmentsToMessage(ctx context.Context, conversationID, messageID uuid.UUID, attachmentIDs []uuid.UUID) error {
	return s.attachmentService.BindToMessage(ctx, conversationID, messageID, attachmentIDs)
}

func (s *AttachmentAppServiceImpl) GenerateDownloadURLsForAttachments(ctx context.Context, attachments []*model.Attachment) error {
	for _, attachment := range attachments {
		if attachment.Status == model.CompleteAttachmentStatus {
			downloadURL, err := s.s3Service.GeneratePresignedDownloadURL(ctx, attachment.StorageKey)
			if err != nil {
				s.logger.Error("Failed to generate download URL for message attachment",
					"attachment_id", attachment.ID, "error", err)
				continue
			}
			// Note: This is a temporary approach. In production, you might want to return URLs separately
			// or modify the model to include downloadURL as a computed field
			_ = downloadURL
		}
	}
	return nil
}

func (s *AttachmentAppServiceImpl) GetAttachmentDataWithDownloadURLs(ctx context.Context, attachments []*model.Attachment) ([]ws.AttachmentData, error) {
	attachmentData := make([]ws.AttachmentData, 0)

	for _, attachment := range attachments {
		if attachment.Status == model.CompleteAttachmentStatus {
			downloadURL, err := s.s3Service.GeneratePresignedDownloadURL(ctx, attachment.StorageKey)
			if err != nil {
				s.logger.Error("Failed to generate download URL for message attachment",
					"attachment_id", attachment.ID, "error", err)
				continue
			}

			var sizeBytes int64
			if attachment.SizeBytes != nil {
				sizeBytes = *attachment.SizeBytes
			}

			attachmentData = append(attachmentData, ws.AttachmentData{
				AttachmentID: attachment.ID.String(),
				FileName:     attachment.FileName,
				ContentType:  attachment.ContentType,
				SizeBytes:    sizeBytes,
				DownloadURL:  downloadURL,
				ExpiresIn:    s.storageConfig.PresignedTTL,
			})
		}
	}

	return attachmentData, nil
}
