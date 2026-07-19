package http

import (
	"context"
	"net/http"

	"github.com/google/uuid"

	api "github.com/masterofsword/support-chat/internal/api/http/generated"
	attachmentModel "github.com/masterofsword/support-chat/internal/domain/attachment/model"
	messageModel "github.com/masterofsword/support-chat/internal/domain/message/model"
)

func (h *HttpApiHandler) GetMessagesByConversationId(ctx context.Context, req api.GetMessagesByConversationIdRequestObject) (api.GetMessagesByConversationIdResponseObject, error) {
	convId := req.ConversationId

	// Parse query parameters with defaults
	afterSeq := int64(0)
	if req.Params.AfterSeq != nil {
		afterSeq = int64(*req.Params.AfterSeq)
	}

	limit := int32(1000) // Default limit
	if req.Params.Limit != nil {
		limit = int32(*req.Params.Limit)
	}

	h.logger.Debug("Getting messages", "conversation_id", convId, "after_seq", afterSeq, "limit", limit)

	// Get messages through message app service
	messages, err := h.messageAppService.GetMessagesByConvId(ctx, convId, afterSeq, limit, false)
	if err != nil {
		h.logger.Error("Failed to get messages", "error", err, "conversation_id", convId)
		return api.GetMessagesByConversationId500JSONResponse{
			Code:    http.StatusText(http.StatusInternalServerError),
			Message: "Failed to retrieve messages",
		}, nil
	}

	// Convert domain messages to API messages
	apiMessages := make([]api.Message, len(messages))
	for i, msg := range messages {
		// Get attachments with download URLs if message has attachments
		var attachments *[]api.Attachment
		if len(msg.AttachmentIDs) > 0 {
			apiAttachments, err := h.getAttachmentsWithDownloadURLs(ctx, convId, msg.AttachmentIDs)
			if err != nil {
				h.logger.Error("Failed to get attachments for message", "error", err, "message_id", msg.ID)
				// Continue without attachments rather than failing the entire request
			} else if len(apiAttachments) > 0 {
				attachments = &apiAttachments
			}
		}

		apiMessages[i] = api.Message{
			MessageId:        msg.ID,
			ConversationId:   msg.ConversationID,
			SeqNo:            int(msg.SeqNo),
			Sender:           api.MessageSender(msg.SenderKind),
			Source:           api.MessageSource(msg.Source),
			ContentType:      api.MessageContentType(msg.ContentType),
			Text:             msg.ContentText,
			Attachments:      attachments,
			ReplyToMessageId: msg.ReplyToMessageID,
			CreatedAt:        msg.CreatedAt,
		}
	}

	// Calculate next_after_seq for pagination
	var nextAfterSeq *int
	if len(messages) > 0 {
		lastSeq := int(messages[len(messages)-1].SeqNo)
		nextAfterSeq = &lastSeq
	}

	response := api.MessageListResponse{
		ConversationId: &convId,
		Items:          &apiMessages,
		NextAfterSeq:   nextAfterSeq,
	}

	h.logger.Debug("Messages retrieved successfully",
		"conversation_id", convId,
		"count", len(messages),
		"next_after_seq", nextAfterSeq)

	return api.GetMessagesByConversationId200JSONResponse(response), nil
}

func (h *HttpApiHandler) SendMessageByConversationId(ctx context.Context, req api.SendMessageByConversationIdRequestObject) (api.SendMessageByConversationIdResponseObject, error) {
	convUUID := req.ConversationId

	if req.Body == nil {
		return api.SendMessageByConversationId400JSONResponse{
			Code:    http.StatusText(http.StatusBadRequest),
			Message: "Request body is required",
		}, nil
	}

	body := *req.Body

	// Validate message content - must have either text or attachments
	isTextEmpty := body.Text == nil || *body.Text == ""
	isAttachmentsEmpty := body.Attachments == nil || len(*body.Attachments) == 0

	if isTextEmpty && isAttachmentsEmpty {
		return api.SendMessageByConversationId400JSONResponse{
			Code:    http.StatusText(http.StatusBadRequest),
			Message: "Message must contain either text or attachments",
		}, nil
	}

	h.logger.Debug("Creating message via HTTP",
		"conversation_id", convUUID,
		"user_id", req.Params.UserId,
		"text_length", len(*body.Text),
		"client_id", body.ClientId)

	// Create message model with attachment IDs if provided
	var attachmentIDs []uuid.UUID
	if body.Attachments != nil {
		for _, attachmentID := range *body.Attachments {
			attachmentIDs = append(attachmentIDs, attachmentID)
		}
	}

	messModel := &messageModel.Message{
		ConversationID:   convUUID,
		SenderKind:       messageModel.UserSenderKind,
		Source:           messageModel.WebMessageSource,
		ContentType:      messageModel.TextContentType,
		ContentText:      body.Text,
		ClientID:         body.ClientId,
		ReplyToMessageID: body.ReplyToMessageId,
		AttachmentIDs:    attachmentIDs,
	}

	// Create message through MessageAppService (broadcast is handled inside)
	createdMessage, err := h.messageAppService.SendMessage(ctx, messModel)
	if err != nil {
		h.logger.Error("Failed to create message via HTTP", "error", err, "conversation_id", convUUID)
		return api.SendMessageByConversationId500JSONResponse{
			Code:    http.StatusText(http.StatusInternalServerError),
			Message: "Failed to create message",
		}, nil
	}

	// Get attachments with download URLs if message has attachments
	var attachments *[]api.Attachment
	if len(createdMessage.AttachmentIDs) > 0 {
		apiAttachments, err := h.getAttachmentsWithDownloadURLs(ctx, convUUID, createdMessage.AttachmentIDs)
		if err != nil {
			h.logger.Error("Failed to get attachments for created message", "error", err, "message_id", createdMessage.ID)
			// Continue without attachments rather than failing the entire request
		} else if len(apiAttachments) > 0 {
			attachments = &apiAttachments
		}
	}

	// Convert domain message to API message
	apiMessage := api.Message{
		MessageId:        createdMessage.ID,
		ConversationId:   createdMessage.ConversationID,
		SeqNo:            int(createdMessage.SeqNo),
		Sender:           api.MessageSender(createdMessage.SenderKind),
		Source:           api.MessageSource(createdMessage.Source),
		ContentType:      api.MessageContentType(createdMessage.ContentType),
		Text:             createdMessage.ContentText,
		Attachments:      attachments,
		ReplyToMessageId: createdMessage.ReplyToMessageID,
		CreatedAt:        createdMessage.CreatedAt,
	}

	h.logger.Info("Message created successfully via HTTP",
		"message_id", createdMessage.ID.String(),
		"conversation_id", convUUID,
		"seq_no", createdMessage.SeqNo)

	return api.SendMessageByConversationId200JSONResponse(apiMessage), nil
}

// getAttachmentsWithDownloadURLs fetches attachments by IDs and generates download URLs
func (h *HttpApiHandler) getAttachmentsWithDownloadURLs(ctx context.Context, conversationID uuid.UUID, attachmentIDs []uuid.UUID) ([]api.Attachment, error) {
	if len(attachmentIDs) == 0 {
		return []api.Attachment{}, nil
	}

	// Get attachments from the service
	attachments, err := h.attachmentAppService.GetAttachmentsByIDs(ctx, conversationID, attachmentIDs)
	if err != nil {
		return nil, err
	}

	// Convert to API attachments with download URLs
	apiAttachments := make([]api.Attachment, 0, len(attachments))
	for _, attachment := range attachments {
		// Only include completed attachments
		if attachment.Status != attachmentModel.CompleteAttachmentStatus {
			continue
		}

		// Generate download URL
		downloadURLData, err := h.attachmentAppService.GetDownloadURL(ctx, attachment.ID)
		if err != nil {
			h.logger.Error("Failed to generate download URL", "attachment_id", attachment.ID, "error", err)
			continue
		}

		var sizeBytes int64
		if attachment.SizeBytes != nil {
			sizeBytes = *attachment.SizeBytes
		}

		apiAttachment := api.Attachment{
			AttachmentId: attachment.ID,
			FileName:     attachment.FileName,
			ContentType:  attachment.ContentType,
			SizeBytes:    sizeBytes,
			DownloadUrl:  &downloadURLData.DownloadUrl,
			ExpiresIn:    &downloadURLData.ExpiresIn,
		}

		apiAttachments = append(apiAttachments, apiAttachment)
	}

	return apiAttachments, nil
}
