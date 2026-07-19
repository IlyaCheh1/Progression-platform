package service

import (
	"context"
	"database/sql"
	"errors"

	"github.com/masterofsword/support-chat/internal/domain/user/model"
)

func (s *UserDomainServiceImpl) CreateOrGetUser(ctx context.Context, user *model.User) (*model.User, error) {
	var createdUser *model.User

	err := s.txManager.WithTransaction(ctx, func(ctx context.Context) error {
		u, err := s.repo.FindUserById(ctx, user.Id)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return err
		}

		if u != nil {
			createdUser = u
			s.logger.Info("User already exists with id: ", "id", u.Id)
			return nil
		}

		createdUser, err = s.repo.CreateUser(ctx, user)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	s.logger.Info("User created with id: ", "id", createdUser.Id)
	return createdUser, nil
}
