package persist

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/masterofsword/contracts/engines"
	_ "github.com/jackc/pgx/v5/stdlib"
)

const storeKey = "platform.main"

// PlatformStore persists platform state in row-level Postgres tables.
type PlatformStore struct {
	db *sql.DB
}

func NewPlatformStore(dsn string) (*PlatformStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(2)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}
	return &PlatformStore{db: db}, nil
}

func (s *PlatformStore) Close() error {
	if s == nil || s.db == nil {
		return nil
	}
	return s.db.Close()
}

func (s *PlatformStore) Ping(ctx context.Context) error {
	return s.db.PingContext(ctx)
}

// HasRowLevelData reports whether row-level tables contain a saved platform.
func (s *PlatformStore) HasRowLevelData(ctx context.Context) (bool, error) {
	var n int
	err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM school_identity.students`).Scan(&n)
	if err != nil {
		return false, err
	}
	return n > 0, nil
}

// LoadPlatform restores from row-level tables (migrates legacy blob if needed).
func loadPlatformFromPostgres(p *engines.Platform, dsn string) error {
	store, err := NewPlatformStore(dsn)
	if err != nil {
		return err
	}
	defer store.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	hasRows, err := store.HasRowLevelData(ctx)
	if err != nil {
		return err
	}
	if hasRows {
		snap, err := store.loadSnapshot(ctx)
		if err != nil {
			return err
		}
		p.RestoreSnapshot(snap)
		return nil
	}
	snap, err := store.loadLegacyBlob(ctx)
	if err != nil {
		return fmt.Errorf("no row-level data and no legacy blob: %w", err)
	}
	p.RestoreSnapshot(snap)
	if err := store.saveSnapshot(ctx, snap); err != nil {
		return fmt.Errorf("migrated blob to rows: %w", err)
	}
	return nil
}

// SavePlatformToPostgres persists full platform state to row-level tables.
func savePlatformToPostgres(p *engines.Platform, dsn string) error {
	store, err := NewPlatformStore(dsn)
	if err != nil {
		return err
	}
	defer store.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	if err := store.savePlatform(ctx, p); err != nil {
		return err
	}
	return SyncOutboxToPostgresWithDB(store.db, ctx, p)
}

func (s *PlatformStore) savePlatform(ctx context.Context, p *engines.Platform) error {
	snap := p.ExportSnapshot()
	return s.saveSnapshot(ctx, snap)
}

func (s *PlatformStore) loadLegacyBlob(ctx context.Context) (engines.PlatformSnapshot, error) {
	var payload []byte
	err := s.db.QueryRowContext(ctx, `SELECT payload FROM platform_snapshot WHERE id = $1`, storeKey).Scan(&payload)
	if err != nil {
		return engines.PlatformSnapshot{}, err
	}
	var snap engines.PlatformSnapshot
	if err := json.Unmarshal(payload, &snap); err != nil {
		return engines.PlatformSnapshot{}, err
	}
	return snap, nil
}

func (s *PlatformStore) loadSnapshot(ctx context.Context) (engines.PlatformSnapshot, error) {
	snap := engines.PlatformSnapshot{
		Characters:     map[string]*engines.Character{},
		Students:       map[string]*engines.Student{},
		UserLogins:     map[string]string{},
		AccessTokens:   engines.AccessTokenMap{},
		Holdings:       map[string]map[string]engines.InventoryHolding{},
		GuardianLinks:  map[string][]string{},
		SupportCases:   map[string]*engines.SupportCase{},
		AssetRevisions: map[string]*engines.AssetRevision{},
		School: engines.SchoolSnapshot{
			QuestProgress:   map[string][]engines.QuestProgress{},
			Achievements:    map[string][]engines.AchievementState{},
			KillSwitches:    map[string]bool{},
			AttendanceCount: map[string]int{},
			RankFloors:      map[string]map[string]int64{},
			BattlePass:      map[string]engines.BattlePassState{},
			TalentUnlocks:   map[string]map[string]bool{},
			IsMinor:         map[string]bool{},
		},
	}
	if err := s.loadCharacters(ctx, &snap); err != nil {
		return snap, err
	}
	if err := s.loadStudents(ctx, &snap); err != nil {
		return snap, err
	}
	if err := s.loadAccessTokens(ctx, &snap); err != nil {
		return snap, err
	}
	if err := s.loadInboxSeen(ctx, &snap); err != nil {
		return snap, err
	}
	if err := s.loadGuardianLinks(ctx, &snap); err != nil {
		return snap, err
	}
	if err := s.loadHoldings(ctx, &snap); err != nil {
		return snap, err
	}
	if err := s.loadSupportCases(ctx, &snap); err != nil {
		return snap, err
	}
	if err := s.loadAssetRevisions(ctx, &snap); err != nil {
		return snap, err
	}
	if err := s.loadSchoolSnapshot(ctx, &snap.School); err != nil {
		return snap, err
	}
	return snap, nil
}

func (s *PlatformStore) saveSnapshot(ctx context.Context, snap engines.PlatformSnapshot) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if err := saveCharacters(ctx, tx, snap); err != nil {
		return err
	}
	if err := saveStudents(ctx, tx, snap); err != nil {
		return err
	}
	if err := saveAccessTokens(ctx, tx, snap); err != nil {
		return err
	}
	if err := saveInboxSeen(ctx, tx, snap); err != nil {
		return err
	}
	if err := saveGuardianLinks(ctx, tx, snap); err != nil {
		return err
	}
	if err := saveHoldings(ctx, tx, snap); err != nil {
		return err
	}
	if err := saveSupportCases(ctx, tx, snap); err != nil {
		return err
	}
	if err := saveAssetRevisions(ctx, tx, snap); err != nil {
		return err
	}
	if err := saveSchoolSnapshot(ctx, tx, snap.School); err != nil {
		return err
	}
	_, err = tx.ExecContext(ctx, `
		INSERT INTO platform_meta.store (id, version, updated_at)
		VALUES ($1, 1, now())
		ON CONFLICT (id) DO UPDATE SET version = platform_meta.store.version + 1, updated_at = now()
	`, storeKey)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func marshal(v any) ([]byte, error) {
	return json.Marshal(v)
}

func unmarshal(b []byte, v any) error {
	if len(b) == 0 {
		return errors.New("empty payload")
	}
	return json.Unmarshal(b, v)
}

func execDeleteAll(ctx context.Context, tx *sql.Tx, table string) error {
	_, err := tx.ExecContext(ctx, `DELETE FROM `+table)
	return err
}
