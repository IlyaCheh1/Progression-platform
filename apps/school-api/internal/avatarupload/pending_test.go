package avatarupload

import "testing"

func TestNormalizeMIME(t *testing.T) {
	mime, ext, ok := NormalizeMIME("image/png")
	if !ok || mime != "image/png" || ext != ".png" {
		t.Fatalf("png: mime=%q ext=%q ok=%v", mime, ext, ok)
	}
	mime, ext, ok = NormalizeMIME("image/jpg")
	if !ok || mime != "image/jpeg" || ext != ".jpg" {
		t.Fatalf("jpg: mime=%q ext=%q ok=%v", mime, ext, ok)
	}
	if _, _, ok := NormalizeMIME("application/pdf"); ok {
		t.Fatal("expected pdf rejected")
	}
}

func TestRegistryOwnerTake(t *testing.T) {
	r := NewRegistry()
	id := r.Put("student-a", "media/avatars/student-a/x.webp", "image/webp")
	if _, ok := r.Take(id, "student-b"); ok {
		t.Fatal("other student must not take pending upload")
	}
	p, ok := r.Take(id, "student-a")
	if !ok || p.Key != "media/avatars/student-a/x.webp" {
		t.Fatalf("owner take failed: ok=%v key=%q", ok, p.Key)
	}
	if _, ok := r.Take(id, "student-a"); ok {
		t.Fatal("pending must be single-use")
	}
}
