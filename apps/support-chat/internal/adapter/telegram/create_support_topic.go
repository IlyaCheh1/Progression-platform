package telegram

import (
	"context"
	"fmt"

	telegramApp "github.com/masterofsword/support-chat/internal/app/telegram"
	cm "github.com/masterofsword/support-chat/internal/domain/conversation/model"
	um "github.com/masterofsword/support-chat/internal/domain/user/model"
)

// CreateSupportTopic creates a new forum topic in Telegram supergroup for support conversation
func (a *TelegramAdapterImpl) CreateSupportTopic(ctx context.Context, conversation *cm.Conversation, user *um.User) (*telegramApp.TopicInfo, error) {
	// Generate topic name: "UserName: Topic: ID"
	topicName := fmt.Sprintf("%s: %s", user.Username, conversation.Id.String()[:8])
	if conversation.Topic != nil && *conversation.Topic != "" {
		topicName = fmt.Sprintf("%s: %s: %s", user.Username, *conversation.Topic, conversation.Id.String()[:8])
	}

	// Create topic via Telegram Bot API
	response, err := a.client.CreateForumTopic(ctx, a.supportChatID, topicName)
	if err != nil {
		return nil, fmt.Errorf("failed to create forum topic: %w", err)
	}

	// Convert to domain model
	topicInfo := &telegramApp.TopicInfo{
		ChatID:   a.supportChatID,
		TopicID:  response.Result.MessageThreadID,
		TopicURL: fmt.Sprintf("https://t.me/c/%d/%d", a.supportChatID, response.Result.MessageThreadID),
	}

	a.logger.Info("Successfully created Telegram support topic",
		"conversation_id", conversation.Id,
		"chat_id", topicInfo.ChatID,
		"topic_id", topicInfo.TopicID)

	return topicInfo, nil
}
