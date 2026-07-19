package message

import (
	"context"

	cm "github.com/masterofsword/support-chat/internal/domain/conversation/model"
	"github.com/masterofsword/support-chat/internal/domain/message/model"
	"github.com/google/uuid"
)

func (s *MessageAppServiceImpl) SendMessage(ctx context.Context, message *model.Message) (*model.Message, error) {
	return s.SendMessageWithAttachments(ctx, message, nil)
}

func (s *MessageAppServiceImpl) SendMessageWithAttachments(ctx context.Context, message *model.Message, attachmentIDs []uuid.UUID) (*model.Message, error) {
	createdMessage, err := s.messService.CreateMessage(ctx, message)
	if err != nil {
		s.logger.Error("Failed to create message",
			"conversation_id", message.ConversationID,
			"error", err)
		return nil, err
	}

	s.logger.Info("Message created successfully",
		"message_id", createdMessage.ID,
		"conversation_id", createdMessage.ConversationID)

	// Bind attachments to the message if provided
	if len(attachmentIDs) > 0 {
		if err := s.attachmentService.BindAttachmentsToMessage(ctx, createdMessage.ConversationID, createdMessage.ID, attachmentIDs); err != nil {
			s.logger.Error("Failed to bind attachments to message",
				"message_id", createdMessage.ID,
				"conversation_id", createdMessage.ConversationID,
				"attachment_count", len(attachmentIDs),
				"error", err)
			// Note: We don't return error here as the message was already created
		} else {
			createdMessage.AttachmentIDs = attachmentIDs
			s.logger.Info("Attachments bound to message successfully",
				"message_id", createdMessage.ID,
				"attachment_count", len(attachmentIDs))
		}
	}

	// Broadcast message to all connected clients
	if s.broadcaster != nil {
		if err := s.broadcaster.BroadcastMessage(createdMessage); err != nil {
			s.logger.Error("Failed to broadcast message",
				"message_id", createdMessage.ID,
				"conversation_id", createdMessage.ConversationID,
				"error", err)
		} else {
			s.logger.Debug("Message broadcasted successfully",
				"message_id", createdMessage.ID,
				"conversation_id", createdMessage.ConversationID)
		}
	}

	// Send user message to Telegram if conditions are met
	if err := s.sendToTelegramIfNeeded(ctx, createdMessage); err != nil {
		s.logger.Error("Failed to send message to Telegram",
			"message_id", createdMessage.ID,
			"conversation_id", createdMessage.ConversationID,
			"error", err)
	}

	return createdMessage, nil
}

// sendToTelegramIfNeeded checks if message should be sent to Telegram and sends it
func (s *MessageAppServiceImpl) sendToTelegramIfNeeded(ctx context.Context, message *model.Message) error {
	// Only send user messages to Telegram (not support messages)
	if message.SenderKind != model.UserSenderKind {
		s.logger.Debug("Message is not from user, skipping Telegram send",
			"message_id", message.ID,
			"sender_kind", message.SenderKind)
		return nil
	}

	// Skip if no Telegram service configured
	if s.telegramService == nil {
		s.logger.Debug("No Telegram service configured, skipping",
			"message_id", message.ID)
		return nil
	}

	// Get conversation info to check type and Telegram integration
	conversation, err := s.convService.GetConversationById(ctx, message.ConversationID)
	if err != nil {
		s.logger.Error("Failed to get conversation info for Telegram check",
			"conversation_id", message.ConversationID,
			"error", err)
		return err
	}

	// Check if conversation is support type
	if conversation.Type != cm.SupportConversationType {
		s.logger.Debug("Conversation is not support type, skipping Telegram send",
			"conversation_id", message.ConversationID,
			"type", conversation.Type)
		return nil
	}

	// Check if Telegram integration is configured for this conversation
	if conversation.TgSupportChatID == nil || conversation.TgSupportTopicID == nil {
		s.logger.Debug("Conversation has no Telegram integration configured, skipping",
			"conversation_id", message.ConversationID)
		return nil
	}

	// All conditions met - send to Telegram
	s.logger.Debug("Sending user message to Telegram",
		"message_id", message.ID,
		"conversation_id", message.ConversationID,
		"chat_id", *conversation.TgSupportChatID,
		"topic_id", *conversation.TgSupportTopicID)

	return s.telegramService.SendMessageToTelegram(ctx, message)
}
