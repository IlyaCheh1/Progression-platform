package main

import (
	"log"
	"os"
	"time"

	"github.com/masterofsword/contracts/persist"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Println("platform-worker: DATABASE_URL not set — sleeping (set DATABASE_URL to drain shared outbox)")
		for {
			time.Sleep(time.Minute)
		}
	}
	log.Println("platform-worker started — draining postgres outbox.events")
	for {
		n, err := persist.DrainPostgresOutbox(dsn, 100)
		if err != nil {
			log.Printf("drain error: %v", err)
		} else if n > 0 {
			log.Printf("published %d events", n)
		}
		time.Sleep(2 * time.Second)
	}
}
