package main

import (
	"flag"
	"log"

	app2 "github.com/masterofsword/support-chat/internal/app"
)

func main() {
	var (
		configPath = flag.String("config", "configs/values.yml", "path to config file")
	)
	flag.Parse()

	app, err := app2.NewApp(*configPath)
	if err != nil {
		log.Fatalln("Failed to create app:", err)
	}

	log.Println("Starting servers...")
	if err := app.Run(); err != nil {
		log.Fatalln("Application error:", err)
	}
}
