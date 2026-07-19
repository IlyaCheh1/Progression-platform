package telegram

import (
	"context"
	"fmt"
	"strings"
	"time"

	cm "github.com/masterofsword/support-chat/internal/domain/conversation/model"
	mm "github.com/masterofsword/support-chat/internal/domain/message/model"
)

func (s *TelegramAppServiceImpl) ProcessWebhook(ctx context.Context, secret string, incomingMessage *IncomingMessage) error {
	// Validate webhook secret
	if secret != s.webhookSecret {
		return fmt.Errorf("invalid webhook secret")
	}

	s.logger.Debug("Processing Telegram webhook",
		"chat_id", incomingMessage.ChatID,
		"topic_id", incomingMessage.TopicID,
		"sender", incomingMessage.SenderName,
		"telegram_message_id", incomingMessage.TelegramMessageID)

	// Find conversation by chat_id and topic_id
	conversation, err := s.conversationService.GetConversationByThreadId(ctx, incomingMessage.ChatID, incomingMessage.TopicID)
	if err != nil {
		s.logger.Error("Failed to find conversation for Telegram message",
			"chat_id", incomingMessage.ChatID,
			"topic_id", incomingMessage.TopicID,
			"error", err)
		return nil
	}

	// Check if message is a /closed command
	if strings.HasPrefix(strings.TrimSpace(incomingMessage.Text), "/closed") {
		return s.handleClosedCommand(ctx, conversation, incomingMessage)
	}

	// Create domain message from incoming Telegram message
	domainMessage := &mm.Message{
		ConversationID: conversation.Id,
		SenderKind:     mm.SupportSenderKind,
		Source:         mm.TelegramMessageSource,
		ContentType:    mm.TextContentType,
		ContentText:    &incomingMessage.Text,
		TgMessageID:    &incomingMessage.TelegramMessageID,
	}

	// Save message to database
	createdMessage, err := s.messageService.CreateMessage(ctx, domainMessage)
	if err != nil {
		s.logger.Error("Failed to create message from Telegram webhook",
			"conversation_id", conversation.Id,
			"telegram_message_id", incomingMessage.TelegramMessageID,
			"error", err)
		return fmt.Errorf("failed to create message: %w", err)
	}

	s.logger.Info("Successfully processed Telegram webhook message",
		"conversation_id", conversation.Id,
		"message_id", createdMessage.ID)

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

	return nil
}

// handleClosedCommand processes the /closed command to close a conversation
func (s *TelegramAppServiceImpl) handleClosedCommand(ctx context.Context, conversation *cm.Conversation, incomingMessage *IncomingMessage) error {
	// Extract reason from command (everything after /closed)
	reason := "Закрыто поддержкой"
	commandText := strings.TrimSpace(incomingMessage.Text)
	if len(commandText) > 7 { // "/closed" is 7 characters
		reason = strings.TrimSpace(commandText[7:])
		if reason == "" {
			reason = "Закрыто поддержкой"
		}
	}

	s.logger.Info("Processing /closed command",
		"conversation_id", conversation.Id,
		"sender", incomingMessage.SenderName,
		"reason", reason)

	// Update conversation status to closed
	updatedConversation, err := s.conversationService.UpdateConversationStatus(ctx, conversation.Id, cm.ClosedConversationStatus)
	if err != nil {
		s.logger.Error("Failed to close conversation",
			"conversation_id", conversation.Id,
			"error", err)
		return fmt.Errorf("failed to close conversation: %w", err)
	}

	s.logger.Info("Conversation closed successfully",
		"conversation_id", conversation.Id,
		"status", updatedConversation.Status,
		"closed_by", incomingMessage.SenderName)

	// Broadcast conversation closed event to all connected clients
	if s.conversationBroadcaster != nil {
		closedAt := time.Now()
		if err := s.conversationBroadcaster.BroadcastConversationClosed(
			conversation.Id.String(),
			incomingMessage.SenderName,
			reason,
			closedAt,
		); err != nil {
			s.logger.Error("Failed to broadcast conversation closed event",
				"conversation_id", conversation.Id,
				"error", err)
		} else {
			s.logger.Debug("Conversation closed event broadcasted successfully",
				"conversation_id", conversation.Id,
				"closed_by", incomingMessage.SenderName,
				"reason", reason)
		}
	}

	return nil
}
