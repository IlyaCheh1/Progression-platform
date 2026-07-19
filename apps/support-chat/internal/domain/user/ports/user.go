package ports

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/user/model"
	"github.com/google/uuid"
)

type UserReader interface {
	FindUserById(ctx context.Context, id uuid.UUID) (*model.User, error)
}

type UserWriter interface {
	CreateUser(ctx context.Context, user *model.User) (*model.User, error)
}

type UserRepository interface {
	UserReader
	UserWriter
}
