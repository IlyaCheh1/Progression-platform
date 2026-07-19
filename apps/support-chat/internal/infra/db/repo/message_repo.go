package repo

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/message/model"
	"github.com/masterofsword/support-chat/internal/domain/message/ports"
	postgres "github.com/masterofsword/support-chat/internal/infra/db"
	"github.com/masterofsword/support-chat/internal/store"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var _ ports.MessageRepository = (*sqlcMessageRepo)(nil)

type sqlcMessageRepo struct {
	write *pgxpool.Pool
	read  *pgxpool.Pool
}

func NewSQLCMessageRepo(write *pgxpool.Pool) ports.MessageRepository {
	return &sqlcMessageRepo{
		write: write,
		read:  write,
	}
}

func (r *sqlcMessageRepo) UpdateMessageTelegramID(ctx context.Context, messageID uuid.UUID, tgMessageID *int64) error {
	q := r.getQuerier(ctx)

	return q.UpdateMessageTelegramId(ctx, &store.UpdateMessageTelegramIdParams{
		ID:          messageID,
		TgMessageID: tgMessageID,
	})
}

func (r *sqlcMessageRepo) CreateMessage(ctx context.Context, message *model.Message) (*model.Message, error) {
	q := r.getQuerier(ctx)

	createdMessage, err := q.CreateMessage(ctx, r.fromModel(message))
	if err != nil {
		return nil, err
	}

	return r.toModel(createdMessage)
}

func (r *sqlcMessageRepo) GetLastSeq(ctx context.Context, conversationID uuid.UUID) (int64, error) {
	q := r.getQuerier(ctx)

	lastSeq, err := q.GetLastSeq(ctx, conversationID)
	if err != nil {
		return 0, err
	}

	if lastSeq == nil {
		return 0, nil
	}

	if seq, ok := lastSeq.(int64); ok {
		return seq, nil
	}

	return 0, nil
}

func (r *sqlcMessageRepo) FindMessagesByConvId(ctx context.Context, conversationID uuid.UUID, afterSeqNo int64, limit int32) ([]*model.Message, error) {
	q := r.getQuerier(ctx)

	messages, err := q.FindMessageByConvId(ctx, &store.FindMessageByConvIdParams{
		ConversationID: conversationID,
		SeqNo:          afterSeqNo,
		Limit:          limit,
	})
	if err != nil {
		return nil, err
	}

	return r.toModels(messages)
}

func (r *sqlcMessageRepo) FindMessagesByConvIdDesc(ctx context.Context, conversationID uuid.UUID, afterSeqNo int64, limit int32) ([]*model.Message, error) {
	q := r.getQuerier(ctx)

	messages, err := q.FindMessageByConvIdDesc(ctx, &store.FindMessageByConvIdDescParams{
		ConversationID: conversationID,
		SeqNo:          afterSeqNo,
		Limit:          limit,
	})
	if err != nil {
		return nil, err
	}

	return r.toModels(messages)
}

func (r *sqlcMessageRepo) getQuerier(ctx context.Context) *store.Queries {
	tx, ok := postgres.TxFromCtx(ctx)
	if ok {
		return store.New(tx)
	}
	return store.New(r.read)
}

func (r *sqlcMessageRepo) toModel(entity *store.Message) (*model.Message, error) {
	return &model.Message{
		ID:               entity.ID,
		ConversationID:   entity.ConversationID,
		SeqNo:            entity.SeqNo,
		SenderKind:       model.SenderKind(entity.SenderKind),
		Source:           model.MessageSource(entity.Source),
		ContentType:      model.ContentType(entity.ContentType),
		ContentText:      entity.ContentText,
		ClientID:         entity.ClientID,
		ReplyToMessageID: entity.ReplyToMessageID,
		TgMessageID:      entity.TgMessageID,
		CreatedAt:        entity.CreatedAt,
	}, nil
}

func (r *sqlcMessageRepo) toModels(entities []*store.Message) ([]*model.Message, error) {
	models := make([]*model.Message, 0, len(entities))
	for _, entity := range entities {
		m, err := r.toModel(entity)
		if err != nil {
			return nil, err
		}
		models = append(models, m)
	}
	return models, nil
}

func (r *sqlcMessageRepo) fromModel(message *model.Message) *store.CreateMessageParams {
	return &store.CreateMessageParams{
		ConversationID:   message.ConversationID,
		SenderKind:       string(message.SenderKind),
		Source:           string(message.Source),
		ContentType:      string(message.ContentType),
		ContentText:      message.ContentText,
		ClientID:         message.ClientID,
		ReplyToMessageID: message.ReplyToMessageID,
		TgMessageID:      message.TgMessageID,
	}
}
