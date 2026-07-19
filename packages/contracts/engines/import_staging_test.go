package engines_test

import (
	"testing"

	"github.com/masterofsword/contracts/engines"
)

func TestImportStagingDedup(t *testing.T) {
	p := engines.NewPlatform()
	rows := []engines.ImportRow{
		{RowIndex: 1, Login: "new.user@local", Name: "New User"},
		{RowIndex: 2, Login: "new.user@local", Name: "Dup"},
	}
	batch, err := p.School.StageImport("test.xlsx", rows)
	if err != nil {
		t.Fatal(err)
	}
	if batch.Rows[1].Status != engines.ImportRowQuarantine {
		t.Fatalf("expected quarantine for duplicate, got %s", batch.Rows[1].Status)
	}
}

func TestImportCommit(t *testing.T) {
	p := engines.NewPlatform()
	rows := []engines.ImportRow{{RowIndex: 1, Login: "imported@local", Name: "Imported"}}
	batch, err := p.School.StageImport("test.xlsx", rows)
	if err != nil {
		t.Fatal(err)
	}
	committed, err := p.School.CommitImport(batch.ID)
	if err != nil {
		t.Fatal(err)
	}
	if committed.Rows[0].Status != engines.ImportRowCommitted {
		t.Fatalf("status=%s", committed.Rows[0].Status)
	}
	s, ok := p.GetStudent(committed.Rows[0].StudentID)
	if !ok || s.Login != "imported@local" {
		t.Fatal("student not created")
	}
}

func TestSnapshotRoundTrip(t *testing.T) {
	p := engines.NewPlatform()
	p.UpsertStudent(engines.Student{ID: "s1", Login: "snap@local", Password: "x", Mastery: map[string]int64{}, Ranks: map[string]int{}})
	_, _ = p.School.CreateLead("Test", "", "", "web", "", "witcher")
	snap := p.ExportSnapshot()
	p2 := engines.NewPlatform()
	p2.RestoreSnapshot(snap)
	if len(p2.School.ListLeads()) != 1 {
		t.Fatal("lead not restored")
	}
}
