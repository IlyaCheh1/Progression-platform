package schoolroutes

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/masterofsword/contracts/engines"
	"github.com/masterofsword/contracts/rbac"
	"github.com/masterofsword/contracts/school"
	"github.com/masterofsword/contracts/training"
	"github.com/masterofsword/school-api/internal/authz"
)

type Deps struct {
	Platform  *engines.Platform
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
	}))

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

	mux.HandleFunc("GET /v1/talents/me/unlocked", authz.RequireAuth(d.Platform, func(w http.ResponseWriter, r *http.Request, actor *engines.Student) {
		d.WriteJSON(w, d.Platform.School.TalentsForStudent(actor.ID))
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
}
