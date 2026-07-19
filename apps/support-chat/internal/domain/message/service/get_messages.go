package service

import (
	"context"
	"database/sql"
	"errors"

	"github.com/masterofsword/support-chat/internal/domain/message/model"
	"github.com/google/uuid"
)

func (s *MessageDomainServiceImpl) GetLastSeq(ctx context.Context, conversationID uuid.UUID) (int64, error) {
	lastSeq, err := s.repo.GetLastSeq(ctx, conversationID)
	if err != nil {
		s.logger.Error("Failed to get last seq", "conversation_id", conversationID, "error", err)
		return 0, err
	}

	return lastSeq, nil
}

func (s *MessageDomainServiceImpl) GetMessagesByConvId(ctx context.Context, conversationID uuid.UUID, afterSeqNo int64, limit int32, isAsc bool) ([]*model.Message, error) {
	var messages []*model.Message
	var err error
	if isAsc {
		messages, err = s.repo.FindMessagesByConvId(ctx, conversationID, afterSeqNo, limit)
	} else {
		messages, err = s.repo.FindMessagesByConvIdDesc(ctx, conversationID, afterSeqNo, limit)
	}
	if err != nil {
		s.logger.Error("Failed to get messages by conversation ID",
			"conversation_id", conversationID,
			"after_seq", afterSeqNo,
			"limit", limit,
			"error", err)
		return nil, err
	}

	messIds := make([]uuid.UUID, len(messages))
	for i, mess := range messages {
		messIds[i] = mess.ID
	}

	attachmentIdsByMessId, err := s.attachmentRepo.FindByMessageIDs(ctx, messIds)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		s.logger.Error("Failed to get attachments for messages",
			"conversation_id", conversationID,
			"error", err)
		return nil, err
	}

	for _, mess := range messages {
		if attachmentIds, ok := attachmentIdsByMessId[mess.ID]; ok {
			mess.AttachmentIDs = attachmentIds
		} else {
			mess.AttachmentIDs = []uuid.UUID{}
		}
	}

	s.logger.Debug("Retrieved messages with attachments",
		"conversation_id", conversationID,
		"count", len(messages),
		"after_seq", afterSeqNo)

	return messages, nil
}
