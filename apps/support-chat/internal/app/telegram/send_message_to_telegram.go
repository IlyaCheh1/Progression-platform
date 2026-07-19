package telegram

import (
	"context"

	mm "github.com/masterofsword/support-chat/internal/domain/message/model"
)

func (s *TelegramAppServiceImpl) SendMessageToTelegram(ctx context.Context, message *mm.Message) error {
	s.logger.Debug("Sending message to Telegram",
		"message_id", message.ID,
		"conversation_id", message.ConversationID)

	// Get conversation info to obtain chat_id and topic_id
	conversation, err := s.conversationService.GetConversationById(ctx, message.ConversationID)
	if err != nil {
		s.logger.Error("Failed to get conversation info for Telegram send",
			"conversation_id", message.ConversationID,
			"error", err)
		return err
	}

	user, err := s.userService.GetUserById(ctx, conversation.CreatedBy)
	if err != nil {
		s.logger.Error("Failed to get user info for Telegram send",
			"user_id", conversation.CreatedBy,
			"conversation_id", message.ConversationID,
			"error", err)
		return err
	}

	// At this point we assume all checks were done by caller
	// Just send the message to Telegram topic
	sentMessage, err := s.telegramAdapter.SendMessageToTopic(
		ctx,
		*conversation.TgSupportChatID,
		*conversation.TgSupportTopicID,
		message,
		user,
	)

	if err != nil {
		s.logger.Error("Failed to send message to Telegram",
			"conversation_id", message.ConversationID,
			"chat_id", *conversation.TgSupportChatID,
			"topic_id", *conversation.TgSupportTopicID,
			"error", err)
		return err
	}

	s.logger.Info("Message sent to Telegram successfully",
		"message_id", message.ID,
		"conversation_id", message.ConversationID,
		"telegram_message_id", sentMessage.TelegramMessageID,
		"chat_id", *conversation.TgSupportChatID,
		"topic_id", *conversation.TgSupportTopicID)

	return nil
}
