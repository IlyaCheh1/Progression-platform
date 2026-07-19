package engines

import (
	"github.com/masterofsword/contracts/school"
	"github.com/masterofsword/contracts/training"
)

// PlatformSnapshot is a dev persistence DTO (Postgres is production source of truth).
type PlatformSnapshot struct {
	Characters      map[string]*Character           `json:"characters"`
	Students        map[string]*Student             `json:"students"`
	UserLogins      map[string]string               `json:"userLogins"`
	AccessTokens    map[string]string               `json:"accessTokens"`
	InboxSeen       []string                        `json:"inboxSeen"`
	Holdings        map[string]map[string]InventoryHolding `json:"holdings,omitempty"`
	GuardianLinks   map[string][]string             `json:"guardianLinks,omitempty"`
	SupportCases    map[string]*SupportCase         `json:"supportCases,omitempty"`
	AssetRevisions  map[string]*AssetRevision       `json:"assetRevisions,omitempty"`
	School          SchoolSnapshot                  `json:"school"`
}

type SchoolSnapshot struct {
	Records         []training.Record              `json:"records"`
	Leads           []school.Lead                  `json:"leads"`
	Tasks           []school.Task                  `json:"tasks"`
	Sessions        []school.Session               `json:"sessions"`
	Bookings        []school.Booking               `json:"bookings"`
	Orders          []school.Order                 `json:"orders"`
	Payments        []school.Payment               `json:"payments"`
	Memberships     []school.Membership            `json:"memberships"`
	QuestProgress   map[string][]QuestProgress     `json:"questProgress"`
	Achievements    map[string][]AchievementState  `json:"achievements"`
	KillSwitches    map[string]bool                `json:"killSwitches"`
	AttendanceCount map[string]int                 `json:"attendanceCount"`
	RankFloors      map[string]map[string]int64    `json:"rankFloors"`
	DecayApplied    []string                       `json:"decayApplied"`
	CommsLog        []string                       `json:"commsLog"`
	ImportBatches   []ImportBatch                  `json:"importBatches"`
	Waitlist        []school.WaitlistEntry         `json:"waitlist"`
	RankReviews     []school.MasterRankReview      `json:"rankReviews"`
	Reservations    []school.Reservation           `json:"reservations"`
	ActiveSeason    *SeasonState                   `json:"activeSeason,omitempty"`
	BattlePass      map[string]BattlePassState     `json:"battlePass,omitempty"`
	TalentUnlocks   map[string]map[string]bool     `json:"talentUnlocks,omitempty"`
	IsMinor         map[string]bool                `json:"isMinor,omitempty"`
}

// ExportSnapshot captures current mutable state.
func (p *Platform) ExportSnapshot() PlatformSnapshot {
	p.mu.Lock()
	defer p.mu.Unlock()
	inbox := make([]string, 0, len(p.inboxSeen))
	for k := range p.inboxSeen {
		inbox = append(inbox, k)
	}
	users := make(map[string]string, len(p.users))
	for login, s := range p.users {
		if s != nil {
			users[login] = s.ID
		}
	}
	tokens := make(map[string]string, len(p.sessions))
	for t, id := range p.sessions {
		tokens[t] = id
	}
	chars := make(map[string]*Character, len(p.characters))
	for k, v := range p.characters {
		cp := *v
		chars[k] = &cp
	}
	students := make(map[string]*Student, len(p.students))
	for k, v := range p.students {
		cp := *v
		cp.Password = v.Password
		students[k] = &cp
	}
	snap := PlatformSnapshot{
		Characters:   chars,
		Students:     students,
		UserLogins:   users,
		AccessTokens: tokens,
		InboxSeen:    inbox,
	}
	if len(p.holdings) > 0 {
		snap.Holdings = map[string]map[string]InventoryHolding{}
		for sid, bag := range p.holdings {
			snap.Holdings[sid] = map[string]InventoryHolding{}
			for k, v := range bag {
				snap.Holdings[sid][k] = v
			}
		}
	}
	if len(p.guardianLinks) > 0 {
		snap.GuardianLinks = map[string][]string{}
		for gid, deps := range p.guardianLinks {
			snap.GuardianLinks[gid] = append([]string{}, deps...)
		}
	}
	if len(p.supportCases) > 0 {
		snap.SupportCases = map[string]*SupportCase{}
		for id, c := range p.supportCases {
			cp := cloneSupportCase(c)
			snap.SupportCases[id] = cp
		}
	}
	if len(p.assetRevisions) > 0 {
		snap.AssetRevisions = map[string]*AssetRevision{}
		for id, r := range p.assetRevisions {
			cp := *r
			snap.AssetRevisions[id] = &cp
		}
	}
	if p.School != nil {
		snap.School = p.School.exportSnapshotLocked()
	}
	return snap
}

// RestoreSnapshot merges snapshot into platform (overwrites maps).
func (p *Platform) RestoreSnapshot(s PlatformSnapshot) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if s.Characters != nil {
		p.characters = s.Characters
	}
	if s.Students != nil {
		p.students = s.Students
		p.users = make(map[string]*Student)
		for login, id := range s.UserLogins {
			if st, ok := p.students[id]; ok {
				p.users[login] = st
			}
		}
	}
	if s.AccessTokens != nil {
		p.sessions = s.AccessTokens
	}
	p.inboxSeen = make(map[string]struct{})
	for _, k := range s.InboxSeen {
		p.inboxSeen[k] = struct{}{}
	}
	if s.Holdings != nil {
		p.holdings = s.Holdings
	}
	if s.GuardianLinks != nil {
		p.guardianLinks = s.GuardianLinks
	}
	if s.SupportCases != nil {
		p.supportCases = s.SupportCases
	}
	if s.AssetRevisions != nil {
		p.assetRevisions = s.AssetRevisions
	}
	if p.School != nil {
		p.School.restoreSnapshotLocked(s.School)
	}
}

func (sm *SchoolModule) exportSnapshotLocked() SchoolSnapshot {
	records := make([]training.Record, 0, len(sm.records))
	for _, r := range sm.records {
		records = append(records, *r)
	}
	leads := make([]school.Lead, 0, len(sm.leads))
	for _, l := range sm.leads {
		leads = append(leads, *l)
	}
	tasks := make([]school.Task, 0, len(sm.tasks))
	for _, t := range sm.tasks {
		tasks = append(tasks, *t)
	}
	sessions := make([]school.Session, 0, len(sm.sessions))
	for _, s := range sm.sessions {
		sessions = append(sessions, *s)
	}
	bookings := make([]school.Booking, 0, len(sm.bookings))
	for _, b := range sm.bookings {
		bookings = append(bookings, *b)
	}
	orders := make([]school.Order, 0, len(sm.orders))
	for _, o := range sm.orders {
		orders = append(orders, *o)
	}
	payments := make([]school.Payment, 0, len(sm.payments))
	for _, pay := range sm.payments {
		payments = append(payments, *pay)
	}
	memberships := make([]school.Membership, 0, len(sm.memberships))
	for _, m := range sm.memberships {
		memberships = append(memberships, *m)
	}
	qp := map[string][]QuestProgress{}
	for sid, m := range sm.questProgress {
		for _, q := range m {
			qp[sid] = append(qp[sid], *q)
		}
	}
	ach := map[string][]AchievementState{}
	for sid, m := range sm.achievements {
		for _, a := range m {
			ach[sid] = append(ach[sid], *a)
		}
	}
	decay := make([]string, 0, len(sm.decayApplied))
	for k := range sm.decayApplied {
		decay = append(decay, k)
	}
	floors := map[string]map[string]int64{}
	for sid, m := range sm.rankFloors {
		floors[sid] = map[string]int64{}
		for w, u := range m {
			floors[sid][w] = u
		}
	}
	snap := SchoolSnapshot{
		Records: records, Leads: leads, Tasks: tasks, Sessions: sessions, Bookings: bookings,
		Orders: orders, Payments: payments, Memberships: memberships,
		QuestProgress: qp, Achievements: ach,
		KillSwitches: sm.killSwitches, AttendanceCount: sm.attendanceCount,
		RankFloors: floors, DecayApplied: decay, CommsLog: append([]string{}, sm.commsLog...),
		ImportBatches: append([]ImportBatch{}, sm.importBatches...),
	}
	for _, w := range sm.waitlist {
		snap.Waitlist = append(snap.Waitlist, *w)
	}
	for _, r := range sm.rankReviews {
		snap.RankReviews = append(snap.RankReviews, *r)
	}
	for _, r := range sm.reserve {
		snap.Reservations = append(snap.Reservations, *r)
	}
	if sm.activeSeason != nil {
		cp := *sm.activeSeason
		snap.ActiveSeason = &cp
	}
	if len(sm.isMinor) > 0 {
		snap.IsMinor = map[string]bool{}
		for k, v := range sm.isMinor {
			snap.IsMinor[k] = v
		}
	}
	if len(sm.battlePass) > 0 {
		snap.BattlePass = map[string]BattlePassState{}
		for sid, bp := range sm.battlePass {
			snap.BattlePass[sid] = *bp
		}
	}
	if len(sm.talentUnlocks) > 0 {
		snap.TalentUnlocks = map[string]map[string]bool{}
		for sid, m := range sm.talentUnlocks {
			snap.TalentUnlocks[sid] = map[string]bool{}
			for k, v := range m {
				snap.TalentUnlocks[sid][k] = v
			}
		}
	}
	return snap
}

func (sm *SchoolModule) restoreSnapshotLocked(s SchoolSnapshot) {
	sm.records = map[string]*training.Record{}
	for i := range s.Records {
		r := s.Records[i]
		sm.records[r.TrainingRecordID] = &r
	}
	sm.leads = map[string]*school.Lead{}
	for i := range s.Leads {
		l := s.Leads[i]
		sm.leads[l.ID] = &l
	}
	sm.tasks = map[string]*school.Task{}
	for i := range s.Tasks {
		t := s.Tasks[i]
		sm.tasks[t.ID] = &t
	}
	sm.sessions = map[string]*school.Session{}
	for i := range s.Sessions {
		sess := s.Sessions[i]
		sm.sessions[sess.ID] = &sess
	}
	sm.bookings = map[string]*school.Booking{}
	for i := range s.Bookings {
		b := s.Bookings[i]
		sm.bookings[b.ID] = &b
	}
	sm.orders = map[string]*school.Order{}
	for i := range s.Orders {
		o := s.Orders[i]
		sm.orders[o.ID] = &o
	}
	sm.payments = map[string]*school.Payment{}
	for i := range s.Payments {
		pay := s.Payments[i]
		sm.payments[pay.ID] = &pay
	}
	sm.memberships = map[string]*school.Membership{}
	for i := range s.Memberships {
		m := s.Memberships[i]
		sm.memberships[m.ID] = &m
	}
	sm.questProgress = map[string]map[string]*QuestProgress{}
	for sid, list := range s.QuestProgress {
		sm.questProgress[sid] = map[string]*QuestProgress{}
		for i := range list {
			q := list[i]
			sm.questProgress[sid][q.QuestKey] = &q
		}
	}
	sm.achievements = map[string]map[string]*AchievementState{}
	for sid, list := range s.Achievements {
		sm.achievements[sid] = map[string]*AchievementState{}
		for i := range list {
			a := list[i]
			sm.achievements[sid][a.Key] = &a
		}
	}
	sm.killSwitches = s.KillSwitches
	sm.attendanceCount = s.AttendanceCount
	sm.rankFloors = s.RankFloors
	sm.decayApplied = map[string]struct{}{}
	for _, k := range s.DecayApplied {
		sm.decayApplied[k] = struct{}{}
	}
	sm.commsLog = append([]string{}, s.CommsLog...)
	sm.importBatches = append([]ImportBatch{}, s.ImportBatches...)
	sm.waitlist = map[string]*school.WaitlistEntry{}
	for i := range s.Waitlist {
		w := s.Waitlist[i]
		sm.waitlist[w.ID] = &w
	}
	sm.rankReviews = map[string]*school.MasterRankReview{}
	for i := range s.RankReviews {
		r := s.RankReviews[i]
		sm.rankReviews[r.ID] = &r
	}
	sm.reserve = map[string]*school.Reservation{}
	for i := range s.Reservations {
		r := s.Reservations[i]
		sm.reserve[r.ID] = &r
	}
	sm.activeSeason = s.ActiveSeason
	if s.IsMinor != nil {
		sm.isMinor = map[string]bool{}
		for k, v := range s.IsMinor {
			sm.isMinor[k] = v
		}
	}
	sm.battlePass = map[string]*BattlePassState{}
	for sid, bp := range s.BattlePass {
		cp := bp
		sm.battlePass[sid] = &cp
	}
	sm.talentUnlocks = map[string]map[string]bool{}
	for sid, m := range s.TalentUnlocks {
		sm.talentUnlocks[sid] = map[string]bool{}
		for k, v := range m {
			sm.talentUnlocks[sid][k] = v
		}
	}
}
