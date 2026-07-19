package engines

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

type ImportRowStatus string

const (
	ImportRowPending   ImportRowStatus = "pending"
	ImportRowQuarantine ImportRowStatus = "quarantine"
	ImportRowApproved  ImportRowStatus = "approved"
	ImportRowCommitted ImportRowStatus = "committed"
)

type ImportRow struct {
	RowIndex  int             `json:"rowIndex"`
	Login     string          `json:"login"`
	Name      string          `json:"name"`
	Status    ImportRowStatus `json:"status"`
	Reason    string          `json:"reason,omitempty"`
	StudentID string          `json:"studentId,omitempty"`
}

type ImportBatch struct {
	ID         string      `json:"id"`
	SourceHash string      `json:"sourceHash"`
	FileName   string      `json:"fileName"`
	Status     string      `json:"status"` // staged | preview | committed
	Rows       []ImportRow `json:"rows"`
	CreatedAt  time.Time   `json:"createdAt"`
	CommittedAt time.Time  `json:"committedAt,omitempty"`
}

func hashRows(rows []ImportRow) string {
	h := sha256.New()
	for _, r := range rows {
		_, _ = h.Write([]byte(fmt.Sprintf("%d:%s:%s\n", r.RowIndex, r.Login, r.Name)))
	}
	return hex.EncodeToString(h.Sum(nil))
}

// StageImport creates a batch from spreadsheet rows with dedup/quarantine.
func (sm *SchoolModule) StageImport(fileName string, rows []ImportRow) (*ImportBatch, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	if len(rows) == 0 {
		return nil, fmt.Errorf("no rows")
	}
	sourceHash := hashRows(rows)
	for _, b := range sm.importBatches {
		if b.SourceHash == sourceHash && b.Status == "committed" {
			return nil, fmt.Errorf("duplicate import: batch already committed")
		}
	}
	seenLogin := map[string]struct{}{}
	for i := range rows {
		rows[i].Status = ImportRowApproved
		if rows[i].Login == "" {
			rows[i].Status = ImportRowQuarantine
			rows[i].Reason = "missing login"
			continue
		}
		if _, ok := seenLogin[rows[i].Login]; ok {
			rows[i].Status = ImportRowQuarantine
			rows[i].Reason = "duplicate login in file"
			continue
		}
		seenLogin[rows[i].Login] = struct{}{}
		if _, exists := sm.p.users[rows[i].Login]; exists {
			rows[i].Status = ImportRowQuarantine
			rows[i].Reason = "login already exists"
		}
	}
	batch := &ImportBatch{
		ID: "import-" + sourceHash[:12], SourceHash: sourceHash, FileName: fileName,
		Status: "staged", Rows: rows, CreatedAt: time.Now().UTC(),
	}
	sm.importBatches = append(sm.importBatches, *batch)
	return batch, nil
}

func (sm *SchoolModule) ListImportBatches() []ImportBatch {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	return append([]ImportBatch{}, sm.importBatches...)
}

func (sm *SchoolModule) PreviewImport(batchID string) (*ImportBatch, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	for i := range sm.importBatches {
		if sm.importBatches[i].ID == batchID {
			sm.importBatches[i].Status = "preview"
			b := sm.importBatches[i]
			return &b, nil
		}
	}
	return nil, fmt.Errorf("batch not found")
}

func (sm *SchoolModule) CommitImport(batchID string) (*ImportBatch, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	for i := range sm.importBatches {
		if sm.importBatches[i].ID != batchID {
			continue
		}
		b := &sm.importBatches[i]
		if b.Status == "committed" {
			return b, nil
		}
		committed := 0
		for j := range b.Rows {
			row := &b.Rows[j]
			if row.Status != ImportRowApproved {
				continue
			}
			stID := "import-" + row.Login
			if _, err := sm.p.CreateCharacter("char-"+stID, "user-"+stID); err != nil {
				// exists ok
			}
			st := Student{
				ID: stID, DisplayName: row.Name, UserID: "user-" + stID,
				CharacterID: "char-" + stID, Login: row.Login, Password: "import-" + row.Login,
				Role: RoleStudent, Roles: []string{RoleStudent},
				Mastery: map[string]int64{}, Ranks: map[string]int{},
			}
			sm.p.UpsertStudent(st)
			row.Status = ImportRowCommitted
			row.StudentID = stID
			committed++
		}
		b.Status = "committed"
		b.CommittedAt = time.Now().UTC()
		return b, nil
	}
	return nil, fmt.Errorf("batch not found")
}
