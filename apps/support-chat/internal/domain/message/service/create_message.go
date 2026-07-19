package service

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/message/model"
)

func (s *MessageDomainServiceImpl) CreateMessage(ctx context.Context, message *model.Message) (*model.Message, error) {
	var createdMessage *model.Message

	err := s.txManager.WithTransaction(ctx, func(ctx context.Context) error {
		var err error
		createdMessage, err = s.repo.CreateMessage(ctx, message)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	s.logger.Info("Message created", "id", createdMessage.ID, "conversation_id", createdMessage.ConversationID)
	return createdMessage, nil
}
