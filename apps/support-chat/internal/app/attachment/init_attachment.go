package attachment

import (
	"context"
	"crypto/rand"
	"fmt"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/masterofsword/support-chat/internal/domain/attachment/model"
)

func (s *AttachmentAppServiceImpl) InitAttachment(ctx context.Context, attachmentInit *model.AttachmentInit) (*model.Attachment, string, int, error) {
	if err := s.validateFile(attachmentInit); err != nil {
		s.logger.Error("File validation failed", "error", err)
		return nil, "", 0, err
	}

	storageKey := s.generateStorageKey(attachmentInit.FileName)
	attachmentInit.StorageKey = storageKey

	attachment, err := s.attachmentService.CreateAttachment(ctx, attachmentInit)
	if err != nil {
		s.logger.Error("Failed to create attachment", "error", err)
		return nil, "", 0, err
	}

	uploadURL, err := s.s3Service.GeneratePresignedUploadURL(ctx, storageKey, attachmentInit.ContentType)
	if err != nil {
		s.logger.Error("Failed to generate upload URL", "attachment_id", attachment.ID, "error", err)
		return nil, "", 0, err
	}

	s.logger.Info("Attachment initialized", "attachment_id", attachment.ID, "conversation_id", attachmentInit.ConversationID)
	return attachment, uploadURL, s.storageConfig.PresignedTTL, nil
}

func (s *AttachmentAppServiceImpl) validateFile(attachmentInit *model.AttachmentInit) error {
	if attachmentInit.SizeBytes > s.storageConfig.MaxFileSize {
		return fmt.Errorf("file size exceeds maximum allowed size")
	}

	if !slices.Contains(s.storageConfig.AllowedTypes, attachmentInit.ContentType) {
		return fmt.Errorf("content type not allowed")
	}

	if strings.TrimSpace(attachmentInit.FileName) == "" {
		return fmt.Errorf("file name cannot be empty")
	}

	return nil
}

func (s *AttachmentAppServiceImpl) generateStorageKey(fileName string) string {
	ext := filepath.Ext(fileName)
	randomBytes := make([]byte, 16)
	rand.Read(randomBytes)

	timestamp := time.Now().Format("2006/01/02")
	randomStr := fmt.Sprintf("%x", randomBytes)

	return fmt.Sprintf("attachments/%s/%s%s", timestamp, randomStr, ext)
}
