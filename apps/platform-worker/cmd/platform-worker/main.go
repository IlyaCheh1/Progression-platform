package main

import (
	"log"
	"time"

	"github.com/masterofsword/contracts/engines"
)

func main() {
	p := engines.NewPlatform()
	log.Println("platform-worker started — draining in-process outbox (Postgres outbox when DATABASE_URL is set)")
	for {
		n := p.ProcessUnpublishedOutbox()
		if n > 0 {
			log.Printf("marked %d outbox entries published", n)
		}
		time.Sleep(2 * time.Second)
	}
}
