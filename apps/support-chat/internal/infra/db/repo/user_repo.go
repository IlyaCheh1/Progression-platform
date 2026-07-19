package repo

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/user/model"
	"github.com/masterofsword/support-chat/internal/domain/user/ports"
	postgres "github.com/masterofsword/support-chat/internal/infra/db"
	"github.com/masterofsword/support-chat/internal/store"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var _ ports.UserRepository = (*sqlcUserRepo)(nil)

type sqlcUserRepo struct {
	write *pgxpool.Pool
	read  *pgxpool.Pool
}

func NewSQLCUserRepo(write *pgxpool.Pool) ports.UserRepository {
	return &sqlcUserRepo{
		write: write,
		read:  write,
	}
}

func (r *sqlcUserRepo) CreateUser(ctx context.Context, user *model.User) (*model.User, error) {
	q := r.getQuerier(ctx)

	createdUser, err := q.CreateUser(ctx, &store.CreateUserParams{
		ID:       user.Id,
		Username: user.Username,
	})
	if err != nil {
		return nil, err
	}

	return toModel(createdUser)
}

func (r *sqlcUserRepo) FindUserById(ctx context.Context, id uuid.UUID) (*model.User, error) {
	q := r.getQuerier(ctx)

	user, err := q.FindUserByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return toModel(user)
}

func (r *sqlcUserRepo) getQuerier(ctx context.Context) *store.Queries {
	tx, ok := postgres.TxFromCtx(ctx)
	if ok {
		return store.New(tx)
	}
	return store.New(r.read)
}

func toModel(user *store.AppUser) (*model.User, error) {
	return &model.User{
		Id:        user.ID,
		Username:  user.Username,
		CreatedAt: user.CreatedAt,
	}, nil
}
