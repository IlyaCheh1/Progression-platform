package repo

import (
	"context"
	"database/sql"
	"errors"
	"math/big"

	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
	"github.com/masterofsword/support-chat/internal/domain/conversation/ports"
	postgres "github.com/masterofsword/support-chat/internal/infra/db"
	"github.com/masterofsword/support-chat/internal/store"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var _ ports.ConversationRepository = (*sqlcConversationRepo)(nil)

type sqlcConversationRepo struct {
	write *pgxpool.Pool
	read  *pgxpool.Pool
}

func NewSQLCConversationRepo(write *pgxpool.Pool) ports.ConversationRepository {
	return &sqlcConversationRepo{
		write: write,
		read:  write,
	}
}

func (r *sqlcConversationRepo) UpdateConversationStatus(ctx context.Context, conversationID uuid.UUID, status model.ConversationStatus) (*model.Conversation, error) {
	q := r.getQuerier(ctx)

	entity, err := q.UpdateConversationStatus(ctx, &store.UpdateConversationStatusParams{
		ID:     conversationID,
		Status: string(status),
	})

	if err != nil {
		return nil, err
	}

	return r.toModel(entity)
}

func (r *sqlcConversationRepo) RateConversation(ctx context.Context, conversationID uuid.UUID, isLike bool) (*model.Conversation, error) {
	q := r.getQuerier(ctx)

	var isLikePtr *bool
	isLikePtr = &isLike

	entity, err := q.UpdateConversationRating(ctx, &store.UpdateConversationRatingParams{
		ID:     conversationID,
		IsLike: isLikePtr,
	})

	if err != nil {
		return nil, err
	}

	return r.toModel(entity)
}

func (r *sqlcConversationRepo) AddParticipant(ctx context.Context, conversationId uuid.UUID, userId uuid.UUID) error {
	q := r.getQuerier(ctx)

	err := q.AddParticipant(ctx, &store.AddParticipantParams{
		ConversationID: conversationId,
		UserID:         userId,
		Role:           "member",
	})

	return err
}

func (r *sqlcConversationRepo) UpdateTelegramInfo(ctx context.Context, conversationId uuid.UUID, chatId int64, topicId int32) (*model.Conversation, error) {
	params := &store.UpdateTelegramInfoParams{
		ID:               conversationId,
		TgSupportChatID:  &chatId,
		TgSupportTopicID: &topicId,
	}

	queries := r.getQuerier(ctx)
	conv, err := queries.UpdateTelegramInfo(ctx, params)
	if err != nil {
		return nil, err
	}

	return r.toModel(conv)
}

func (r *sqlcConversationRepo) IsParticipant(ctx context.Context, conversationId uuid.UUID, userId uuid.UUID) (bool, error) {
	q := r.getQuerier(ctx)

	return q.IsParticipant(ctx, &store.IsParticipantParams{
		ConversationID: conversationId,
		UserID:         userId,
	})
}

func (r *sqlcConversationRepo) CreateConversation(ctx context.Context, conversation *model.Conversation) (*model.Conversation, error) {
	q := r.getQuerier(ctx)

	if status := conversation.Status; status == "" {
		conversation.Status = model.OpenConversationStatus
	}

	var timezone pgtype.Numeric
	if conversation.Timezone != nil {
		timezone = pgtype.Numeric{
			Int:   big.NewInt(int64(*conversation.Timezone)),
			Valid: true,
		}
	}

	entity, err := q.CreateConversation(ctx, &store.CreateConversationParams{
		Type:             string(conversation.Type),
		Status:           string(conversation.Status),
		Topic:            conversation.Topic,
		TgSupportChatID:  conversation.TgSupportChatID,
		TgSupportTopicID: conversation.TgSupportTopicID,
		Source:           string(conversation.Source),
		PageUrl:          conversation.PageUrl,
		Locale:           conversation.Locale,
		Timezone:         timezone,
		AppVersion:       conversation.AppVersion,
		CreatedBy:        conversation.CreatedBy,
	})
	if err != nil {
		return nil, err
	}

	return r.toModel(entity)
}

func (r *sqlcConversationRepo) FindConversationByThreadId(ctx context.Context, thSupportChatId int64, thSupportTopicId int32) (*model.Conversation, error) {
	q := r.getQuerier(ctx)

	entity, err := q.FindConversationByThread(ctx, &store.FindConversationByThreadParams{
		TgSupportChatID:  &thSupportChatId,
		TgSupportTopicID: &thSupportTopicId,
	})
	if err != nil {
		return nil, err
	}

	return r.toModel(entity)
}

func (r *sqlcConversationRepo) FindConversationsByUser(ctx context.Context, userID uuid.UUID, limit int32) ([]*model.Conversation, error) {
	q := r.getQuerier(ctx)

	entities, err := q.FindConversationsByUser(ctx, &store.FindConversationsByUserParams{
		UserID: userID,
		Limit:  limit,
	})

	if err != nil {
		return nil, err
	}

	return r.toModels(entities)
}

func (r *sqlcConversationRepo) FindOpenConversationByUser(ctx context.Context, userId uuid.UUID, typeC model.ConversationType) (*model.Conversation, error) {
	q := r.getQuerier(ctx)

	entity, err := q.FindOpenConversationByUserId(ctx, &store.FindOpenConversationByUserIdParams{
		UserID: userId,
		Type:   string(typeC),
	})

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return r.toModel(entity)
}

func (r *sqlcConversationRepo) FindConversationById(ctx context.Context, conversationId uuid.UUID) (*model.Conversation, error) {
	queries := r.getQuerier(ctx)
	conv, err := queries.FindConversationById(ctx, conversationId)
	if err != nil {
		return nil, err
	}

	return r.toModel(conv)
}

func (r *sqlcConversationRepo) getQuerier(ctx context.Context) *store.Queries {
	tx, ok := postgres.TxFromCtx(ctx)
	if ok {
		return store.New(tx)
	}
	return store.New(r.read)
}

func (r *sqlcConversationRepo) toModel(entity *store.Conversation) (*model.Conversation, error) {
	var timezone *int
	if entity.Timezone.Valid {
		val, err := entity.Timezone.Int64Value()
		if err != nil {
			return nil, err
		}
		intVal := int(val.Int64)
		timezone = &intVal
	}

	return &model.Conversation{
		Id:               entity.ID,
		Type:             model.ConversationType(entity.Type),
		Status:           model.ConversationStatus(entity.Status),
		Topic:            entity.Topic,
		TgSupportChatID:  entity.TgSupportChatID,
		TgSupportTopicID: entity.TgSupportTopicID,
		Source:           model.ConversationSource(entity.Source),
		PageUrl:          entity.PageUrl,
		Locale:           entity.Locale,
		Timezone:         timezone,
		AppVersion:       entity.AppVersion,
		IsLike:           entity.IsLike,
		CreatedBy:        entity.CreatedBy,
		CreatedAt:        entity.CreatedAt,
	}, nil
}

func (r *sqlcConversationRepo) toModels(entities []*store.Conversation) ([]*model.Conversation, error) {
	models := make([]*model.Conversation, 0, len(entities))
	for _, entity := range entities {
		m, err := r.toModel(entity)
		if err != nil {
			return nil, err
		}
		models = append(models, m)
	}
	return models, nil
}
