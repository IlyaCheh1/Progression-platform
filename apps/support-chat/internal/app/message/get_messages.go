package message

import (
	"context"

	"github.com/google/uuid"

	"github.com/masterofsword/support-chat/internal/domain/message/model"
)

func (s *MessageAppServiceImpl) GetMessagesByConvId(ctx context.Context, convID uuid.UUID, afterSeq int64, limit int32, isAsc bool) ([]*model.Message, error) {
	// Get messages through domain service
	messages, err := s.messService.GetMessagesByConvId(ctx, convID, afterSeq, limit, isAsc)
	if err != nil {
		s.logger.Error("Failed to get messages",
			"conversation_id", convID,
			"after_seq", afterSeq,
			"limit", limit,
			"error", err)
		return nil, err
	}

	s.logger.Debug("Retrieved messages",
		"conversation_id", convID,
		"count", len(messages),
		"after_seq", afterSeq)

	return messages, nil
}
