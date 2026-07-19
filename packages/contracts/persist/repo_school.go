package persist

import (
	"context"
	"database/sql"

	"github.com/masterofsword/contracts/engines"
	"github.com/masterofsword/contracts/school"
	"github.com/masterofsword/contracts/training"
)

func (s *PlatformStore) loadSchoolSnapshot(ctx context.Context, snap *engines.SchoolSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT payload FROM school_training.records ORDER BY training_record_id, revision`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var payload []byte
		if err := rows.Scan(&payload); err != nil {
			return err
		}
		var r training.Record
		if err := unmarshal(payload, &r); err != nil {
			return err
		}
		snap.Records = append(snap.Records, r)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	if err := s.loadLeads(ctx, snap); err != nil {
		return err
	}
	if err := s.loadPayloadRows(ctx, `SELECT payload FROM school_crm.tasks`, func(payload []byte) error {
		var t school.Task
		if err := unmarshal(payload, &t); err != nil {
			return err
		}
		snap.Tasks = append(snap.Tasks, t)
		return nil
	}); err != nil {
		return err
	}
	if err := s.loadSessions(ctx, snap); err != nil {
		return err
	}
	if err := s.loadPayloadRows(ctx, `SELECT payload FROM school_schedule.reservations`, func(payload []byte) error {
		var r school.Reservation
		if err := unmarshal(payload, &r); err != nil {
			return err
		}
		snap.Reservations = append(snap.Reservations, r)
		return nil
	}); err != nil {
		return err
	}
	if err := s.loadPayloadRows(ctx, `SELECT payload FROM school_booking.bookings`, func(payload []byte) error {
		var b school.Booking
		if err := unmarshal(payload, &b); err != nil {
			return err
		}
		snap.Bookings = append(snap.Bookings, b)
		return nil
	}); err != nil {
		return err
	}
	if err := s.loadPayloadRows(ctx, `SELECT payload FROM school_commerce.orders`, func(payload []byte) error {
		var o school.Order
		if err := unmarshal(payload, &o); err != nil {
			return err
		}
		snap.Orders = append(snap.Orders, o)
		return nil
	}); err != nil {
		return err
	}
	if err := s.loadPayloadRows(ctx, `SELECT payload FROM school_commerce.payments`, func(payload []byte) error {
		var p school.Payment
		if err := unmarshal(payload, &p); err != nil {
			return err
		}
		snap.Payments = append(snap.Payments, p)
		return nil
	}); err != nil {
		return err
	}
	if err := s.loadPayloadRows(ctx, `SELECT payload FROM school_commerce.memberships`, func(payload []byte) error {
		var m school.Membership
		if err := unmarshal(payload, &m); err != nil {
			return err
		}
		snap.Memberships = append(snap.Memberships, m)
		return nil
	}); err != nil {
		return err
	}
	if err := s.loadWaitlist(ctx, snap); err != nil {
		return err
	}
	if err := s.loadRankReviews(ctx, snap); err != nil {
		return err
	}
	if err := s.loadGameState(ctx, snap); err != nil {
		return err
	}
	return nil
}

func (s *PlatformStore) loadLeads(ctx context.Context, snap *engines.SchoolSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT payload FROM school_crm.leads`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var payload []byte
		if err := rows.Scan(&payload); err != nil {
			return err
		}
		var l school.Lead
		if err := unmarshal(payload, &l); err != nil {
			return err
		}
		snap.Leads = append(snap.Leads, l)
	}
	return rows.Err()
}

func (s *PlatformStore) loadSessions(ctx context.Context, snap *engines.SchoolSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT payload FROM school_schedule.sessions WHERE NOT cancelled`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var payload []byte
		if err := rows.Scan(&payload); err != nil {
			return err
		}
		var sess school.Session
		if err := unmarshal(payload, &sess); err != nil {
			return err
		}
		snap.Sessions = append(snap.Sessions, sess)
	}
	return rows.Err()
}

func (s *PlatformStore) loadWaitlist(ctx context.Context, snap *engines.SchoolSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT id, session_id, student_id, position, status, payload FROM school_booking.waitlist`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var w school.WaitlistEntry
		var payload []byte
		if err := rows.Scan(&w.ID, &w.SessionID, &w.StudentID, &w.Position, &w.Status, &payload); err != nil {
			return err
		}
		if len(payload) > 0 && string(payload) != "{}" {
			_ = unmarshal(payload, &w)
		}
		snap.Waitlist = append(snap.Waitlist, w)
	}
	return rows.Err()
}

func (s *PlatformStore) loadRankReviews(ctx context.Context, snap *engines.SchoolSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT id, student_id, weapon_key, requested_rank, status, payload FROM school_mastery.rank_reviews`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var r school.MasterRankReview
		var payload []byte
		if err := rows.Scan(&r.ID, &r.StudentID, &r.WeaponKey, &r.RequestedRank, &r.Status, &payload); err != nil {
			return err
		}
		if len(payload) > 0 && string(payload) != "{}" {
			_ = unmarshal(payload, &r)
		}
		snap.RankReviews = append(snap.RankReviews, r)
	}
	return rows.Err()
}

func (s *PlatformStore) loadGameState(ctx context.Context, snap *engines.SchoolSnapshot) error {
	rows, err := s.db.QueryContext(ctx, `SELECT student_id, quest_key, payload FROM school_game.quest_progress`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var sid, qkey string
		var payload []byte
		if err := rows.Scan(&sid, &qkey, &payload); err != nil {
			return err
		}
		var q engines.QuestProgress
		if err := unmarshal(payload, &q); err != nil {
			return err
		}
		snap.QuestProgress[sid] = append(snap.QuestProgress[sid], q)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	rows, err = s.db.QueryContext(ctx, `SELECT student_id, achievement_key, payload FROM school_game.achievements`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var sid, akey string
		var payload []byte
		if err := rows.Scan(&sid, &akey, &payload); err != nil {
			return err
		}
		var a engines.AchievementState
		if err := unmarshal(payload, &a); err != nil {
			return err
		}
		snap.Achievements[sid] = append(snap.Achievements[sid], a)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	rows, err = s.db.QueryContext(ctx, `SELECT switch_key, enabled FROM school_game.kill_switches`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var key string
		var enabled bool
		if err := rows.Scan(&key, &enabled); err != nil {
			return err
		}
		snap.KillSwitches[key] = enabled
	}
	if err := rows.Err(); err != nil {
		return err
	}

	rows, err = s.db.QueryContext(ctx, `SELECT student_id, count FROM school_game.attendance_counts`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var sid string
		var n int
		if err := rows.Scan(&sid, &n); err != nil {
			return err
		}
		snap.AttendanceCount[sid] = n
	}
	if err := rows.Err(); err != nil {
		return err
	}

	rows, err = s.db.QueryContext(ctx, `SELECT student_id, weapon_key, floor_units FROM school_game.rank_floors`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var sid, weapon string
		var units int64
		if err := rows.Scan(&sid, &weapon, &units); err != nil {
			return err
		}
		if snap.RankFloors[sid] == nil {
			snap.RankFloors[sid] = map[string]int64{}
		}
		snap.RankFloors[sid][weapon] = units
	}
	if err := rows.Err(); err != nil {
		return err
	}

	rows, err = s.db.QueryContext(ctx, `SELECT decay_key FROM school_game.decay_applied`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var key string
		if err := rows.Scan(&key); err != nil {
			return err
		}
		snap.DecayApplied = append(snap.DecayApplied, key)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	rows, err = s.db.QueryContext(ctx, `SELECT line FROM school_game.comms_log ORDER BY seq`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var line string
		if err := rows.Scan(&line); err != nil {
			return err
		}
		snap.CommsLog = append(snap.CommsLog, line)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	if err := s.loadPayloadRows(ctx, `SELECT payload FROM school_game.import_batches`, func(payload []byte) error {
		var b engines.ImportBatch
		if err := unmarshal(payload, &b); err != nil {
			return err
		}
		snap.ImportBatches = append(snap.ImportBatches, b)
		return nil
	}); err != nil {
		return err
	}

	var seasonPayload []byte
	err = s.db.QueryRowContext(ctx, `SELECT payload FROM school_game.active_season WHERE id = 'active'`).Scan(&seasonPayload)
	if err == nil {
		var season engines.SeasonState
		if unmarshal(seasonPayload, &season) == nil {
			snap.ActiveSeason = &season
		}
	} else if err != sql.ErrNoRows {
		return err
	}

	rows, err = s.db.QueryContext(ctx, `SELECT student_id, payload FROM school_game.battle_pass`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var sid string
		var payload []byte
		if err := rows.Scan(&sid, &payload); err != nil {
			return err
		}
		var bp engines.BattlePassState
		if err := unmarshal(payload, &bp); err != nil {
			return err
		}
		snap.BattlePass[sid] = bp
	}
	if err := rows.Err(); err != nil {
		return err
	}

	rows, err = s.db.QueryContext(ctx, `SELECT student_id, talent_key FROM school_game.talent_unlocks`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var sid, talent string
		if err := rows.Scan(&sid, &talent); err != nil {
			return err
		}
		if snap.TalentUnlocks[sid] == nil {
			snap.TalentUnlocks[sid] = map[string]bool{}
		}
		snap.TalentUnlocks[sid][talent] = true
	}
	if err := rows.Err(); err != nil {
		return err
	}

	rows, err = s.db.QueryContext(ctx, `SELECT student_id FROM school_identity.minors`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var sid string
		if err := rows.Scan(&sid); err != nil {
			return err
		}
		snap.IsMinor[sid] = true
	}
	return rows.Err()
}

func (s *PlatformStore) loadPayloadRows(ctx context.Context, query string, fn func([]byte) error) error {
	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var payload []byte
		if err := rows.Scan(&payload); err != nil {
			return err
		}
		if err := fn(payload); err != nil {
			return err
		}
	}
	return rows.Err()
}

func saveSchoolSnapshot(ctx context.Context, tx *sql.Tx, snap engines.SchoolSnapshot) error {
	tables := []string{
		"school_training.records",
		"school_crm.leads",
		"school_crm.tasks",
		"school_schedule.sessions",
		"school_schedule.reservations",
		"school_booking.bookings",
		"school_booking.waitlist",
		"school_commerce.orders",
		"school_commerce.payments",
		"school_commerce.memberships",
		"school_mastery.rank_reviews",
		"school_game.quest_progress",
		"school_game.achievements",
		"school_game.kill_switches",
		"school_game.attendance_counts",
		"school_game.rank_floors",
		"school_game.decay_applied",
		"school_game.comms_log",
		"school_game.import_batches",
		"school_game.active_season",
		"school_game.battle_pass",
		"school_game.talent_unlocks",
		"school_identity.minors",
	}
	for _, t := range tables {
		if err := execDeleteAll(ctx, tx, t); err != nil {
			return err
		}
	}

	for _, r := range snap.Records {
		payload, err := marshal(r)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO school_training.records
			(training_record_id, revision, student_id, character_id, session_id, coach_id, occurred_at, status, payload)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		`, r.TrainingRecordID, r.Revision, r.StudentID, r.CharacterID, r.SessionID, r.CoachID, r.OccurredAt, r.Status, payload)
		if err != nil {
			return err
		}
	}
	for _, l := range snap.Leads {
		payload, err := marshal(l)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO school_crm.leads (id, payload, stage, created_at) VALUES ($1,$2,$3,$4)
		`, l.ID, payload, l.Stage, l.CreatedAt)
		if err != nil {
			return err
		}
	}
	for _, t := range snap.Tasks {
		payload, err := marshal(t)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO school_crm.tasks (id, payload, updated_at) VALUES ($1,$2,now())
		`, t.ID, payload)
		if err != nil {
			return err
		}
	}
	for _, sess := range snap.Sessions {
		payload, err := marshal(sess)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO school_schedule.sessions (id, hall_id, starts_at, ends_at, payload, cancelled)
			VALUES ($1,$2,$3,$4,$5,$6)
		`, sess.ID, sess.HallID, sess.StartsAt, sess.EndsAt, payload, sess.Cancelled)
		if err != nil {
			return err
		}
	}
	for _, r := range snap.Reservations {
		payload, err := marshal(r)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO school_schedule.reservations (id, payload, updated_at) VALUES ($1,$2,now())
		`, r.ID, payload)
		if err != nil {
			return err
		}
	}
	for _, b := range snap.Bookings {
		payload, err := marshal(b)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO school_booking.bookings (id, payload, status, created_at) VALUES ($1,$2,$3,$4)
		`, b.ID, payload, b.Status, b.CreatedAt)
		if err != nil {
			return err
		}
	}
	for _, w := range snap.Waitlist {
		payload, err := marshal(w)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO school_booking.waitlist (id, session_id, student_id, position, status, payload, created_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7)
		`, w.ID, w.SessionID, w.StudentID, w.Position, w.Status, payload, w.CreatedAt)
		if err != nil {
			return err
		}
	}
	for _, o := range snap.Orders {
		payload, err := marshal(o)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO school_commerce.orders (id, student_id, status, payload, created_at) VALUES ($1,$2,$3,$4,$5)
		`, o.ID, o.StudentID, o.Status, payload, o.CreatedAt)
		if err != nil {
			return err
		}
	}
	for _, pay := range snap.Payments {
		payload, err := marshal(pay)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO school_commerce.payments (id, order_id, attempt_id, provider_payment_id, status, payload, created_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7)
		`, pay.ID, pay.OrderID, pay.AttemptID, pay.ProviderPaymentID, pay.Status, payload, pay.CreatedAt)
		if err != nil {
			return err
		}
	}
	for _, m := range snap.Memberships {
		payload, err := marshal(m)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO school_commerce.memberships (id, student_id, status, payload, updated_at)
			VALUES ($1,$2,$3,$4,now())
		`, m.ID, m.StudentID, m.Status, payload)
		if err != nil {
			return err
		}
	}
	for _, r := range snap.RankReviews {
		payload, err := marshal(r)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO school_mastery.rank_reviews (id, student_id, weapon_key, requested_rank, status, payload, created_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7)
		`, r.ID, r.StudentID, r.WeaponKey, r.RequestedRank, r.Status, payload, r.CreatedAt)
		if err != nil {
			return err
		}
	}
	for sid, list := range snap.QuestProgress {
		for _, q := range list {
			payload, err := marshal(q)
			if err != nil {
				return err
			}
			_, err = tx.ExecContext(ctx, `
				INSERT INTO school_game.quest_progress (student_id, quest_key, payload) VALUES ($1,$2,$3)
			`, sid, q.QuestKey, payload)
			if err != nil {
				return err
			}
		}
	}
	for sid, list := range snap.Achievements {
		for _, a := range list {
			payload, err := marshal(a)
			if err != nil {
				return err
			}
			_, err = tx.ExecContext(ctx, `
				INSERT INTO school_game.achievements (student_id, achievement_key, payload) VALUES ($1,$2,$3)
			`, sid, a.Key, payload)
			if err != nil {
				return err
			}
		}
	}
	for key, enabled := range snap.KillSwitches {
		_, err := tx.ExecContext(ctx, `
			INSERT INTO school_game.kill_switches (switch_key, enabled) VALUES ($1,$2)
		`, key, enabled)
		if err != nil {
			return err
		}
	}
	for sid, n := range snap.AttendanceCount {
		_, err := tx.ExecContext(ctx, `
			INSERT INTO school_game.attendance_counts (student_id, count) VALUES ($1,$2)
		`, sid, n)
		if err != nil {
			return err
		}
	}
	for sid, weapons := range snap.RankFloors {
		for weapon, units := range weapons {
			_, err := tx.ExecContext(ctx, `
				INSERT INTO school_game.rank_floors (student_id, weapon_key, floor_units) VALUES ($1,$2,$3)
			`, sid, weapon, units)
			if err != nil {
				return err
			}
		}
	}
	for _, key := range snap.DecayApplied {
		_, err := tx.ExecContext(ctx, `INSERT INTO school_game.decay_applied (decay_key) VALUES ($1)`, key)
		if err != nil {
			return err
		}
	}
	for _, line := range snap.CommsLog {
		_, err := tx.ExecContext(ctx, `INSERT INTO school_game.comms_log (line) VALUES ($1)`, line)
		if err != nil {
			return err
		}
	}
	for _, b := range snap.ImportBatches {
		payload, err := marshal(b)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `INSERT INTO school_game.import_batches (id, payload) VALUES ($1,$2)`, b.ID, payload)
		if err != nil {
			return err
		}
	}
	if snap.ActiveSeason != nil {
		payload, err := marshal(snap.ActiveSeason)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `INSERT INTO school_game.active_season (id, payload) VALUES ('active',$1)`, payload)
		if err != nil {
			return err
		}
	}
	for sid, bp := range snap.BattlePass {
		payload, err := marshal(bp)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, `INSERT INTO school_game.battle_pass (student_id, payload) VALUES ($1,$2)`, sid, payload)
		if err != nil {
			return err
		}
	}
	for sid, talents := range snap.TalentUnlocks {
		for talent, unlocked := range talents {
			if !unlocked {
				continue
			}
			_, err := tx.ExecContext(ctx, `
				INSERT INTO school_game.talent_unlocks (student_id, talent_key) VALUES ($1,$2)
			`, sid, talent)
			if err != nil {
				return err
			}
		}
	}
	for sid, minor := range snap.IsMinor {
		if !minor {
			continue
		}
		_, err := tx.ExecContext(ctx, `INSERT INTO school_identity.minors (student_id) VALUES ($1)`, sid)
		if err != nil {
			return err
		}
	}
	return nil
}
