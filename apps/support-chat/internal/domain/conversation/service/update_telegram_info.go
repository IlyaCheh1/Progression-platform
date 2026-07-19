package service

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
	"github.com/google/uuid"
)

func (s *ConversationDomainServiceImpl) UpdateTelegramInfo(ctx context.Context, conversationId uuid.UUID, chatId int64, topicId int32) (*model.Conversation, error) {
	var updatedConv *model.Conversation

	err := s.txManager.WithTransaction(ctx, func(ctx context.Context) error {
		conv, err := s.repo.UpdateTelegramInfo(ctx, conversationId, chatId, topicId)
		if err != nil {
			return err
		}
		updatedConv = conv

		return nil
	})

	if err != nil {
		return nil, err
	}

	s.logger.Info("Conversation Telegram info updated",
		"conversation_id", updatedConv.Id,
		"tg_chat_id", chatId,
		"tg_topic_id", topicId)

	return updatedConv, nil
}
