package conversation

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
	"github.com/google/uuid"
)

func (s *ConversationAppServiceImpl) UpdateConversationStatus(ctx context.Context, conversationId uuid.UUID, status model.ConversationStatus) (*model.Conversation, error) {
	return s.convService.UpdateConversationStatus(ctx, conversationId, status)
}

func (s *ConversationAppServiceImpl) RateConversation(ctx context.Context, conversationId uuid.UUID, isLike bool) (*model.Conversation, error) {
	return s.convService.RateConversation(ctx, conversationId, isLike)
}
