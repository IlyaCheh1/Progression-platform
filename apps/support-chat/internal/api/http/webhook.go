package http

import (
	"context"
	"errors"
	"fmt"

	api "github.com/masterofsword/support-chat/internal/api/http/generated"
	telegram "github.com/masterofsword/support-chat/internal/app/telegram"
)

var ErrWebhookMessageSkipped = errors.New("webhook message should be skipped")

func (h *HttpApiHandler) WebhookTelegram(ctx context.Context, req api.WebhookTelegramRequestObject) (api.WebhookTelegramResponseObject, error) {
	h.logger.Debug("Telegram webhook received", "secret", req.Secret)

	if req.Body == nil {
		return api.WebhookTelegram400JSONResponse{
			Code:    "bad_request",
			Message: "Empty webhook body",
		}, nil
	}

	// Convert webhook body to IncomingMessage using generated types
	incomingMessage, err := h.convertTelegramWebhookToIncomingMessage(*req.Body)
	if err != nil {
		// Check if this is a message that should be skipped (not an error)
		if errors.Is(err, ErrWebhookMessageSkipped) {
			h.logger.Debug("Skipping Telegram webhook message", "reason", err.Error())
			return api.WebhookTelegram200Response{}, nil
		}

		h.logger.Error("Failed to convert Telegram webhook", "error", err)
		return api.WebhookTelegram400JSONResponse{
			Code:    "conversion_error",
			Message: fmt.Sprintf("Failed to process webhook: %s", err.Error()),
		}, nil
	}

	// Process webhook through Telegram app service
	err = h.telegramAppService.ProcessWebhook(ctx, req.Secret, incomingMessage)
	if err != nil {
		h.logger.Error("Failed to process Telegram webhook", "error", err)
		return api.WebhookTelegram500JSONResponse{
			Code:    "processing_error",
			Message: fmt.Sprintf("Failed to process webhook: %s", err.Error()),
		}, nil
	}

	return api.WebhookTelegram200Response{}, nil
}

// convertTelegramWebhookToIncomingMessage converts Telegram webhook data to IncomingMessage
func (h *HttpApiHandler) convertTelegramWebhookToIncomingMessage(telegramUpdate api.TelegramUpdate) (*telegram.IncomingMessage, error) {
	// Skip updates without message
	if telegramUpdate.Message == nil {
		h.logger.Debug("Skipping webhook: no message in update", "update_id", telegramUpdate.UpdateId)
		return nil, fmt.Errorf("%w: no message in webhook update", ErrWebhookMessageSkipped)
	}

	msg := *telegramUpdate.Message

	// Skip messages without text (e.g., photos, stickers, etc.)
	if msg.Text == "" {
		h.logger.Debug("Skipping webhook: no text in message",
			"update_id", telegramUpdate.UpdateId,
			"message_id", msg.MessageId)
		return nil, fmt.Errorf("%w: message has no text content", ErrWebhookMessageSkipped)
	}

	// Skip messages without thread ID (not from forum topics)
	if msg.MessageThreadId == nil {
		h.logger.Debug("Skipping webhook: message not from forum topic",
			"update_id", telegramUpdate.UpdateId,
			"message_id", msg.MessageId,
			"chat_id", msg.Chat.Id)
		return nil, fmt.Errorf("%w: message not from forum topic", ErrWebhookMessageSkipped)
	}

	// Get sender name from Telegram user info
	senderName := msg.From.FirstName
	if msg.From.Username != nil && *msg.From.Username != "" {
		senderName = "@" + *msg.From.Username
	}

	// Create IncomingMessage with chat/topic identifiers
	incomingMessage := &telegram.IncomingMessage{
		ChatID:            msg.Chat.Id,
		TopicID:           *msg.MessageThreadId,
		Text:              msg.Text,
		SenderName:        senderName,
		TelegramMessageID: msg.MessageId,
	}

	h.logger.Debug("Converted Telegram webhook to IncomingMessage",
		"update_id", telegramUpdate.UpdateId,
		"chat_id", incomingMessage.ChatID,
		"topic_id", incomingMessage.TopicID, "sender", incomingMessage.SenderName)

	return incomingMessage, nil
}
