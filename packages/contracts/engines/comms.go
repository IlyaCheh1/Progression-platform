package engines

import (
	"fmt"
	"time"

	"github.com/masterofsword/contracts/school"
)

type CommsMessage struct {
	ID        string `json:"id"`
	Purpose   string `json:"purpose"`
	Channel   string `json:"channel"`
	Recipient string `json:"recipient"`
	Template  string `json:"template"`
	Status    string `json:"status"`
}

// SendNotification queues a transactional message (MVP: log-only dispatch).
func (sm *SchoolModule) SendNotification(purpose, channel, recipient, templateKey string) CommsMessage {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	msg := CommsMessage{
		ID: fmt.Sprintf("msg-%d", len(sm.commsLog)+1),
		Purpose: purpose, Channel: channel, Recipient: recipient,
		Template: templateKey, Status: "sent",
	}
	sm.commsLog = append(sm.commsLog, fmt.Sprintf("%s:%s:%s:%s", purpose, channel, recipient, templateKey))
	return msg
}

// RunReminderSchedule sends trial/membership reminders (stub).
func (sm *SchoolModule) RunReminderSchedule() int {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sent := 0
	for _, b := range sm.bookings {
		if b.Status == "confirmed" && b.StudentID != "" {
			if st, ok := sm.p.students[b.StudentID]; ok && st.Login != "" {
				sm.commsLog = append(sm.commsLog, "reminder:trial:24h:"+st.Login)
				sent++
			}
		}
	}
	for _, m := range sm.memberships {
		if m.Status == school.MembershipActive && m.ExpiresAt.Sub(nowUTC()) < 72*time.Hour {
			if st, ok := sm.p.students[m.StudentID]; ok {
				sm.commsLog = append(sm.commsLog, "reminder:membership:3d:"+st.Login)
				sent++
			}
		}
	}
	return sent
}

func nowUTC() time.Time { return time.Now().UTC() }
