package service

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
)

func (s *ConversationDomainServiceImpl) CreateConversation(ctx context.Context, conversation *model.Conversation) (*model.Conversation, error) {
	var createdConv *model.Conversation

	err := s.txManager.WithTransaction(ctx, func(ctx context.Context) error {
		conv, err := s.repo.FindOpenConversationByUser(ctx, conversation.CreatedBy, conversation.Type)
		if err != nil {
			return err
		}

		if conv != nil {
			createdConv = conv
			s.logger.Info("Open conversation already exists with id: ", "id", conv.Id)
			return nil
		}

		createdConv, err = s.repo.CreateConversation(ctx, conversation)
		if err != nil {
			return err
		}

		err = s.repo.AddParticipant(ctx, createdConv.Id, conversation.CreatedBy)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	s.logger.Info("Conversation created with id: ", "id", createdConv.Id)
	return createdConv, nil
}
