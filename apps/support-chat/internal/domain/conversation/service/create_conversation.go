package service

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
)

func (s *ConversationDomainServiceImpl) CreateConversation(ctx context.Context, conversation *model.Conversation) (*model.Conversation, error) {
	var createdConv *model.Conversation

	// Always create a new conversation. The web widget expects a fresh support
	// thread on each init; reusing an open one kept stale welcome text in history.
	err := s.txManager.WithTransaction(ctx, func(ctx context.Context) error {
		conv, err := s.repo.CreateConversation(ctx, conversation)
		if err != nil {
			return err
		}
		createdConv = conv

		return s.repo.AddParticipant(ctx, createdConv.Id, conversation.CreatedBy)
	})

	if err != nil {
		return nil, err
	}

	s.logger.Info("Conversation created with id: ", "id", createdConv.Id)
	return createdConv, nil
}
