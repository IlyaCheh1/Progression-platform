package service

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
)

func (s *ConversationDomainServiceImpl) GetConversationByThreadId(ctx context.Context, chatId int64, topicId int32) (*model.Conversation, error) {
	return s.repo.FindConversationByThreadId(ctx, chatId, topicId)
}
