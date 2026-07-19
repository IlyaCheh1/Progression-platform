package conversation

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
	"github.com/google/uuid"
)

func (s *ConversationAppServiceImpl) GetMyConversations(ctx context.Context, userId uuid.UUID, limit int32) ([]*model.Conversation, error) {
	return s.convService.GetConversationsByUser(ctx, userId, limit)
}
