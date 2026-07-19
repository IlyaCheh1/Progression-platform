package conversation

import (
	"context"

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

	// If support conversation, ensure Telegram topic exists
	if createdConversation.Type == cm.SupportConversationType && s.telegramService != nil {
		updatedConversation, err := s.telegramService.EnsureSupportTopic(ctx, createdConversation)
		if err != nil {
			s.logger.Error("Failed to ensure Telegram topic", "error", err, "conversation_id", createdConversation.Id)
			// Don't fail the entire operation - conversation is already created
			return createdConversation, nil
		}
		return updatedConversation, nil
	}

	return createdConversation, nil
}
