package telegram

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/masterofsword/support-chat/internal/adapter/telegram/client"
	telegramApp "github.com/masterofsword/support-chat/internal/app/telegram"
	mm "github.com/masterofsword/support-chat/internal/domain/message/model"
	"github.com/masterofsword/support-chat/internal/domain/user/model"
)

// SendMessageToTopic sends a message to specific forum topic in Telegram supergroup
func (a *TelegramAdapterImpl) SendMessageToTopic(ctx context.Context, chatID int64, topicID int32, message *mm.Message, user *model.User) (*telegramApp.SentMessage, error) {
	return a.sendMessage(ctx, chatID, &topicID, message, user)
}

// SendMessageToChat sends a message to the support chat without a forum topic.
func (a *TelegramAdapterImpl) SendMessageToChat(ctx context.Context, chatID int64, message *mm.Message, user *model.User) (*telegramApp.SentMessage, error) {
	return a.sendMessage(ctx, chatID, nil, message, user)
}

func (a *TelegramAdapterImpl) sendMessage(ctx context.Context, chatID int64, topicID *int32, message *mm.Message, user *model.User) (*telegramApp.SentMessage, error) {
	var lastResponse *telegramApp.SentMessage

	// Send attachments as media group if they exist
	if len(message.AttachmentIDs) > 0 {
		attachments, err := a.attachmentService.GetAttachmentsByIDs(ctx, message.ConversationID, message.AttachmentIDs)
		if err != nil {
			a.logger.Error("Failed to get attachments", "error", err, "attachment_ids", message.AttachmentIDs)
			return nil, fmt.Errorf("failed to get attachments: %w", err)
		}

		var mediaItems []client.MediaItem
		for _, attachment := range attachments {
			if attachment.Status != "complete" {
				a.logger.Warn("Skipping incomplete attachment", "attachment_id", attachment.ID)
				continue
			}

			aDownloadURL, err := a.attachmentService.GetDownloadURL(ctx, attachment.ID)
			if err != nil {
				a.logger.Error("Failed to get download URL for attachment", "attachment_id", attachment.ID, "error", err)
				continue
			}

			mediaType := "document"
			if a.isImageContentType(attachment.ContentType) {
				mediaType = "photo"
			}

			caption := ""
			if len(mediaItems) == 0 && message.ContentText != nil {
				caption = a.formatMessageForTelegram(message, user)
			}

			mediaItems = append(mediaItems, client.MediaItem{
				Type:    mediaType,
				Media:   aDownloadURL.DownloadUrl,
				Caption: caption,
			})
		}

		if len(mediaItems) > 0 {
			response, err := a.client.SendMediaGroup(ctx, chatID, mediaItems, topicID)
			if err != nil {
				a.logger.Error("Failed to send media group", "error", err, "media_count", len(mediaItems))
				return nil, fmt.Errorf("failed to send media group: %w", err)
			}

			if len(response.Result) > 0 {
				lastResponse = &telegramApp.SentMessage{
					TelegramMessageID: response.Result[0].MessageID,
					SentAt:            time.Now(),
				}
			}

			a.logger.Info("Sent media group to Telegram",
				"media_count", len(mediaItems),
				"attachments_count", len(attachments))
		}
	}

	if lastResponse == nil && message.ContentText != nil {
		text := a.formatMessageForTelegram(message, user)
		response, err := a.client.SendMessage(ctx, chatID, text, topicID)
		if err != nil {
			return nil, fmt.Errorf("failed to send message to Telegram: %w", err)
		}

		lastResponse = &telegramApp.SentMessage{
			TelegramMessageID: response.Result.MessageID,
			SentAt:            time.Now(),
		}
	}

	if lastResponse == nil {
		return nil, fmt.Errorf("no content was sent to Telegram")
	}

	topicValue := int32(0)
	if topicID != nil {
		topicValue = *topicID
	}

	a.logger.Info("Successfully sent message to Telegram",
		"message_id", message.ID,
		"conversation_id", message.ConversationID,
		"chat_id", chatID,
		"topic_id", topicValue,
		"attachments_count", len(message.AttachmentIDs))

	return lastResponse, nil
}

// formatMessageForTelegram formats domain message for Telegram display
func (a *TelegramAdapterImpl) formatMessageForTelegram(message *mm.Message, user *model.User) string {
	text := *message.ContentText

	// Add sender context for support messages
	switch message.SenderKind {
	case mm.UserSenderKind:
		return fmt.Sprintf("%s: %s", user.Username, text)
	case mm.SystemSenderKind:
		return fmt.Sprintf("System: %s", text)
	default:
		return text
	}
}

// isImageContentType determines if the content type is an image that Telegram can display
func (a *TelegramAdapterImpl) isImageContentType(contentType string) bool {
	imageTypes := []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
	}

	for _, imageType := range imageTypes {
		if strings.EqualFold(contentType, imageType) {
			return true
		}
	}

	return false
}
