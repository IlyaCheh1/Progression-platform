package service

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
	"github.com/google/uuid"
)

func (s *ConversationDomainServiceImpl) GetConversationById(ctx context.Context, conversationId uuid.UUID) (*model.Conversation, error) {
	return s.repo.FindConversationById(ctx, conversationId)
}

func (s *ConversationDomainServiceImpl) GetConversationsByThreadId(ctx context.Context, chatId int64, topicId int32) (*model.Conversation, error) {
	return s.repo.FindConversationByThreadId(ctx, chatId, topicId)
}
