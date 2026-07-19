package service

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
	"github.com/google/uuid"
)

func (s *ConversationDomainServiceImpl) GetConversationsByUser(ctx context.Context, userID uuid.UUID, limit int32) ([]*model.Conversation, error) {
	var foundConvs []*model.Conversation

	err := s.txManager.WithTransaction(ctx, func(ctx context.Context) error {
		rows, err := s.repo.FindConversationsByUser(ctx, userID, limit)
		if err != nil {
			return err
		}

		foundConvs = rows
		return nil
	})

	if err != nil {
		return nil, err
	}

	s.logger.Info("Found conversations for user", "userID", userID, "count", len(foundConvs))

	return foundConvs, nil
}
