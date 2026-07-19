package engines

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/masterofsword/contracts/envelope"
	"github.com/masterofsword/contracts/integrations/yoomoney"
	"github.com/masterofsword/contracts/mastery"
	"github.com/masterofsword/contracts/school"
	"github.com/masterofsword/contracts/training"
)

const moscowTZ = "Europe/Moscow"

// SchoolModule owns school operational aggregates (CRM, schedule, booking, commerce, training).
type SchoolModule struct {
	mu sync.Mutex
	p  *Platform

	exercises  map[string]training.ExerciseSpec
	equipment  map[string]training.EquipmentSpec
	records    map[string]*training.Record
	recordHist map[string][]*training.Record

	decayApplied map[string]struct{}
	rankFloors   map[string]map[string]int64 // studentID -> weapon -> floor units

	leads    map[string]*school.Lead
	tasks    map[string]*school.Task
	halls    map[string]*school.Hall
	sessions map[string]*school.Session
	reserve  map[string]*school.Reservation
	bookings map[string]*school.Booking

	tariffs     map[string]*school.Tariff
	orders      map[string]*school.Order
	payments    map[string]*school.Payment
	memberships map[string]*school.Membership
	receipts    map[string]*school.FiscalReceipt
	webhookSeen map[string]struct{}

	yoo *yoomoney.Client

	questProgress map[string]map[string]*QuestProgress
	achievements  map[string]map[string]*AchievementState
	killSwitches  map[string]bool

	attendanceCount map[string]int
	isMinor         map[string]bool
	commsLog        []string
	importBatches   []ImportBatch
	activeSeason    *SeasonState
	battlePass      map[string]*BattlePassState
	talentUnlocks   map[string]map[string]bool
	waitlist        map[string]*school.WaitlistEntry
	rankReviews     map[string]*school.MasterRankReview
}

func NewSchoolModule(p *Platform) *SchoolModule {
	sm := &SchoolModule{
		p:             p,
		exercises:     make(map[string]training.ExerciseSpec),
		equipment:     make(map[string]training.EquipmentSpec),
		records:       make(map[string]*training.Record),
		recordHist:    make(map[string][]*training.Record),
		decayApplied:  make(map[string]struct{}),
		rankFloors:    make(map[string]map[string]int64),
		leads:         make(map[string]*school.Lead),
		tasks:         make(map[string]*school.Task),
		halls:         make(map[string]*school.Hall),
		sessions:      make(map[string]*school.Session),
		reserve:       make(map[string]*school.Reservation),
		bookings:      make(map[string]*school.Booking),
		tariffs:       make(map[string]*school.Tariff),
		orders:        make(map[string]*school.Order),
		payments:      make(map[string]*school.Payment),
		memberships:   make(map[string]*school.Membership),
		receipts:      make(map[string]*school.FiscalReceipt),
		webhookSeen:   make(map[string]struct{}),
		yoo:           yoomoney.NewClient("sandbox-shop", "sandbox-secret"),
		questProgress: make(map[string]map[string]*QuestProgress),
		achievements:  make(map[string]map[string]*AchievementState),
		killSwitches:  make(map[string]bool),
		attendanceCount: make(map[string]int),
		isMinor:         make(map[string]bool),
		battlePass:      make(map[string]*BattlePassState),
		talentUnlocks:   make(map[string]map[string]bool),
		waitlist:        make(map[string]*school.WaitlistEntry),
		rankReviews:     make(map[string]*school.MasterRankReview),
	}
	sm.seedDefaults()
	return sm
}

func (sm *SchoolModule) seedDefaults() {
	sm.halls["hall-main"] = &school.Hall{ID: "hall-main", Name: "Большой зал"}
	sm.tariffs["membership.month"] = &school.Tariff{
		Key: "membership.month", Title: "Абонемент месяц", AmountMinor: 1200000, Currency: "RUB", Kind: "membership",
	}
	sm.tariffs["trial.paid"] = &school.Tariff{
		Key: "trial.paid", Title: "Пробное занятие", AmountMinor: 150000, Currency: "RUB", Kind: "trial",
	}
	sm.exercises["salute.basic"] = training.ExerciseSpec{
		Code: "salute.basic", Name: "Базовый салют", AllowedWeapons: mastery.WeaponKeys, CurriculumVersionID: "v1",
	}
	sm.equipment["blade.800"] = training.EquipmentSpec{ID: "blade.800", Name: "Клинок 800г", MassGrams: 800}
}

// UpsertSession inserts or replaces a training session (tests / admin scheduling).
func (sm *SchoolModule) UpsertSession(s school.Session) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	cp := s
	sm.sessions[s.ID] = &cp
}

func (sm *SchoolModule) ListHalls() []school.Hall {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	out := make([]school.Hall, 0, len(sm.halls))
	for _, h := range sm.halls {
		out = append(out, *h)
	}
	return out
}

func (sm *SchoolModule) ListSessions(from, to time.Time) []school.Session {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	out := make([]school.Session, 0)
	for _, s := range sm.sessions {
		if s.Cancelled {
			continue
		}
		if !from.IsZero() && s.EndsAt.Before(from) {
			continue
		}
		if !to.IsZero() && s.StartsAt.After(to) {
			continue
		}
		out = append(out, *s)
	}
	return out
}

func (sm *SchoolModule) hasHallConflict(hallID string, starts, ends time.Time, excludeID string) bool {
	for _, r := range sm.reserve {
		if r.HallID != hallID || r.ID == excludeID {
			continue
		}
		if starts.Before(r.EndsAt) && ends.After(r.StartsAt) {
			return true
		}
	}
	for _, s := range sm.sessions {
		if s.HallID != hallID || s.ID == excludeID || s.Cancelled {
			continue
		}
		if starts.Before(s.EndsAt) && ends.After(s.StartsAt) {
			return true
		}
	}
	return false
}

func (sm *SchoolModule) CreateLead(name, phone, email, source, utm, direction string) (*school.Lead, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	now := time.Now().UTC()
	l := &school.Lead{
		ID: uuid.NewString(), Name: name, Phone: phone, Email: email,
		Source: source, UTM: utm, Direction: direction, Stage: school.FunnelInquiry,
		CreatedAt: now, UpdatedAt: now,
	}
	sm.leads[l.ID] = l
	return l, nil
}

func (sm *SchoolModule) ListLeads() []school.Lead {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	out := make([]school.Lead, 0, len(sm.leads))
	for _, l := range sm.leads {
		out = append(out, *l)
	}
	return out
}

func (sm *SchoolModule) UpdateLeadStage(id string, stage school.FunnelStage) (*school.Lead, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	l, ok := sm.leads[id]
	if !ok {
		return nil, fmt.Errorf("lead not found")
	}
	l.Stage = stage
	l.UpdatedAt = time.Now().UTC()
	return l, nil
}

func (sm *SchoolModule) CreateTask(leadID, title string, dueAt time.Time) (*school.Task, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	t := &school.Task{
		ID: uuid.NewString(), LeadID: leadID, Title: title, DueAt: dueAt, CreatedAt: time.Now().UTC(),
	}
	sm.tasks[t.ID] = t
	return t, nil
}

func (sm *SchoolModule) ListTasks() []school.Task {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	out := make([]school.Task, 0, len(sm.tasks))
	for _, t := range sm.tasks {
		out = append(out, *t)
	}
	return out
}

func (sm *SchoolModule) CreateTrialBooking(sessionID, leadID, studentID string) (*school.Booking, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sess, ok := sm.sessions[sessionID]
	if !ok || sess.Cancelled {
		return nil, fmt.Errorf("session not found")
	}
	if sess.Enrolled >= sess.Capacity {
		return nil, fmt.Errorf("session full")
	}
	b := &school.Booking{
		ID: uuid.NewString(), Type: "trial", SessionID: sessionID,
		LeadID: leadID, StudentID: studentID, Status: "confirmed", CreatedAt: time.Now().UTC(),
	}
	sm.bookings[b.ID] = b
	sess.Enrolled++
	if leadID != "" {
		if l, ok := sm.leads[leadID]; ok {
			l.Stage = school.FunnelTrialBooked
			l.UpdatedAt = time.Now().UTC()
		}
	}
	ev := envelope.NewEvent("school.trial.booking.created.v1", "school-booking", TenantDemo, RealmKey,
		"Booking", b.ID, "booking:trial:"+b.ID, 1, map[string]any{"sessionId": sessionID, "leadId": leadID})
	_, _ = sm.p.outbox.Append(ev)
	return b, nil
}

// CancelBooking frees a session seat for trial/enrollment bookings.
func (sm *SchoolModule) CancelBooking(bookingID string) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	b, ok := sm.bookings[bookingID]
	if !ok {
		return fmt.Errorf("booking not found")
	}
	if b.Status == "cancelled" {
		return fmt.Errorf("already cancelled")
	}
	if b.SessionID != "" {
		if sess, ok := sm.sessions[b.SessionID]; ok && sess.Enrolled > 0 {
			sess.Enrolled--
		}
	}
	b.Status = "cancelled"
	ev := envelope.NewEvent("school.booking.cancelled.v1", "school-booking", TenantDemo, RealmKey,
		"Booking", b.ID, "booking:cancel:"+b.ID, 1, map[string]any{"bookingId": b.ID})
	_, _ = sm.p.outbox.Append(ev)
	return nil
}

func (sm *SchoolModule) CreateTrainingRecord(rec training.Record) (*training.Record, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	if rec.TrainingRecordID == "" {
		rec.TrainingRecordID = uuid.NewString()
	}
	if rec.Revision == 0 {
		rec.Revision = 1
	}
	if rec.Status == "" {
		rec.Status = training.StatusDraft
	}
	if rec.OccurredAt.IsZero() {
		rec.OccurredAt = time.Now().UTC()
	}
	st, ok := sm.p.students[rec.StudentID]
	if !ok {
		return nil, fmt.Errorf("student not found")
	}
	rec.CharacterID = st.CharacterID
	if err := training.ValidateRecord(&rec); err != nil {
		return nil, err
	}
	cp := rec
	sm.records[rec.TrainingRecordID] = &cp
	return &cp, nil
}

func (sm *SchoolModule) ConfirmTrainingRecord(id, coachID string) (*training.Record, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	r, ok := sm.records[id]
	if !ok {
		return nil, fmt.Errorf("record not found")
	}
	if r.Status != training.StatusDraft {
		return nil, fmt.Errorf("record not draft")
	}
	r.Status = training.StatusConfirmed
	r.CoachID = coachID
	sm.applyMasteryLocked(r)
	ev := envelope.NewEvent("school.training.exercise.recorded.v1", "school-training", TenantDemo, RealmKey,
		"TrainingRecord", r.TrainingRecordID, fmt.Sprintf("training:%s:r%d", r.TrainingRecordID, r.Revision), int64(r.Revision),
		map[string]any{"studentId": r.StudentID, "units": training.TotalUnits(r.Entries)})
	_, _ = sm.p.outbox.Append(ev)
	return r, nil
}

func (sm *SchoolModule) CorrectTrainingRecord(id, reason string, entries []training.ExerciseEntry) (*training.Record, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	old, ok := sm.records[id]
	if !ok {
		return nil, fmt.Errorf("record not found")
	}
	if old.Status == training.StatusVoided {
		return nil, fmt.Errorf("record voided")
	}
	sm.recordHist[id] = append(sm.recordHist[id], cloneRecord(old))
	oldUnits := training.TotalUnits(old.Entries)
	rev := old.Revision + 1
	corrected := *old
	corrected.Revision = rev
	corrected.Status = training.StatusCorrected
	corrected.CorrectionReason = reason
	corrected.Entries = entries
	if err := training.ValidateRecord(&corrected); err != nil {
		return nil, err
	}
	newUnits := training.TotalUnits(corrected.Entries)
	delta := newUnits - oldUnits
	if delta != 0 {
		sm.applyUnitsDeltaLocked(old.StudentID, old.Entries, delta)
	}
	sm.records[id] = &corrected
	ev := envelope.NewEvent("school.training.attendance.corrected.v1", "school-training", TenantDemo, RealmKey,
		"TrainingRecord", id, fmt.Sprintf("training:correct:%s:r%d", id, rev), int64(rev),
		map[string]any{"studentId": old.StudentID, "deltaUnits": delta})
	_, _ = sm.p.outbox.Append(ev)
	return &corrected, nil
}

func (sm *SchoolModule) VoidTrainingRecord(id, reason string) (*training.Record, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	r, ok := sm.records[id]
	if !ok {
		return nil, fmt.Errorf("record not found")
	}
	if r.Status == training.StatusVoided {
		return r, nil
	}
	units := training.TotalUnits(r.Entries)
	if units > 0 && (r.Status == training.StatusConfirmed || r.Status == training.StatusCorrected) {
		sm.applyUnitsDeltaLocked(r.StudentID, r.Entries, -units)
	}
	r.Status = training.StatusVoided
	r.VoidReason = reason
	ev := envelope.NewEvent("school.training.record.voided.v1", "school-training", TenantDemo, RealmKey,
		"TrainingRecord", id, "training:void:"+id, int64(r.Revision), map[string]any{"studentId": r.StudentID})
	_, _ = sm.p.outbox.Append(ev)
	return r, nil
}

func (sm *SchoolModule) GetTrainingRecord(id string) (*training.Record, bool) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	r, ok := sm.records[id]
	return r, ok
}

func (sm *SchoolModule) ListTrainingRecords(studentID string) []training.Record {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	out := make([]training.Record, 0)
	for _, r := range sm.records {
		if studentID == "" || r.StudentID == studentID {
			out = append(out, *r)
		}
	}
	return out
}

func (sm *SchoolModule) applyMasteryLocked(r *training.Record) {
	total := training.TotalUnits(r.Entries)
	if total == 0 {
		return
	}
	weapon := r.Entries[0].WeaponConfigurationKey
	paired := strings.Contains(weapon, "due_spade") || strings.Contains(weapon, "spada_e_scudo")
	s, ok := sm.p.students[r.StudentID]
	if !ok {
		return
	}
	if paired {
		prim, sec := mastery.AllocatePair(total)
		s.Mastery[weapon] += prim
		s.Mastery["spada_a_uno_mano"] += sec
		s.Ranks[weapon] = mastery.RankFromUnits(s.Mastery[weapon])
		s.Ranks["spada_a_uno_mano"] = mastery.RankFromUnits(s.Mastery["spada_a_uno_mano"])
	} else {
		s.Mastery[weapon] += total
		s.Ranks[weapon] = mastery.RankFromUnits(s.Mastery[weapon])
	}
	sm.updateRankFloorLocked(r.StudentID)
	oldRank := sm.studentRank(r.StudentID, weapon)
	sm.publishMasteryApplied(r.StudentID, weapon, total)
	newRank := sm.studentRank(r.StudentID, weapon)
	if newRank > oldRank {
		sm.publishRankChanged(r.StudentID, weapon, newRank)
		sm.checkMasteryAchievementsLocked(r.StudentID)
	}
}

func (sm *SchoolModule) applyUnitsDeltaLocked(studentID string, entries []training.ExerciseEntry, delta int64) {
	if len(entries) == 0 || delta == 0 {
		return
	}
	weapon := entries[0].WeaponConfigurationKey
	s, ok := sm.p.students[studentID]
	if !ok {
		return
	}
	s.Mastery[weapon] += delta
	if s.Mastery[weapon] < 0 {
		s.Mastery[weapon] = 0
	}
	s.Ranks[weapon] = mastery.RankFromUnits(s.Mastery[weapon])
	sm.updateRankFloorLocked(studentID)
}

func (sm *SchoolModule) studentRank(studentID, weapon string) int {
	s, ok := sm.p.students[studentID]
	if !ok {
		return 0
	}
	return s.Ranks[weapon]
}

func (sm *SchoolModule) updateRankFloorLocked(studentID string) {
	s, ok := sm.p.students[studentID]
	if !ok {
		return
	}
	if sm.rankFloors[studentID] == nil {
		sm.rankFloors[studentID] = map[string]int64{}
	}
	for w, units := range s.Mastery {
		rank := mastery.RankFromUnits(units)
		floor := int64(rank) * 100000
		if floor > sm.rankFloors[studentID][w] {
			sm.rankFloors[studentID][w] = floor
		}
	}
}

func (sm *SchoolModule) publishMasteryApplied(studentID, weapon string, units int64) {
	ev := envelope.NewEvent("school.weapon.mastery.points.applied.v1", "school-mastery", TenantDemo, RealmKey,
		"MasteryAccount", studentID+":"+weapon, fmt.Sprintf("mastery:apply:%s:%s:%d", studentID, weapon, units), units,
		map[string]any{"studentId": studentID, "weaponKey": weapon, "units": units})
	_, _ = sm.p.outbox.Append(ev)
}

func (sm *SchoolModule) publishRankChanged(studentID, weapon string, rank int) {
	ev := envelope.NewEvent("school.weapon.mastery.rank.changed.v1", "school-mastery", TenantDemo, RealmKey,
		"MasteryAccount", studentID+":"+weapon, fmt.Sprintf("mastery:rank:%s:%s:%d", studentID, weapon, rank), int64(rank),
		map[string]any{"studentId": studentID, "weaponKey": weapon, "rank": rank})
	_, _ = sm.p.outbox.Append(ev)
	sm.p.grantTitleForRankFromSchool(studentID, rank)
}

// RunDailyDecay applies decay for a local calendar date (Europe/Moscow).
func (sm *SchoolModule) RunDailyDecay(localDate string) (int, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	count := 0
	for _, s := range sm.p.students {
		key := s.ID + ":" + localDate
		if _, done := sm.decayApplied[key]; done {
			continue
		}
		sm.decayApplied[key] = struct{}{}
		floors := sm.rankFloors[s.ID]
		for w, units := range s.Mastery {
			floor := int64(0)
			if floors != nil {
				floor = floors[w]
			}
			next := mastery.ApplyDecay(units, floor)
			if next != units {
				s.Mastery[w] = next
				s.Ranks[w] = mastery.RankFromUnits(next)
				count++
			}
		}
	}
	return count, nil
}

type MasteryView struct {
	WeaponKey string  `json:"weaponKey"`
	Units     int64   `json:"units"`
	Points    float64 `json:"points"`
	Rank      int     `json:"rank"`
	Floor     int64   `json:"floorUnits"`
}

func (sm *SchoolModule) MasteryForStudent(studentID string) ([]MasteryView, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	s, ok := sm.p.students[studentID]
	if !ok {
		return nil, fmt.Errorf("student not found")
	}
	floors := sm.rankFloors[studentID]
	out := make([]MasteryView, 0, len(mastery.WeaponKeys))
	for _, w := range mastery.WeaponKeys {
		units := s.Mastery[w]
		floor := int64(0)
		if floors != nil {
			floor = floors[w]
		}
		out = append(out, MasteryView{
			WeaponKey: w,
			Units:     units,
			Points:    float64(units) / 10000,
			Rank:      s.Ranks[w],
			Floor:     floor,
		})
	}
	return out, nil
}

func (sm *SchoolModule) ListTariffs() []school.Tariff {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	out := make([]school.Tariff, 0, len(sm.tariffs))
	for _, t := range sm.tariffs {
		out = append(out, *t)
	}
	return out
}

func (sm *SchoolModule) CreateMembershipCheckout(studentID, tariffKey, returnURL string) (*school.Payment, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	t, ok := sm.tariffs[tariffKey]
	if !ok {
		return nil, fmt.Errorf("tariff not found")
	}
	if _, ok := sm.p.students[studentID]; !ok {
		return nil, fmt.Errorf("student not found")
	}
	orderID := uuid.NewString()
	attemptID := uuid.NewString()
	order := &school.Order{
		ID: orderID, StudentID: studentID, TariffKey: tariffKey,
		AmountMinor: t.AmountMinor, Currency: t.Currency, Status: "pending", CreatedAt: time.Now().UTC(),
	}
	sm.orders[orderID] = order
	res, err := sm.yoo.CreatePayment(yoomoney.CreatePaymentInput{
		IdempotencyKey: attemptID,
		AmountMinor:    t.AmountMinor,
		Currency:       t.Currency,
		Description:    t.Title,
		ReturnURL:      returnURL,
	})
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	pay := &school.Payment{
		ID: uuid.NewString(), OrderID: orderID, AttemptID: attemptID, Provider: "yoomoney",
		ProviderPaymentID: res.ID, AmountMinor: t.AmountMinor, Currency: t.Currency,
		Status: school.PaymentPending, ConfirmationURL: res.ConfirmationURL, CreatedAt: now, UpdatedAt: now,
	}
	sm.payments[pay.ID] = pay
	receipt := &school.FiscalReceipt{
		ID: uuid.NewString(), PaymentID: pay.ID, Status: "pending", UpdatedAt: now,
	}
	sm.receipts[receipt.ID] = receipt
	return pay, nil
}

func (sm *SchoolModule) HandleYooMoneyWebhook(providerPaymentID, eventID string) (*school.Membership, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	if eventID != "" {
		if _, seen := sm.webhookSeen[eventID]; seen {
			return sm.membershipForPayment(providerPaymentID)
		}
		sm.webhookSeen[eventID] = struct{}{}
	}
	var pay *school.Payment
	for _, p := range sm.payments {
		if p.ProviderPaymentID == providerPaymentID {
			pay = p
			break
		}
	}
	if pay == nil {
		return nil, fmt.Errorf("payment not found")
	}
	if pay.Status == school.PaymentSucceeded {
		return sm.membershipByOrder(pay.OrderID)
	}
	if _, err := sm.yoo.SimulateWebhook(providerPaymentID); err != nil {
		return nil, err
	}
	pay.Status = school.PaymentSucceeded
	pay.UpdatedAt = time.Now().UTC()
	order := sm.orders[pay.OrderID]
	if order != nil {
		order.Status = "paid"
	}
	for _, r := range sm.receipts {
		if r.PaymentID == pay.ID {
			r.Status = "sent"
			r.Reference = "fiscal-" + pay.ID
			r.UpdatedAt = time.Now().UTC()
		}
	}
	mem := sm.activateMembershipLocked(order)
	ev := envelope.NewEvent("school.payment.completed.v1", "school-commerce", TenantDemo, RealmKey,
		"Payment", pay.ID, "payment:complete:"+pay.AttemptID, 1,
		map[string]any{"orderId": pay.OrderID, "studentId": order.StudentID, "amountMinor": pay.AmountMinor})
	_, _ = sm.p.outbox.Append(ev)
	if order != nil {
		act := envelope.NewEvent("school.membership.activated.v1", "school-commerce", TenantDemo, RealmKey,
			"Membership", mem.ID, "membership:activate:"+mem.ID, 1, map[string]any{"studentId": mem.StudentID})
		_, _ = sm.p.outbox.Append(act)
	}
	return mem, nil
}

func (sm *SchoolModule) activateMembershipLocked(order *school.Order) *school.Membership {
	now := time.Now().UTC()
	m := &school.Membership{
		ID: uuid.NewString(), StudentID: order.StudentID, TariffKey: order.TariffKey,
		Status: school.MembershipActive, StartsAt: now, ExpiresAt: now.Add(30 * 24 * time.Hour), OrderID: order.ID,
	}
	sm.memberships[m.ID] = m
	return m
}

func (sm *SchoolModule) membershipByOrder(orderID string) (*school.Membership, error) {
	for _, m := range sm.memberships {
		if m.OrderID == orderID {
			return m, nil
		}
	}
	return nil, fmt.Errorf("membership not found")
}

func (sm *SchoolModule) membershipForPayment(providerPaymentID string) (*school.Membership, error) {
	for _, p := range sm.payments {
		if p.ProviderPaymentID == providerPaymentID {
			return sm.membershipByOrder(p.OrderID)
		}
	}
	return nil, fmt.Errorf("membership not found")
}

func (sm *SchoolModule) MembershipForStudent(studentID string) (*school.Membership, bool) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	for _, m := range sm.memberships {
		if m.StudentID == studentID && m.Status == school.MembershipActive {
			return m, true
		}
	}
	return nil, false
}

func (sm *SchoolModule) ListPayments(studentID string) []school.Payment {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	out := make([]school.Payment, 0)
	for _, p := range sm.payments {
		order := sm.orders[p.OrderID]
		if studentID == "" || (order != nil && order.StudentID == studentID) {
			out = append(out, *p)
		}
	}
	return out
}

func (sm *SchoolModule) AfterAttendanceConfirmed(studentID, attendanceID string) {
	if strings.HasPrefix(attendanceID, "quest:") {
		return
	}
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sm.attendanceCount[studentID]++
	sm.trackQuestLocked(studentID, "training.ready", 1)
	sm.trackQuestLocked(studentID, "weekly.rhythm.2", sm.attendanceCount[studentID])
	sm.checkAttendanceAchievementsLocked(studentID)
	if l := sm.leadForStudent(studentID); l != nil && l.Stage == school.FunnelTrialBooked {
		l.Stage = school.FunnelAttended
		l.UpdatedAt = time.Now().UTC()
	}
}

func (sm *SchoolModule) leadForStudent(studentID string) *school.Lead {
	for _, l := range sm.leads {
		if l.Notes == studentID {
			return l
		}
	}
	return nil
}

func (sm *SchoolModule) SetKillSwitch(key string, enabled bool) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sm.killSwitches[key] = enabled
}

func (sm *SchoolModule) IsKillSwitchActive(key string) bool {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	return sm.killSwitches[key]
}

func (sm *SchoolModule) ExportKillSwitches() map[string]bool {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	out := make(map[string]bool, len(sm.killSwitches))
	for k, v := range sm.killSwitches {
		out[k] = v
	}
	return out
}

func (sm *SchoolModule) DispatchNotification(purpose, channel, recipient string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sm.commsLog = append(sm.commsLog, fmt.Sprintf("%s:%s:%s", purpose, channel, recipient))
}

func (sm *SchoolModule) CommsLog() []string {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	return append([]string{}, sm.commsLog...)
}

func (sm *SchoolModule) SetMinor(studentID string, minor bool) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sm.isMinor[studentID] = minor
}

func (sm *SchoolModule) IsProgressionPrivate(studentID string) bool {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	return sm.isMinor[studentID]
}

func cloneRecord(r *training.Record) *training.Record {
	cp := *r
	cp.Entries = append([]training.ExerciseEntry{}, r.Entries...)
	return &cp
}
