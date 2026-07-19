package persist

import (
	"context"
	"database/sql"

	"github.com/masterofsword/contracts/engines"
)

func (s *PlatformStore) loadCharacters(ctx context.Context, snap *engines.PlatformSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, COALESCE(payload, '{}'::jsonb) FROM platform_character.characters
	`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		var payload []byte
		if err := rows.Scan(&id, &payload); err != nil {
			return err
		}
		var c engines.Character
		if err := unmarshal(payload, &c); err != nil {
			c = engines.Character{ID: id}
		}
		if c.ID == "" {
			c.ID = id
		}
		snap.Characters[id] = &c
	}
	return rows.Err()
}

func saveCharacters(ctx context.Context, tx *sql.Tx, snap engines.PlatformSnapshot) error {
	if err := execDeleteAll(ctx, tx, "platform_character.characters"); err != nil {
		return err
	}
	for id, c := range snap.Characters {
		if c == nil {
			continue
		}
		payload, err := marshal(c)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO platform_character.characters (id, user_id, tenant_id, version, payload)
			VALUES ($1, $2, $3, $4, $5)
		`, id, c.UserID, c.TenantID, c.Version, payload)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *PlatformStore) loadStudents(ctx context.Context, snap *engines.PlatformSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT id, login, payload FROM school_identity.students`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id, login string
		var payload []byte
		if err := rows.Scan(&id, &login, &payload); err != nil {
			return err
		}
		var st engines.Student
		if err := unmarshal(payload, &st); err != nil {
			return err
		}
		if st.ID == "" {
			st.ID = id
		}
		if st.Login == "" {
			st.Login = login
		}
		snap.Students[id] = &st
		snap.UserLogins[login] = id
	}
	return rows.Err()
}

func saveStudents(ctx context.Context, tx *sql.Tx, snap engines.PlatformSnapshot) error {
	if err := execDeleteAll(ctx, tx, "school_identity.students"); err != nil {
		return err
	}
	for id, st := range snap.Students {
		if st == nil {
			continue
		}
		payload, err := marshal(st)
		if err != nil {
			return err
		}
		login := st.Login
		if login == "" {
			for l, sid := range snap.UserLogins {
				if sid == id {
					login = l
					break
				}
			}
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO school_identity.students (id, login, payload, updated_at)
			VALUES ($1, $2, $3, now())
		`, id, login, payload)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *PlatformStore) loadAccessTokens(ctx context.Context, snap *engines.PlatformSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT token, student_id FROM school_identity.access_tokens`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var token, sid string
		if err := rows.Scan(&token, &sid); err != nil {
			return err
		}
		snap.AccessTokens[token] = sid
	}
	return rows.Err()
}

func saveAccessTokens(ctx context.Context, tx *sql.Tx, snap engines.PlatformSnapshot) error {
	if err := execDeleteAll(ctx, tx, "school_identity.access_tokens"); err != nil {
		return err
	}
	for token, sid := range snap.AccessTokens {
		_, err := tx.ExecContext(ctx, `
			INSERT INTO school_identity.access_tokens (token, student_id) VALUES ($1, $2)
		`, token, sid)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *PlatformStore) loadInboxSeen(ctx context.Context, snap *engines.PlatformSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT idempotency_key FROM school_identity.inbox_seen`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var key string
		if err := rows.Scan(&key); err != nil {
			return err
		}
		snap.InboxSeen = append(snap.InboxSeen, key)
	}
	return rows.Err()
}

func saveInboxSeen(ctx context.Context, tx *sql.Tx, snap engines.PlatformSnapshot) error {
	if err := execDeleteAll(ctx, tx, "school_identity.inbox_seen"); err != nil {
		return err
	}
	for _, key := range snap.InboxSeen {
		_, err := tx.ExecContext(ctx, `
			INSERT INTO school_identity.inbox_seen (idempotency_key) VALUES ($1)
		`, key)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *PlatformStore) loadGuardianLinks(ctx context.Context, snap *engines.PlatformSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT guardian_id, student_id FROM school_identity.guardian_links`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var gid, sid string
		if err := rows.Scan(&gid, &sid); err != nil {
			return err
		}
		snap.GuardianLinks[gid] = append(snap.GuardianLinks[gid], sid)
	}
	return rows.Err()
}

func saveGuardianLinks(ctx context.Context, tx *sql.Tx, snap engines.PlatformSnapshot) error {
	if err := execDeleteAll(ctx, tx, "school_identity.guardian_links"); err != nil {
		return err
	}
	for gid, deps := range snap.GuardianLinks {
		for _, sid := range deps {
			_, err := tx.ExecContext(ctx, `
				INSERT INTO school_identity.guardian_links (guardian_id, student_id) VALUES ($1, $2)
			`, gid, sid)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *PlatformStore) loadHoldings(ctx context.Context, snap *engines.PlatformSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT student_id, item_key, payload FROM platform_inventory.holdings`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var sid, key string
		var payload []byte
		if err := rows.Scan(&sid, &key, &payload); err != nil {
			return err
		}
		var h engines.InventoryHolding
		if err := unmarshal(payload, &h); err != nil {
			h = engines.InventoryHolding{Key: key}
		}
		if snap.Holdings[sid] == nil {
			snap.Holdings[sid] = map[string]engines.InventoryHolding{}
		}
		snap.Holdings[sid][key] = h
	}
	return rows.Err()
}

func saveHoldings(ctx context.Context, tx *sql.Tx, snap engines.PlatformSnapshot) error {
	if err := execDeleteAll(ctx, tx, "platform_inventory.holdings"); err != nil {
		return err
	}
	for sid, bag := range snap.Holdings {
		for key, h := range bag {
			payload, err := marshal(h)
			if err != nil {
				return err
			}
			_, err = tx.ExecContext(ctx, `
				INSERT INTO platform_inventory.holdings (student_id, item_key, payload)
				VALUES ($1, $2, $3)
			`, sid, key, payload)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *PlatformStore) loadSupportCases(ctx context.Context, snap *engines.PlatformSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT id, payload FROM platform_support.cases`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		var payload []byte
		if err := rows.Scan(&id, &payload); err != nil {
			return err
		}
		var c engines.SupportCase
		if err := unmarshal(payload, &c); err != nil {
			return err
		}
		snap.SupportCases[id] = &c
	}
	return rows.Err()
}

func saveSupportCases(ctx context.Context, tx *sql.Tx, snap engines.PlatformSnapshot) error {
	if err := execDeleteAll(ctx, tx, "platform_support.cases"); err != nil {
		return err
	}
	for id, c := range snap.SupportCases {
		if c == nil {
			continue
		}
		payload, err := marshal(c)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO platform_support.cases (id, payload, updated_at) VALUES ($1, $2, now())
		`, id, payload)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *PlatformStore) loadAssetRevisions(ctx context.Context, snap *engines.PlatformSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT id, payload FROM platform_assets.revisions`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		var payload []byte
		if err := rows.Scan(&id, &payload); err != nil {
			return err
		}
		var r engines.AssetRevision
		if err := unmarshal(payload, &r); err != nil {
			return err
		}
		snap.AssetRevisions[id] = &r
	}
	return rows.Err()
}

func saveAssetRevisions(ctx context.Context, tx *sql.Tx, snap engines.PlatformSnapshot) error {
	if err := execDeleteAll(ctx, tx, "platform_assets.revisions"); err != nil {
		return err
	}
	for id, r := range snap.AssetRevisions {
		if r == nil {
			continue
		}
		payload, err := marshal(r)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO platform_assets.revisions (id, payload, updated_at) VALUES ($1, $2, now())
		`, id, payload)
		if err != nil {
			return err
		}
	}
	return nil
}
