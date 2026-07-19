package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"strconv"

	"github.com/masterofsword/support-chat/internal/infra/config"
	_ "github.com/lib/pq"
	"github.com/pressly/goose/v3"
)

func main() {
	var (
		configPath     = flag.String("config", "configs/values.yml", "path to config file")
		migrationsPath = flag.String("migrations", "db/migrations", "path to migrations directory")
		command        = flag.String("cmd", "up", "migrate command (up/create)")
		migrationName  = flag.String("name", "", "migration name for create command")
	)
	flag.Parse()

	// Load config using existing config system
	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// Setup logger using existing config pattern
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: cfg.Logger.Level(),
	}))

	logger.Info("Starting migration", "command", *command, "migrations_path", *migrationsPath)

	port, err := strconv.Atoi(cfg.Postgresql.DbPort)
	if err != nil {
		logger.Error("Failed to convert port to int", "error", err)
		os.Exit(1)
	}

	databaseURL := fmt.Sprintf("user=%s password=%s host=%s port=%d dbname=%s sslmode=disable",
		cfg.Postgresql.Username,
		cfg.Postgresql.Password,
		cfg.Postgresql.DbHost,
		port,
		cfg.Postgresql.DbName,
	)

	// Open database connection
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		logger.Error("Failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		logger.Error("Failed to ping database", "error", err)
		os.Exit(1)
	}

	logger.Info("Database connection established")

	// Set goose dialect
	if err := goose.SetDialect("postgres"); err != nil {
		logger.Error("Failed to set goose dialect", "error", err)
		os.Exit(1)
	}

	// Execute migration command
	switch *command {
	case "up":
		logger.Info("Running migrations up")
		err = goose.Up(db, *migrationsPath)
	case "create":
		if *migrationName == "" {
			logger.Error("Name flag is required for create command")
			os.Exit(1)
		}
		logger.Info("Creating new migration", "name", *migrationName)
		err = goose.Create(db, *migrationsPath, *migrationName, "sql")
	default:
		logger.Error("Unknown command", "command", *command)
		logger.Info("Available commands: up, create")
		os.Exit(1)
	}

	if err != nil {
		logger.Error("Migration failed", "error", err, "command", *command)
		os.Exit(1)
	}

	logger.Info("Migration completed successfully", "command", *command)
}
