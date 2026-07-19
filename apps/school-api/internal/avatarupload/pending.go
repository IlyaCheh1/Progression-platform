package avatarupload

import (
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

const (
	MaxFileSizeBytes = 2 * 1024 * 1024
	PendingTTL       = 15 * time.Minute
)

var allowedMIME = map[string]string{
	"image/jpeg": ".jpg",
	"image/jpg":  ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

type Pending struct {
	StudentID   string
	Key         string
	ContentType string
	ExpiresAt   time.Time
}

type Registry struct {
	mu   sync.Mutex
	byID map[string]Pending
}

func NewRegistry() *Registry {
	return &Registry{byID: make(map[string]Pending)}
}

func NormalizeMIME(raw string) (string, string, bool) {
	mime := strings.ToLower(strings.TrimSpace(raw))
	ext, ok := allowedMIME[mime]
	if !ok {
		return "", "", false
	}
	if mime == "image/jpg" {
		mime = "image/jpeg"
	}
	return mime, ext, true
}

func ExtFromFilename(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp":
		if ext == ".jpeg" {
			return ".jpg"
		}
		return ext
	default:
		return ""
	}
}

func ObjectKey(studentID, ext string) string {
	return "media/avatars/" + studentID + "/" + uuid.NewString() + ext
}

func (r *Registry) Put(studentID, key, contentType string) string {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.purgeExpiredLocked(time.Now())
	id := uuid.NewString()
	r.byID[id] = Pending{
		StudentID:   studentID,
		Key:         key,
		ContentType: contentType,
		ExpiresAt:   time.Now().Add(PendingTTL),
	}
	return id
}

func (r *Registry) Take(fileID, studentID string) (Pending, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.purgeExpiredLocked(time.Now())
	p, ok := r.byID[fileID]
	if !ok || p.StudentID != studentID {
		return Pending{}, false
	}
	delete(r.byID, fileID)
	return p, true
}

func (r *Registry) purgeExpiredLocked(now time.Time) {
	for id, p := range r.byID {
		if now.After(p.ExpiresAt) {
			delete(r.byID, id)
		}
	}
}
