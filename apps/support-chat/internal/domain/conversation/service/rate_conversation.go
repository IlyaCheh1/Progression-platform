package service

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
	"github.com/google/uuid"
)

func (s *ConversationDomainServiceImpl) RateConversation(ctx context.Context, conversationId uuid.UUID, isLike bool) (*model.Conversation, error) {
	var updatedConv *model.Conversation

	err := s.txManager.WithTransaction(ctx, func(ctx context.Context) error {
		conv, err := s.repo.RateConversation(ctx, conversationId, isLike)
		if err != nil {
			return err
		}
		updatedConv = conv

		return nil
	})

	if err != nil {
		return nil, err
	}

	s.logger.Info("Conversation rated", "id", updatedConv.Id, "is_like", updatedConv.IsLike)
	return updatedConv, nil
}
