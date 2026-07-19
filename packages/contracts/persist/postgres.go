package persist

import (
	"context"
	"time"

	"github.com/masterofsword/contracts/engines"
)

// PingPostgres checks DATABASE_URL connectivity.
func PingPostgres(dsn string) error {
	store, err := NewPlatformStore(dsn)
	if err != nil {
		return err
	}
	defer store.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	return store.Ping(ctx)
}

// LoadPlatformFromPostgres restores from row-level tables (auto-migrates legacy blob once).
func LoadPlatformFromPostgres(p *engines.Platform, dsn string) error {
	return loadPlatformFromPostgres(p, dsn)
}

// SavePlatformToPostgres persists row-level state and syncs outbox.
func SavePlatformToPostgres(p *engines.Platform, dsn string) error {
	return savePlatformToPostgres(p, dsn)
}
