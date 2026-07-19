package engines

// ProcessUnpublishedOutbox marks unpublished events as published.
// In the modular monolith MVP, Reward/Progression side effects run synchronously;
// the worker drains the outbox for observability and future async consumers.
func (p *Platform) ProcessUnpublishedOutbox() int {
	entries := p.OutboxUnpublished()
	for _, e := range entries {
		p.MarkOutboxPublished(e.ID)
	}
	return len(entries)
}
