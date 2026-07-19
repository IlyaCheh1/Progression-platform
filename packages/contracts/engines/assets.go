package engines

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// AssetRevision tracks image asset review before bundle publish (E2E-17 stub).
type AssetRevision struct {
	ID        string    `json:"id"`
	ItemKey   string    `json:"itemKey"`
	ImageURL  string    `json:"imageUrl"`
	Status    string    `json:"status"`
	Note      string    `json:"note,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CreateAssetRevision stages a generated asset for human review.
func (p *Platform) CreateAssetRevision(itemKey, imageURL string) (*AssetRevision, error) {
	itemKey = trim(itemKey)
	imageURL = trim(imageURL)
	if itemKey == "" || imageURL == "" {
		return nil, fmt.Errorf("item_key_and_image_required")
	}
	now := time.Now().UTC()
	r := &AssetRevision{
		ID: uuid.NewString(), ItemKey: itemKey, ImageURL: imageURL,
		Status: "review", CreatedAt: now, UpdatedAt: now,
	}
	p.mu.Lock()
	p.assetRevisions[r.ID] = r
	p.mu.Unlock()
	return r, nil
}

// ListAssetRevisions returns staged assets, optionally filtered by status.
func (p *Platform) ListAssetRevisions(status string) []AssetRevision {
	p.mu.Lock()
	defer p.mu.Unlock()
	out := make([]AssetRevision, 0, len(p.assetRevisions))
	for _, r := range p.assetRevisions {
		if status == "" || r.Status == status {
			out = append(out, *r)
		}
	}
	return out
}

// DecideAssetRevision approves or rejects a revision.
func (p *Platform) DecideAssetRevision(id, decision, note string) (*AssetRevision, error) {
	if decision != "approved" && decision != "rejected" {
		return nil, fmt.Errorf("invalid_decision")
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	r, ok := p.assetRevisions[id]
	if !ok {
		return nil, fmt.Errorf("not_found")
	}
	r.Status = decision
	r.Note = trim(note)
	r.UpdatedAt = time.Now().UTC()
	return r, nil
}
