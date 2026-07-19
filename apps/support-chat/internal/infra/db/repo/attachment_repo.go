package repo

import (
	"context"

	"github.com/masterofsword/support-chat/internal/domain/attachment/model"
	"github.com/masterofsword/support-chat/internal/domain/attachment/ports"
	postgres "github.com/masterofsword/support-chat/internal/infra/db"
	"github.com/masterofsword/support-chat/internal/store"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var _ ports.AttachmentRepository = (*sqlcAttachmentRepo)(nil)

type sqlcAttachmentRepo struct {
	write *pgxpool.Pool
	read  *pgxpool.Pool
}

func NewSQLCAttachmentRepo(write *pgxpool.Pool) ports.AttachmentRepository {
	return &sqlcAttachmentRepo{
		write: write,
		read:  write,
	}
}

func (r *sqlcAttachmentRepo) CreateAttachment(ctx context.Context, conversationID uuid.UUID, storageKey, fileName, contentType string, sizeBytes int64) (*model.Attachment, error) {
	q := r.getQuerier(ctx)

	createdAttachment, err := q.CreateAttachment(ctx, &store.CreateAttachmentParams{
		ConversationID: conversationID,
		StorageKey:     storageKey,
		FileName:       fileName,
		ContentType:    contentType,
		SizeBytes:      &sizeBytes,
	})
	if err != nil {
		return nil, err
	}

	return r.toModel(createdAttachment)
}

func (r *sqlcAttachmentRepo) MarkComplete(ctx context.Context, attachmentID, conversationID uuid.UUID) (*model.Attachment, error) {
	q := r.getQuerier(ctx)

	attachment, err := q.MarkAttachmentComplete(ctx, &store.MarkAttachmentCompleteParams{
		ID:             attachmentID,
		ConversationID: conversationID,
	})
	if err != nil {
		return nil, err
	}

	return r.toModel(attachment)
}

func (r *sqlcAttachmentRepo) BindToMessage(ctx context.Context, conversationID, messageID uuid.UUID, attachmentIDs []uuid.UUID) error {
	q := r.getQuerier(ctx)

	for _, attachmentID := range attachmentIDs {
		rowsAffected, err := q.BindAttachmentToMessage(ctx, &store.BindAttachmentToMessageParams{
			ID:             attachmentID,
			ConversationID: conversationID,
			MessageID:      messageID,
		})
		if err != nil {
			return err
		}
		if rowsAffected == 0 {
			return model.ErrAttachmentNotAvailable
		}
	}
	return nil
}

func (r *sqlcAttachmentRepo) FindByID(ctx context.Context, attachmentID uuid.UUID) (*model.Attachment, error) {
	q := r.getQuerier(ctx)

	attachment, err := q.FindAttachmentById(ctx, attachmentID)
	if err != nil {
		return nil, err
	}

	return r.toModel(attachment)
}

func (r *sqlcAttachmentRepo) FindByIDs(ctx context.Context, conversationID uuid.UUID, attachmentIDs []uuid.UUID) ([]*model.Attachment, error) {
	if len(attachmentIDs) == 0 {
		return []*model.Attachment{}, nil
	}

	q := r.getQuerier(ctx)

	attachments, err := q.FindAttachmentsByConvId(ctx, &store.FindAttachmentsByConvIdParams{
		ConversationID: conversationID,
		AttachmentIds:  attachmentIDs,
	})
	if err != nil {
		return nil, err
	}

	return r.toModels(attachments)
}

func (r *sqlcAttachmentRepo) FindByMessageID(ctx context.Context, messageID uuid.UUID) ([]*model.Attachment, error) {
	q := r.getQuerier(ctx)

	attachments, err := q.FindByMessId(ctx, messageID)
	if err != nil {
		return nil, err
	}

	return r.toModels(attachments)
}

func (r *sqlcAttachmentRepo) FindByMessageIDs(ctx context.Context, messageIDs []uuid.UUID) (map[uuid.UUID][]uuid.UUID, error) {
	q := r.getQuerier(ctx)

	rows, err := q.FindByMessIds(ctx, messageIDs)
	if err != nil {
		return nil, err
	}

	result := make(map[uuid.UUID][]uuid.UUID)

	for _, row := range rows {
		result[row.MessageID] = append(result[row.MessageID], row.ID)
	}

	return result, err
}

func (r *sqlcAttachmentRepo) getQuerier(ctx context.Context) *store.Queries {
	tx, ok := postgres.TxFromCtx(ctx)
	if ok {
		return store.New(tx)
	}
	return store.New(r.read)
}

func (r *sqlcAttachmentRepo) toModel(entity *store.Attachment) (*model.Attachment, error) {
	return &model.Attachment{
		ID:             entity.ID,
		ConversationID: entity.ConversationID,
		MessageID:      entity.MessageID,
		StorageKey:     entity.StorageKey,
		FileName:       entity.FileName,
		ContentType:    entity.ContentType,
		SizeBytes:      entity.SizeBytes,
		Status:         model.AttachmentStatus(entity.Status),
		CreatedAt:      entity.CreatedAt,
	}, nil
}

func (r *sqlcAttachmentRepo) toModels(entities []*store.Attachment) ([]*model.Attachment, error) {
	models := make([]*model.Attachment, 0, len(entities))
	for _, entity := range entities {
		m, err := r.toModel(entity)
		if err != nil {
			return nil, err
		}
		models = append(models, m)
	}
	return models, nil
}
