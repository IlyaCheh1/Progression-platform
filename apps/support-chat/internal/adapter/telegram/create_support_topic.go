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
	if a.supportChatID == 0 {
		return nil, fmt.Errorf("telegram support_chat_id is not configured (got 0)")
	}

	username := "user"
	if user != nil && user.Username != "" {
		username = user.Username
	}

	// Telegram forum topic name limit is 1..128 chars.
	topicName := fmt.Sprintf("%s: %s", username, conversation.Id.String()[:8])
	if conversation.Topic != nil && *conversation.Topic != "" {
		topicName = fmt.Sprintf("%s: %s: %s", username, *conversation.Topic, conversation.Id.String()[:8])
	}
	if len([]rune(topicName)) > 128 {
		runes := []rune(topicName)
		topicName = string(runes[:128])
	}

	response, err := a.client.CreateForumTopic(ctx, a.supportChatID, topicName)
	if err != nil {
		return nil, fmt.Errorf("failed to create forum topic in chat %d: %w", a.supportChatID, err)
	}
	if response.Result.MessageThreadID == 0 {
		return nil, fmt.Errorf("telegram createForumTopic returned empty message_thread_id for chat %d", a.supportChatID)
	}

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
