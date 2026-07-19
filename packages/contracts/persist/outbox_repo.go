package persist

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"github.com/masterofsword/contracts/engines"
	_ "github.com/jackc/pgx/v5/stdlib"
)

// SyncOutboxToPostgres upserts unpublished in-memory outbox rows into outbox.events.
func SyncOutboxToPostgres(p *engines.Platform, dsn string) error {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return err
	}
	defer db.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	return SyncOutboxToPostgresWithDB(db, ctx, p)
}

func SyncOutboxToPostgresWithDB(db *sql.DB, ctx context.Context, p *engines.Platform) error {
	entries := p.OutboxUnpublished()
	if len(entries) == 0 {
		return nil
	}
	for _, e := range entries {
		payload, err := json.Marshal(e.Event)
		if err != nil {
			return err
		}
		_, err = db.ExecContext(ctx, `
			INSERT INTO outbox.events (id, event_type, idempotency_key, tenant_id, payload, created_at, published_at)
			VALUES ($1, $2, $3, $4, $5, $6, NULL)
			ON CONFLICT (idempotency_key) DO NOTHING
		`, e.ID, e.Event.EventType, e.Event.IdempotencyKey, e.Event.TenantID, payload, e.CreatedAt)
		if err != nil {
			return err
		}
	}
	return nil
}

// DrainPostgresOutbox marks unpublished postgres rows as published (shared worker drain).
func DrainPostgresOutbox(dsn string, limit int) (int, error) {
	if limit <= 0 {
		limit = 100
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return 0, err
	}
	defer db.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	rows, err := db.QueryContext(ctx, `
		SELECT id, idempotency_key, event_type
		FROM outbox.events
		WHERE published_at IS NULL
		ORDER BY created_at
		LIMIT $1
	`, limit)
	if err != nil {
		return 0, err
	}
	defer rows.Close()
	type row struct {
		id, idem, eventType string
	}
	var batch []row
	for rows.Next() {
		var r row
		if err := rows.Scan(&r.id, &r.idem, &r.eventType); err != nil {
			return 0, err
		}
		batch = append(batch, r)
	}
	if err := rows.Err(); err != nil {
		return 0, err
	}
	for _, r := range batch {
		_, err := db.ExecContext(ctx, `
			INSERT INTO outbox.inbox (idempotency_key, event_type, processed_at)
			VALUES ($1, $2, now())
			ON CONFLICT (idempotency_key) DO NOTHING
		`, r.idem, r.eventType)
		if err != nil {
			return 0, err
		}
		_, err = db.ExecContext(ctx, `UPDATE outbox.events SET published_at = now() WHERE id = $1`, r.id)
		if err != nil {
			return 0, err
		}
	}
	return len(batch), nil
}
