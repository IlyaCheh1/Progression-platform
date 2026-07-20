package engines

import (
	"encoding/json"
	"testing"
	"time"
)

func TestAccessTokenExpiresAfterTTL(t *testing.T) {
	p := NewPlatform()
	p.UpsertStudent(Student{ID: "s1", Login: "a@test.local", Password: "x", Role: RoleStudent})
	token, expiresAt, err := p.IssueAccessToken("s1")
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := p.ResolveAccessToken(token); !ok {
		t.Fatal("fresh token must resolve")
	}

	p.mu.Lock()
	sess := p.sessions[token]
	sess.ExpiresAt = time.Now().UTC().Add(-time.Second)
	p.sessions[token] = sess
	p.mu.Unlock()

	if _, ok := p.ResolveAccessToken(token); ok {
		t.Fatal("expired token must not resolve")
	}
	if expiresAt.Before(time.Now().Add(20 * 24 * time.Hour)) {
		t.Fatalf("unexpected expiry %v", expiresAt)
	}
}

func TestAccessTokenMapLegacyJSON(t *testing.T) {
	var m AccessTokenMap
	if err := json.Unmarshal([]byte(`{"tok1":"student-1"}`), &m); err != nil {
		t.Fatal(err)
	}
	if m["tok1"].StudentID != "student-1" {
		t.Fatalf("got %+v", m["tok1"])
	}
	if m["tok1"].ExpiresAt.Before(time.Now().Add(20 * 24 * time.Hour)) {
		t.Fatalf("legacy upgrade expiry too short: %v", m["tok1"].ExpiresAt)
	}
}
