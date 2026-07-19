package conversation

import (
	"context"
	"time"

	cm "github.com/masterofsword/support-chat/internal/domain/conversation/model"
	"github.com/masterofsword/support-chat/internal/domain/user/model"
	"github.com/google/uuid"
)

type CreateConversationInfo struct {
	Type       cm.ConversationType
	Topic      *string
	Source     cm.ConversationSource
	PageUrl    *string
	Locale     *string
	AppVersion *string
	UserId     uuid.UUID
	Username   string
}

func (s *ConversationAppServiceImpl) CreateConversation(ctx context.Context, info *CreateConversationInfo) (*cm.Conversation, error) {
	s.logger.Info("CreateConversation called", "type", info.Type, "user_id", info.UserId, "username", info.Username)

	// Create or get user using existing service method
	user := &model.User{
		Id:       info.UserId,
		Username: info.Username,
	}

	actualUser, err := s.userService.CreateOrGetUser(ctx, user)
	if err != nil {
		s.logger.Error("Failed to create or get user", "error", err, "user_id", info.UserId, "username", info.Username)
		return nil, err
	}

	s.logger.Info("User ensured for conversation", "user_id", actualUser.Id, "username", actualUser.Username)

	// Create conversation from info
	conversation := &cm.Conversation{
		Type:       info.Type,
		Topic:      info.Topic,
		Source:     info.Source,
		PageUrl:    info.PageUrl,
		Locale:     info.Locale,
		AppVersion: info.AppVersion,
		CreatedBy:  actualUser.Id,
	}

	// Create conversation in domain
	createdConversation, err := s.convService.CreateConversation(ctx, conversation)
	if err != nil {
		return nil, err
	}

	// Ensure Telegram topic in background so chat open is not blocked by Bot API latency.
	// First user message also lazily ensures the topic if it is still missing.
	if createdConversation.Type == cm.SupportConversationType && s.telegramService != nil {
		go s.ensureSupportTopicAsync(createdConversation)
	}

	return createdConversation, nil
}

func (s *ConversationAppServiceImpl) ensureSupportTopicAsync(conversation *cm.Conversation) {
	bgCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if _, err := s.telegramService.EnsureSupportTopic(bgCtx, conversation); err != nil {
		s.logger.Error("Failed to ensure Telegram topic (async)",
			"error", err,
			"conversation_id", conversation.Id)
	}
}
