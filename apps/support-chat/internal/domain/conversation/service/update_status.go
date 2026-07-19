package service

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
	"github.com/google/uuid"
)

func (s *ConversationDomainServiceImpl) UpdateConversationStatus(ctx context.Context, conversationId uuid.UUID, status model.ConversationStatus) (*model.Conversation, error) {
	var updatedConv *model.Conversation

	err := s.txManager.WithTransaction(ctx, func(ctx context.Context) error {
		conv, err := s.repo.UpdateConversationStatus(ctx, conversationId, status)
		if err != nil {
			return err
		}
		updatedConv = conv

		return nil
	})

	if err != nil {
		return nil, err
	}

	s.logger.Info("Conversation status updated with id: ", "id", updatedConv.Id, "status", updatedConv.Status)
	return updatedConv, nil
}
