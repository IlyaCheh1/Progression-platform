package telegram

import (
	"context"
	"fmt"

	cm "github.com/masterofsword/support-chat/internal/domain/conversation/model"
)

func (s *TelegramAppServiceImpl) EnsureSupportTopic(ctx context.Context, conversation *cm.Conversation) (*cm.Conversation, error) {
	// Check if Telegram info already exists
	if conversation.TgSupportChatID != nil && conversation.TgSupportTopicID != nil && *conversation.TgSupportTopicID != 0 {
		s.logger.Debug("Telegram topic already exists for conversation",
			"conversation_id", conversation.Id,
			"chat_id", *conversation.TgSupportChatID,
			"topic_id", *conversation.TgSupportTopicID)
		return conversation, nil
	}

	user, err := s.userService.GetUserById(ctx, conversation.CreatedBy)
	if err != nil {
		return nil, fmt.Errorf("failed to get user for conversation: %w", err)
	}

	s.logger.Info("Creating Telegram support topic",
		"conversation_id", conversation.Id,
		"user_id", conversation.CreatedBy,
		"username", user.Username)

	topicInfo, err := s.telegramAdapter.CreateSupportTopic(ctx, conversation, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create Telegram topic: %w", err)
	}

	// Update conversation with Telegram info
	updatedConversation, err := s.conversationService.UpdateTelegramInfo(ctx,
		conversation.Id, topicInfo.ChatID, topicInfo.TopicID)
	if err != nil {
		return nil, fmt.Errorf("failed to update conversation with Telegram info: %w", err)
	}

	s.logger.Info("Created Telegram topic for support conversation",
		"conversation_id", conversation.Id,
		"chat_id", topicInfo.ChatID,
		"topic_id", topicInfo.TopicID,
		"topic_url", topicInfo.TopicURL)

	return updatedConversation, nil
}
