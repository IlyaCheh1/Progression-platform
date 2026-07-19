package postgres

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool(ctx context.Context, logger *slog.Logger, url string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(url)
	if err != nil {
		logger.Error("failed to parse pgxpool config", "error", err, "url", url)
		return nil, fmt.Errorf("pgxpool.ParseConfig: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		logger.Error("failed to create pgxpool", "error", err)
		return nil, fmt.Errorf("pgxpool.NewWithConfig: %w", err)
	}

	logger.Info("postgres pool created successfully")
	return pool, nil
}

func NewPools(ctx context.Context, logger *slog.Logger, masterDSN string, replicaDSN string) (*pgxpool.Pool, *pgxpool.Pool, error) {
	masterConfig, err := pgxpool.ParseConfig(masterDSN)
	if err != nil {
		logger.Error("failed to parse master pgxpool config", "error", err, "dsn", masterDSN)
		return nil, nil, fmt.Errorf("pgxpool.ParseConfigMaster: %w", err)
	}

	masterPool, err := pgxpool.NewWithConfig(ctx, masterConfig)
	if err != nil {
		logger.Error("failed to create master pgxpool", "error", err)
		return nil, nil, fmt.Errorf("pgxpool.NewWithConfigMaster: %w", err)
	}

	replicaConfig, err := pgxpool.ParseConfig(replicaDSN)
	if err != nil {
		logger.Error("failed to parse replica pgxpool config", "error", err, "dsn", replicaDSN)
		return nil, nil, fmt.Errorf("pgxpool.ParseConfigReplica: %w", err)
	}

	replicaPool, err := pgxpool.NewWithConfig(ctx, replicaConfig)
	if err != nil {
		logger.Error("failed to create replica pgxpool", "error", err)
		return nil, nil, fmt.Errorf("pgxpool.NewWithConfigReplica: %w", err)
	}

	logger.Info("postgres pools created successfully", "master_dsn", masterDSN, "replica_dsn", replicaDSN)
	return masterPool, replicaPool, nil
}
