package http

import (
	"context"

	api "github.com/masterofsword/support-chat/internal/api/http/generated"
	"github.com/masterofsword/support-chat/internal/domain/attachment/model"
)

func (h *HttpApiHandler) InitAttachment(ctx context.Context, req api.InitAttachmentRequestObject) (api.InitAttachmentResponseObject, error) {
	conversationID := req.Params.ConversationId

	h.logger.Debug("Initializing attachment",
		"conversation_id", conversationID,
		"file_name", req.Body.FileName,
		"content_type", req.Body.ContentType,
		"size_bytes", req.Body.SizeBytes)

	attachment, uploadURL, expiresIn, err := h.attachmentAppService.InitAttachment(
		ctx,
		&model.AttachmentInit{
			ConversationID: conversationID,
			FileName:       req.Body.FileName,
			ContentType:    req.Body.ContentType,
			SizeBytes:      req.Body.SizeBytes,
		},
	)
	if err != nil {
		h.logger.Error("Failed to initialize attachment", "error", err)
		return api.InitAttachment400JSONResponse{
			Code:    "attachment_init_failed",
			Message: err.Error(),
		}, nil
	}

	h.logger.Info("Attachment initialized successfully", "attachment_id", attachment.ID)

	return api.InitAttachment200JSONResponse{
		AttachmentId: attachment.ID,
		UploadUrl:    uploadURL,
		StorageKey:   attachment.StorageKey,
		ExpiresIn:    expiresIn,
	}, nil
}

func (h *HttpApiHandler) CompleteAttachment(ctx context.Context, req api.CompleteAttachmentRequestObject) (api.CompleteAttachmentResponseObject, error) {
	attachmentID := req.AttachmentId
	conversationID := req.Params.ConversationId

	h.logger.Debug("Completing attachment",
		"attachment_id", attachmentID,
		"conversation_id", conversationID)

	attachment, err := h.attachmentAppService.CompleteAttachment(ctx, attachmentID, conversationID)
	if err != nil {
		h.logger.Error("Failed to complete attachment", "attachment_id", attachmentID, "error", err)
		return api.CompleteAttachment400JSONResponse{
			Code:    "attachment_complete_failed",
			Message: err.Error(),
		}, nil
	}

	h.logger.Info("Attachment completed successfully", "attachment_id", attachmentID)

	var sizeBytes int64
	if attachment.SizeBytes != nil {
		sizeBytes = *attachment.SizeBytes
	}

	return api.CompleteAttachment200JSONResponse{
		AttachmentId: attachment.ID,
		FileName:     attachment.FileName,
		ContentType:  attachment.ContentType,
		SizeBytes:    sizeBytes,
		Status:       api.AttachmentResponseStatus(attachment.Status),
		CreatedAt:    attachment.CreatedAt,
	}, nil
}

func (h *HttpApiHandler) GetAttachmentDownloadUrl(ctx context.Context, req api.GetAttachmentDownloadUrlRequestObject) (api.GetAttachmentDownloadUrlResponseObject, error) {
	attachmentID := req.AttachmentId

	h.logger.Debug("Getting download URL", "attachment_id", attachmentID)

	aDownloadURL, err := h.attachmentAppService.GetDownloadURL(ctx, attachmentID)
	if err != nil {
		h.logger.Error("Failed to get download URL", "attachment_id", attachmentID, "error", err)
		return api.GetAttachmentDownloadUrl404JSONResponse{
			Code:    "attachment_not_found",
			Message: err.Error(),
		}, nil
	}

	h.logger.Debug("Download URL generated", "attachment_id", attachmentID)

	return api.GetAttachmentDownloadUrl200JSONResponse{
		AttachmentId: attachmentID,
		DownloadUrl:  aDownloadURL.DownloadUrl,
		ExpiresIn:    aDownloadURL.ExpiresIn,
	}, nil
}
