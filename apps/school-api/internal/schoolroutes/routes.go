package schoolroutes

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/masterofsword/contracts/engines"
	"github.com/masterofsword/contracts/rbac"
	"github.com/masterofsword/contracts/school"
	"github.com/masterofsword/contracts/training"
	"github.com/masterofsword/school-api/internal/admincontent"
	"github.com/masterofsword/school-api/internal/authz"
)

type Deps struct {
	Platform  *engines.Platform
	Content   *admincontent.Store
	WriteJSON func(http.ResponseWriter, any)
}

func Register(mux *http.ServeMux, d Deps) {
	mux.HandleFunc("GET /v1/mastery/me", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		views, err := d.Platform.School.MasteryForStudent(actor.ID)
		if err != nil {
			http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
			return
		}
		d.WriteJSON(w, views)
	}))

	mux.HandleFunc("POST /v1/mastery/decay/run", authz.RequirePermission(d.Platform, rbac.PermUsersUpdate, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			LocalDate string `json:"localDate"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if body.LocalDate == "" {
			body.LocalDate = time.Now().Format("2006-01-02")
		}
		n, err := d.Platform.School.RunDailyDecay(body.LocalDate)
		if err != nil {
			http.Error(w, `{"error":"decay_failed"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, map[string]any{"applied": n})
	}))

	mux.HandleFunc("GET /v1/training/records", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		studentID := r.URL.Query().Get("studentId")
		if studentID == "" || studentID == actor.ID {
			studentID = actor.ID
		} else if !actor.IsPlatformAdmin() && !actor.HasPermission(rbac.PermAttendanceConfirm) {
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
			return
		}
		d.WriteJSON(w, d.Platform.School.ListTrainingRecords(studentID))
	}))

	mux.HandleFunc("POST /v1/training/records", authz.RequirePermission(d.Platform, rbac.PermTrainingWrite, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var rec training.Record
		if err := json.NewDecoder(r.Body).Decode(&rec); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		if rec.StudentID == "" {
			rec.StudentID = actor.ID
		}
		if rec.CoachID == "" {
			rec.CoachID = actor.ID
		}
		created, err := d.Platform.School.CreateTrainingRecord(rec)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, created)
	}))

	mux.HandleFunc("POST /v1/training/records/{id}/confirm", authz.RequirePermission(d.Platform, rbac.PermTrainingWrite, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		rec, err := d.Platform.School.ConfirmTrainingRecord(r.PathValue("id"), actor.ID)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, rec)
	}))

	mux.HandleFunc("POST /v1/training/records/{id}/correct", authz.RequirePermission(d.Platform, rbac.PermTrainingWrite, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var body struct {
			Reason  string                  `json:"reason"`
			Entries []training.ExerciseEntry `json:"entries"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		rec, err := d.Platform.School.CorrectTrainingRecord(r.PathValue("id"), body.Reason, body.Entries)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, rec)
	}))

	mux.HandleFunc("POST /v1/training/records/{id}/void", authz.RequirePermission(d.Platform, rbac.PermTrainingWrite, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			Reason string `json:"reason"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		rec, err := d.Platform.School.VoidTrainingRecord(r.PathValue("id"), body.Reason)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, rec)
	}))

	mux.HandleFunc("GET /v1/halls", func(w http.ResponseWriter, r *http.Request) {
		d.WriteJSON(w, d.Platform.School.ListHalls())
	})

	mux.HandleFunc("GET /v1/schedule/sessions", func(w http.ResponseWriter, r *http.Request) {
		d.WriteJSON(w, d.Platform.School.ListSessions(time.Time{}, time.Time{}))
	})

	mux.HandleFunc("POST /v1/bookings/trial", authz.RequirePermission(d.Platform, rbac.PermBookingCreate, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var body struct {
			SessionID string `json:"sessionId"`
			LeadID    string `json:"leadId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		b, err := d.Platform.School.CreateTrialBooking(body.SessionID, body.LeadID, actor.ID)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, b)
	}))

	mux.HandleFunc("POST /v1/public/leads", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Name, Phone, Email, Source, UTM, Direction string
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		l, err := d.Platform.School.CreateLead(body.Name, body.Phone, body.Email, body.Source, body.UTM, body.Direction)
		if err != nil {
			http.Error(w, `{"error":"create_failed"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, l)
	})

	mux.HandleFunc("GET /v1/crm/leads", authz.RequirePermission(d.Platform, rbac.PermCRMRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, d.Platform.School.ListLeads())
	}))

	mux.HandleFunc("POST /v1/crm/leads", authz.RequirePermission(d.Platform, rbac.PermCRMWrite, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			Name, Phone, Email, Source, UTM, Direction string
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		l, err := d.Platform.School.CreateLead(body.Name, body.Phone, body.Email, body.Source, body.UTM, body.Direction)
		if err != nil {
			http.Error(w, `{"error":"create_failed"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, l)
	}))

	mux.HandleFunc("PUT /v1/crm/leads/{id}/stage", authz.RequirePermission(d.Platform, rbac.PermCRMWrite, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			Stage school.FunnelStage `json:"stage"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		l, err := d.Platform.School.UpdateLeadStage(r.PathValue("id"), body.Stage)
		if err != nil {
			http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
			return
		}
		d.WriteJSON(w, l)
	}))

	mux.HandleFunc("GET /v1/crm/tasks", authz.RequirePermission(d.Platform, rbac.PermCRMRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, d.Platform.School.ListTasks())
	}))

	mux.HandleFunc("POST /v1/crm/tasks", authz.RequirePermission(d.Platform, rbac.PermCRMWrite, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			LeadID string    `json:"leadId"`
			Title  string    `json:"title"`
			DueAt  time.Time `json:"dueAt"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		t, err := d.Platform.School.CreateTask(body.LeadID, body.Title, body.DueAt)
		if err != nil {
			http.Error(w, `{"error":"create_failed"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, t)
	}))

	mux.HandleFunc("GET /v1/commerce/tariffs", func(w http.ResponseWriter, r *http.Request) {
		d.WriteJSON(w, d.Platform.School.ListTariffs())
	})

	mux.HandleFunc("POST /v1/checkout/membership", authz.RequirePermission(d.Platform, rbac.PermCommerceCheckout, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var body struct {
			TariffKey string `json:"tariffKey"`
			ReturnURL string `json:"returnUrl"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		if body.ReturnURL == "" {
			body.ReturnURL = "http://localhost:3000/membership"
		}
		pay, err := d.Platform.School.CreateMembershipCheckout(actor.ID, body.TariffKey, body.ReturnURL)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, pay)
	}))

	mux.HandleFunc("POST /v1/webhooks/yoomoney", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Event   string `json:"event"`
			Object  struct {
				ID string `json:"id"`
			} `json:"object"`
			EventID string `json:"eventId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		mem, err := d.Platform.School.HandleYooMoneyWebhook(body.Object.ID, body.EventID)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, map[string]any{"membership": mem})
	})

	mux.HandleFunc("GET /v1/commerce/membership/me", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		m, ok := d.Platform.School.MembershipForStudent(actor.ID)
		if !ok {
			d.WriteJSON(w, map[string]any{"active": false})
			return
		}
		d.WriteJSON(w, map[string]any{"active": true, "membership": m})
	}))

	mux.HandleFunc("GET /v1/commerce/payments", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		if actor.IsPlatformAdmin() {
			d.WriteJSON(w, d.Platform.School.ListPayments(""))
			return
		}
		d.WriteJSON(w, d.Platform.School.ListPayments(actor.ID))
	}))

	mux.HandleFunc("GET /v1/quests/me", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		d.WriteJSON(w, d.Platform.School.QuestProgressForStudent(actor.ID))
	}))

	mux.HandleFunc("GET /v1/achievements/me", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		if d.Platform.School.IsProgressionPrivate(actor.ID) && !actor.IsPlatformAdmin() {
			d.WriteJSON(w, []engines.AchievementState{})
			return
		}
		d.WriteJSON(w, d.Platform.School.AchievementsForStudent(actor.ID))
	}))

	mux.HandleFunc("POST /v1/admin/content/kill-switch", authz.RequirePermission(d.Platform, rbac.PermContentWrite, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			Key     string `json:"key"`
			Enabled bool   `json:"enabled"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		d.Platform.School.SetKillSwitch(body.Key, body.Enabled)
		d.WriteJSON(w, map[string]any{"ok": true})
	}))

	mux.HandleFunc("GET /v1/analytics/summary", authz.RequirePermission(d.Platform, rbac.PermCommerceAdmin, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		payments := d.Platform.School.ListPayments("")
		var revenue int64
		for _, p := range payments {
			if p.Status == school.PaymentSucceeded {
				revenue += p.AmountMinor
			}
		}
		d.WriteJSON(w, map[string]any{
			"activeStudents": len(d.Platform.ListStudents()),
			"leads":          len(d.Platform.School.ListLeads()),
			"revenueMinor":   revenue,
		})
	}))

	mux.HandleFunc("POST /v1/comms/send", authz.RequirePermission(d.Platform, rbac.PermCRMWrite, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			Purpose, Channel, Recipient, Template string
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		msg := d.Platform.School.SendNotification(body.Purpose, body.Channel, body.Recipient, body.Template)
		d.WriteJSON(w, msg)
	}))

	mux.HandleFunc("POST /v1/comms/reminders/run", authz.RequirePermission(d.Platform, rbac.PermCRMWrite, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		n := d.Platform.School.RunReminderSchedule()
		d.WriteJSON(w, map[string]any{"sent": n})
	}))

	mux.HandleFunc("GET /v1/comms/log", authz.RequirePermission(d.Platform, rbac.PermCRMRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, d.Platform.School.CommsLog())
	}))

	mux.HandleFunc("POST /v1/import/stage", authz.RequirePermission(d.Platform, rbac.PermUsersCreate, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			FileName string              `json:"fileName"`
			Rows     []engines.ImportRow `json:"rows"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		batch, err := d.Platform.School.StageImport(body.FileName, body.Rows)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, batch)
	}))

	mux.HandleFunc("GET /v1/import/batches", authz.RequirePermission(d.Platform, rbac.PermUsersRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, d.Platform.School.ListImportBatches())
	}))

	mux.HandleFunc("GET /v1/import/batches/{id}/preview", authz.RequirePermission(d.Platform, rbac.PermUsersRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		b, err := d.Platform.School.PreviewImport(r.PathValue("id"))
		if err != nil {
			http.Error(w, `{"error":"not_found"}`, http.StatusNotFound)
			return
		}
		d.WriteJSON(w, b)
	}))

	mux.HandleFunc("POST /v1/import/batches/{id}/commit", authz.RequirePermission(d.Platform, rbac.PermUsersCreate, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		b, err := d.Platform.School.CommitImport(r.PathValue("id"))
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, b)
	}))

	mux.HandleFunc("GET /v1/studio/release", authz.RequirePermission(d.Platform, rbac.PermContentRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, map[string]any{
			"bundleKey":     "school.fencing.starter",
			"bundleVersion": 2,
			"status":        "draft",
			"killSwitches":  d.Platform.School.ExportKillSwitches(),
		})
	}))

	mux.HandleFunc("GET /v1/season/current", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, d.Platform.School.CurrentSeason())
	}))

	mux.HandleFunc("POST /v1/season/activate", authz.RequirePermission(d.Platform, rbac.PermContentWrite, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			EditionKey string    `json:"editionKey"`
			StartsAt   time.Time `json:"startsAt"`
			EndsAt     time.Time `json:"endsAt"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		if body.StartsAt.IsZero() {
			body.StartsAt = time.Now().UTC()
		}
		if body.EndsAt.IsZero() {
			body.EndsAt = body.StartsAt.Add(90 * 24 * time.Hour)
		}
		d.WriteJSON(w, d.Platform.School.ActivateSeason(body.EditionKey, body.StartsAt, body.EndsAt))
	}))

	mux.HandleFunc("GET /v1/battlepass/me", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		d.WriteJSON(w, d.Platform.School.BattlePassForStudent(actor.ID))
	}))

	mux.HandleFunc("GET /v1/talents/catalog", func(w http.ResponseWriter, r *http.Request) {
		if d.Content == nil {
			d.WriteJSON(w, admincontent.TalentUICatalog{})
			return
		}
		d.WriteJSON(w, d.Content.TalentUICatalog())
	})

	mux.HandleFunc("GET /v1/talents/me/unlocked", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		d.WriteJSON(w, d.Platform.School.TalentsForStudent(actor.ID))
	}))

	mux.HandleFunc("POST /v1/talents/unlock", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		if d.Content == nil {
			http.Error(w, `{"error":"catalog_unavailable"}`, http.StatusServiceUnavailable)
			return
		}
		var body struct {
			TalentKey string `json:"talentKey"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.TalentKey == "" {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		talent, ok := d.Content.GetTalent(body.TalentKey)
		if !ok {
			http.Error(w, `{"error":"unknown_talent"}`, http.StatusNotFound)
			return
		}
		unlocked := d.Platform.School.TalentsForStudent(actor.ID)
		unlockedSet := map[string]bool{}
		for _, key := range unlocked {
			unlockedSet[key] = true
		}
		if unlockedSet[body.TalentKey] {
			http.Error(w, `{"error":"already_unlocked"}`, http.StatusConflict)
			return
		}
		for _, req := range talent.Requires {
			if !unlockedSet[req] {
				http.Error(w, `{"error":"prerequisites_not_met"}`, http.StatusBadRequest)
				return
			}
		}
		if err := d.Platform.School.UnlockTalent(actor.ID, body.TalentKey); err != nil {
			http.Error(w, `{"error":"unlock_failed"}`, http.StatusInternalServerError)
			return
		}
		d.WriteJSON(w, map[string]any{"ok": true, "talentKey": body.TalentKey})
	}))

	mux.HandleFunc("POST /v1/bookings/rental", authz.RequirePermission(d.Platform, rbac.PermBookingCreate, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var body struct {
			HallID   string    `json:"hallId"`
			StartsAt time.Time `json:"startsAt"`
			EndsAt   time.Time `json:"endsAt"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		b, err := d.Platform.School.CreateRentalBooking(body.HallID, body.StartsAt, body.EndsAt, actor.ID)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, b)
	}))

	mux.HandleFunc("POST /v1/waitlist/join", authz.RequirePermission(d.Platform, rbac.PermBookingCreate, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var body struct {
			SessionID string `json:"sessionId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		e, err := d.Platform.School.JoinWaitlist(body.SessionID, actor.ID)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, e)
	}))

	mux.HandleFunc("POST /v1/waitlist/{id}/claim", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		b, err := d.Platform.School.ClaimWaitlistOffer(r.PathValue("id"), actor.ID)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, b)
	}))

	mux.HandleFunc("GET /v1/waitlist", authz.RequirePermission(d.Platform, rbac.PermScheduleRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, d.Platform.School.ListWaitlist(r.URL.Query().Get("sessionId")))
	}))

	mux.HandleFunc("POST /v1/waitlist/offer-next", authz.RequirePermission(d.Platform, rbac.PermUsersUpdate, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			SessionID string `json:"sessionId"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		e, err := d.Platform.School.OfferNextWaitlist(body.SessionID)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, e)
	}))

	mux.HandleFunc("GET /v1/renter/bookings", authz.RequirePermission(d.Platform, rbac.PermHallsRead, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		d.WriteJSON(w, d.Platform.School.ListRentalsForStudent(actor.ID))
	}))

	mux.HandleFunc("GET /v1/halls/{id}/availability", func(w http.ResponseWriter, r *http.Request) {
		d.WriteJSON(w, d.Platform.School.HallAvailability(r.PathValue("id"), time.Time{}, time.Time{}))
	})

	mux.HandleFunc("POST /v1/mastery/reviews", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var body struct {
			WeaponKey string `json:"weaponKey"`
			Rank      int    `json:"rank"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		rev, err := d.Platform.School.RequestMasterRankReview(actor.ID, body.WeaponKey, body.Rank)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, rev)
	}))

	mux.HandleFunc("GET /v1/mastery/reviews", authz.RequirePermission(d.Platform, rbac.PermUsersRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, d.Platform.School.ListMasterRankReviews(r.URL.Query().Get("status")))
	}))

	mux.HandleFunc("POST /v1/mastery/reviews/{id}/decide", authz.RequirePermission(d.Platform, rbac.PermUsersUpdate, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			Decision string `json:"decision"`
			Note     string `json:"note"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		rev, err := d.Platform.School.DecideMasterRankReview(r.PathValue("id"), body.Decision, body.Note)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, rev)
	}))

	mux.HandleFunc("GET /v1/guardian/dependants", authz.RequirePermission(d.Platform, rbac.PermDependantsRead, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		ids := d.Platform.ListDependantIDs(actor.ID)
		out := make([]engines.DependantSummary, 0, len(ids))
		for _, id := range ids {
			sum, err := d.Platform.DependantSummaryFor(actor.ID, id)
			if err != nil {
				continue
			}
			out = append(out, *sum)
		}
		d.WriteJSON(w, out)
	}))

	mux.HandleFunc("GET /v1/guardian/dependants/{id}", authz.RequirePermission(d.Platform, rbac.PermDependantsRead, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		sum, err := d.Platform.DependantSummaryFor(actor.ID, r.PathValue("id"))
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusForbidden)
			return
		}
		d.WriteJSON(w, sum)
	}))

	mux.HandleFunc("GET /v1/leaderboard", func(w http.ResponseWriter, r *http.Request) {
		d.WriteJSON(w, d.Platform.Leaderboard(20))
	})

	mux.HandleFunc("POST /v1/privacy/public-share", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		if err := d.Platform.RequestPublicShare(actor.ID); err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusForbidden)
			return
		}
		d.WriteJSON(w, map[string]any{"ok": true})
	}))

	mux.HandleFunc("POST /v1/admin/students/{id}/minor", authz.RequirePermission(d.Platform, rbac.PermUsersUpdate, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			Minor bool `json:"minor"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		d.Platform.School.SetMinor(r.PathValue("id"), body.Minor)
		d.WriteJSON(w, map[string]any{"ok": true})
	}))

	mux.HandleFunc("POST /v1/support/cases", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var body struct {
			Subject          string `json:"subject"`
			Body             string `json:"body"`
			TrainingRecordID string `json:"trainingRecordId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		c, err := d.Platform.CreateSupportCase(actor.ID, body.Subject, body.TrainingRecordID, body.Body)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, c)
	}))

	mux.HandleFunc("GET /v1/support/cases/me", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		d.WriteJSON(w, d.Platform.ListSupportCasesForStudent(actor.ID))
	}))

	mux.HandleFunc("POST /v1/support/cases/{id}/messages", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		var body struct {
			Body string `json:"body"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		c, err := d.Platform.AddSupportMessage(r.PathValue("id"), actor.ID, body.Body)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, c)
	}))

	mux.HandleFunc("GET /v1/admin/support/cases", authz.RequirePermission(d.Platform, rbac.PermUsersRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, d.Platform.ListSupportCases(r.URL.Query().Get("status")))
	}))

	mux.HandleFunc("POST /v1/admin/support/cases/{id}/resolve", authz.RequirePermission(d.Platform, rbac.PermUsersUpdate, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			Note            string `json:"note"`
			ApplyCorrection bool   `json:"applyCorrection"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		c, err := d.Platform.ResolveSupportCase(r.PathValue("id"), body.Note, body.ApplyCorrection)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, c)
	}))

	mux.HandleFunc("GET /v1/admin/assets", authz.RequirePermission(d.Platform, rbac.PermContentRead, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, d.Platform.ListAssetRevisions(r.URL.Query().Get("status")))
	}))

	mux.HandleFunc("POST /v1/admin/assets", authz.RequirePermission(d.Platform, rbac.PermContentWrite, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			ItemKey  string `json:"itemKey"`
			ImageURL string `json:"imageUrl"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		rev, err := d.Platform.CreateAssetRevision(body.ItemKey, body.ImageURL)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, rev)
	}))

	mux.HandleFunc("POST /v1/admin/assets/{id}/decide", authz.RequirePermission(d.Platform, rbac.PermContentWrite, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		var body struct {
			Decision string `json:"decision"`
			Note     string `json:"note"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, `{"error":"bad_request"}`, http.StatusBadRequest)
			return
		}
		rev, err := d.Platform.DecideAssetRevision(r.PathValue("id"), body.Decision, body.Note)
		if err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		d.WriteJSON(w, rev)
	}))

	mux.HandleFunc("GET /v1/analytics/cohorts", authz.RequirePermission(d.Platform, rbac.PermCommerceAdmin, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, d.Platform.AnalyticsCohorts())
	}))

	mux.HandleFunc("GET /v1/analytics/churn", authz.RequirePermission(d.Platform, rbac.PermCommerceAdmin, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, d.Platform.AnalyticsChurn(30))
	}))

	mux.HandleFunc("GET /v1/analytics/hall-heatmap", authz.RequirePermission(d.Platform, rbac.PermCommerceAdmin, func(w http.ResponseWriter, r *http.Request, _ *engines.Student) {
		d.WriteJSON(w, d.Platform.AnalyticsHallHeatmap(time.Time{}, time.Time{}))
	}))
}
