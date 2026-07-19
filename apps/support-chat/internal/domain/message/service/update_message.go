package service

import (
	"context"

	"github.com/google/uuid"
)

func (s *MessageDomainServiceImpl) UpdateMessageTelegramID(ctx context.Context, messageID uuid.UUID, tgMessageID *int64) error {
	err := s.txManager.WithTransaction(ctx, func(ctx context.Context) error {
		return s.repo.UpdateMessageTelegramID(ctx, messageID, tgMessageID)
	})

	if err != nil {
		s.logger.Error("Failed to update message telegram ID",
			"message_id", messageID,
			"tg_message_id", tgMessageID,
			"error", err)
		return err
	}

	s.logger.Info("Updated message telegram ID",
		"message_id", messageID,
		"tg_message_id", tgMessageID)

	return nil
}
