package service

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/user/model"
	"github.com/google/uuid"
)

func (s *UserDomainServiceImpl) GetUserById(ctx context.Context, userId uuid.UUID) (*model.User, error) {
	user, err := s.repo.FindUserById(ctx, userId)
	if err != nil {
		return nil, err
	}

	s.logger.Info("User fetched with id: ", "id", user.Id)
	return user, nil
}
