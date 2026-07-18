package main

import (
	"log"
	"time"
)

// Platform worker placeholder: drains outbox, runs timers, reward fulfillment.
func main() {
	log.Println("platform-worker started (local stub) — poll outbox every 2s")
	for {
		time.Sleep(2 * time.Second)
	}
}
