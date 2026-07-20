package app

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"strings"
	"syscall"
	"time"

	tadapter "github.com/masterofsword/support-chat/internal/adapter/telegram"
	tclient "github.com/masterofsword/support-chat/internal/adapter/telegram/client"
	http2 "github.com/masterofsword/support-chat/internal/api/http"
	"github.com/masterofsword/support-chat/internal/api/http/generated"
	"github.com/masterofsword/support-chat/internal/api/ws"
	"github.com/masterofsword/support-chat/internal/app/attachment"
	"github.com/masterofsword/support-chat/internal/app/conversation"
	"github.com/masterofsword/support-chat/internal/app/message"
	"github.com/masterofsword/support-chat/internal/app/telegram"
	attachservice "github.com/masterofsword/support-chat/internal/domain/attachment/service"
	convservice "github.com/masterofsword/support-chat/internal/domain/conversation/service"
	messservice "github.com/masterofsword/support-chat/internal/domain/message/service"
	userservice "github.com/masterofsword/support-chat/internal/domain/user/service"
	"github.com/masterofsword/support-chat/internal/infra/config"
	postgres "github.com/masterofsword/support-chat/internal/infra/db"
	"github.com/masterofsword/support-chat/internal/infra/db/repo"
	"github.com/masterofsword/support-chat/internal/infra/storage"
	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	config         *config.Config
	logger         *slog.Logger
	openAPIServer  *http.Server
	internalServer *http.Server
	dbPool         *pgxpool.Pool
	ctx            context.Context
	strictHandler  generated.ServerInterface
	wsServer       *ws.WebSocketServer
}

func NewApp(configPath string) (*App, error) {
	cfg, err := config.LoadConfig(configPath)
	if err != nil {
		return nil, fmt.Errorf("cfg.LoadConfig: %w", err)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: cfg.Logger.Level(),
	}))

	logger.Info("telegram config loaded",
		"configured", cfg.Telegram.IsConfigured(),
		"support_chat_id", cfg.Telegram.SupportChatID,
		"bot_token_set", cfg.Telegram.BotToken != "",
		"webhook_secret_set", cfg.Telegram.WebhookSecret != "",
		"public_base_url", cfg.Telegram.PublicBaseURL,
		"api_base_url", cfg.Telegram.APIBaseURL,
	)
	if !cfg.Telegram.IsConfigured() {
		logger.Warn("telegram delivery disabled: set OGC_TELEGRAM__BOT_TOKEN and OGC_TELEGRAM__SUPPORT_CHAT_ID")
	}

	ctx := context.Background()

	masterUrl := generatePgConnectionUrl(&cfg, logger, false)

	masterPool, err := postgres.NewPool(ctx, logger, masterUrl)
	if err != nil {
		logger.Error("failed to create pgxpool", "error", err)
		return nil, fmt.Errorf("postgres.NewPool: %w", err)
	}

	logger.Info("database pool created, connection will be tested on startup")

	// Repositories
	convRepo := repo.NewSQLCConversationRepo(masterPool)
	userRepo := repo.NewSQLCUserRepo(masterPool)
	messageRepo := repo.NewSQLCMessageRepo(masterPool)
	attachmentRepo := repo.NewSQLCAttachmentRepo(masterPool)

	// Transaction manager
	txManager := postgres.NewTxManager(masterPool)

	// Domain services
	convDomainService := convservice.NewConversationDomainService(convRepo, txManager, logger)
	userDomainService := userservice.NewUserDomainService(userRepo, txManager, logger)
	messDomainService := messservice.NewMessageDomainService(messageRepo, attachmentRepo, txManager, logger)
	attachDomainService := attachservice.NewAttachmentDomainService(attachmentRepo, txManager, logger)

	// Create S3 client for attachment service
	s3Client, err := storage.NewS3Client(ctx, cfg.Storage, logger)
	if err != nil {
		logger.Error("failed to create S3 client", "error", err)
		return nil, fmt.Errorf("failed to create S3 client: %w", err)
	}

	// Application services (create attachment service first for telegram adapter)
	attachAppService := attachment.NewAppService(attachDomainService, s3Client, cfg.Storage, logger)

	// Adapters (need attachment service for telegram adapter)
	tClient := tclient.NewTelegramBotClient(&cfg.Telegram, logger)
	tAdapter := tadapter.NewTelegramAdapter(tClient, attachAppService, &cfg.Telegram, logger)
	wsServer := ws.NewWebSocketServer(logger, nil, attachAppService, cfg.WebSocket)
	tAppService := telegram.NewAppService(tAdapter, convDomainService, messDomainService, userDomainService, wsServer, wsServer, &cfg.Telegram, logger)
	convAppService := conversation.NewAppService(convDomainService, userDomainService, tAppService, logger)
	messageAppService := message.NewAppService(messDomainService, convDomainService, wsServer, tAppService, attachAppService, logger)
	wsServer.SetMessageAppService(messageAppService)

	// Use only the HTTP handler for generated API routes
	httpApiHandler := http2.NewHttpApiHandler(logger, convAppService, messageAppService, tAppService, attachAppService)
	strictHandler := generated.NewStrictHandler(httpApiHandler, []generated.StrictMiddlewareFunc{})

	app := &App{
		config:        &cfg,
		logger:        logger,
		ctx:           ctx,
		dbPool:        masterPool,
		strictHandler: strictHandler,
		wsServer:      wsServer,
	}

	app.openAPIServer = &http.Server{
		Addr:    cfg.Server.OpenAPI.Address(),
		Handler: app.setupOpenAPIRoutes(),
	}

	app.internalServer = &http.Server{
		Addr:    cfg.Server.Internal.Address(),
		Handler: app.setupInternalRoutes(),
	}

	logger.Info("App initialized", "openapi_addr", cfg.Server.OpenAPI.Address(), "internal_addr", cfg.Server.Internal.Address())
	return app, nil
}

func (a *App) setupOpenAPIRoutes() http.Handler {
	a.logger.Info("Setting up OpenAPI routes")
	mux := http.NewServeMux()

	mux.HandleFunc("/health", a.healthHandler)
	mux.HandleFunc("/ready", a.readinessHandler)
	mux.HandleFunc("/api/v1/messages/ws", http.HandlerFunc(a.wsServer.HandleWebSocket))
	a.logger.Info("WebSocket route registered", "path", "/api/v1/messages/ws")

	// Add generated API routes
	handler := generated.HandlerFromMux(a.strictHandler, mux)
	a.logger.Info("OpenAPI routes registered")

	return a.corsMiddleware(a.loggingMiddleware(a.contextMiddleware(handler)))
}

func (a *App) setupInternalRoutes() http.Handler {
	a.logger.Info("Setting up internal routes")
	mux := http.NewServeMux()

	mux.HandleFunc("/health", a.healthHandler)
	mux.HandleFunc("/ready", a.readinessHandler)
	handler := generated.HandlerFromMux(a.strictHandler, mux)

	// Add WebSocket endpoint without auth
	mux.HandleFunc("/api/v1/messages/ws", http.HandlerFunc(a.wsServer.HandleWebSocket))
	a.logger.Info("WebSocket route registered", "path", "/api/v1/messages/ws")

	a.logger.Info("Internal routes registered", "health", "/health", "ready", "/ready")
	return a.corsMiddleware(a.loggingMiddleware(a.contextMiddleware(handler)))
}

func (a *App) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (a *App) healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(fmt.Sprintf(
		`{"ok":true,"telegram_configured":%t,"support_chat_id":%d,"bot_token_set":%t,"webhook_secret_set":%t}`,
		a.config.Telegram.IsConfigured(),
		a.config.Telegram.SupportChatID,
		a.config.Telegram.BotToken != "",
		a.config.Telegram.WebhookSecret != "",
	)))
}

func (a *App) readinessHandler(w http.ResponseWriter, r *http.Request) {
	// Check database connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := a.dbPool.Ping(ctx); err != nil {
		a.logger.Error("database health check failed", "error", err)
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (a *App) loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Пропускаем логгирование для технических эндпоинтов
		if r.URL.Path == "/health" || r.URL.Path == "/ready" {
			next.ServeHTTP(w, r)
			return
		}

		start := time.Now()
		a.logger.Info("HTTP request",
			"method", r.Method,
			"path", r.URL.Path,
			"query", r.URL.RawQuery,
			"remote_addr", r.RemoteAddr,
			"user_agent", r.Header.Get("User-Agent"))

		next.ServeHTTP(w, r)

		duration := time.Since(start)
		a.logger.Info("HTTP response",
			"method", r.Method,
			"path", r.URL.Path,
			"duration_ms", duration.Milliseconds())
	})
}

func (a *App) contextMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Add HTTP request and writer to context for WebSocket upgrade
		ctx := context.WithValue(r.Context(), "http_request", r)
		ctx = context.WithValue(ctx, "http_writer", w)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}

func generatePgConnectionUrl(cfg *config.Config, logger *slog.Logger, defaultSchemeType bool) string {
	var masterDsn string
	if defaultSchemeType {
		masterDsn = fmt.Sprintf("postgresql://%s:%s@%s:%s/%s?sslmode=disable",
			cfg.Postgresql.Username,
			cfg.Postgresql.Password,
			cfg.Postgresql.DbHost,
			cfg.Postgresql.DbPort,
			cfg.Postgresql.DbName,
		)
	} else {
		port, err := strconv.Atoi(cfg.Postgresql.DbPort)
		if err != nil {
			logger.Error("failed to convert port to int", "error", err)
		}
		masterDsn = fmt.Sprintf("user=%s password=%s host=%s port=%d dbname=%s",
			cfg.Postgresql.Username,
			cfg.Postgresql.Password,
			cfg.Postgresql.DbHost,
			port,
			cfg.Postgresql.DbName,
		)
	}
	return masterDsn
}

func (a *App) registerTelegramWebhook() {
	cfg := a.config.Telegram
	if cfg.PublicBaseURL == "" || cfg.BotToken == "" || cfg.WebhookSecret == "" {
		a.logger.Info("telegram webhook auto-register skipped",
			"public_base_url_set", cfg.PublicBaseURL != "",
			"bot_token_set", cfg.BotToken != "",
			"webhook_secret_set", cfg.WebhookSecret != "")
		return
	}

	webhookURL := fmt.Sprintf("%s/integrations/telegram/webhook/%s",
		strings.TrimRight(cfg.PublicBaseURL, "/"),
		cfg.WebhookSecret,
	)

	ctx, cancel := context.WithTimeout(a.ctx, 15*time.Second)
	defer cancel()

	client := tclient.NewTelegramBotClient(&cfg, a.logger)
	if err := client.SetWebhook(ctx, webhookURL); err != nil {
		a.logger.Error("failed to register telegram webhook", "error", err, "url", webhookURL)
		return
	}
}

func (a *App) Run() error {
	// Test database connection before starting servers
	if err := a.dbPool.Ping(a.ctx); err != nil {
		a.logger.Error("failed to connect to database on startup", "error", err)
		return fmt.Errorf("database connection failed: %w", err)
	}
	a.logger.Info("database connection verified successfully")

	a.registerTelegramWebhook()

	var wg sync.WaitGroup
	errChan := make(chan error, 3)

	// Start OpenApi server
	wg.Add(1)
	go func() {
		defer wg.Done()
		a.logger.Info("Starting OpenAPI server", "addr", a.openAPIServer.Addr)
		if err := a.openAPIServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errChan <- fmt.Errorf("openapi server error: %w", err)
		}
	}()

	// Start Internal server
	wg.Add(1)
	go func() {
		defer wg.Done()
		a.logger.Info("Starting Internal server", "addr", a.internalServer.Addr)
		if err := a.internalServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errChan <- fmt.Errorf("internal server error: %w", err)
		}
	}()

	// Start database health monitor
	wg.Add(1)
	go func() {
		defer wg.Done()
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				ctx, cancel := context.WithTimeout(a.ctx, 5*time.Second)
				if err := a.dbPool.Ping(ctx); err != nil {
					a.logger.Error("database health check failed", "error", err)
					cancel()
					errChan <- fmt.Errorf("database connection lost: %w", err)
					return
				}
				cancel()
				a.logger.Debug("database health check passed")
			case <-a.ctx.Done():
				return
			}
		}
	}()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errChan:
		a.logger.Error("Server error", "error", err)
		return err
	case sig := <-sigChan:
		a.logger.Info("Received signal, shutting down", "signal", sig)
		return a.Shutdown()
	}
}

func (a *App) Shutdown() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	a.logger.Info("Shutting down servers...")

	var wg sync.WaitGroup
	errChan := make(chan error, 2)

	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := a.openAPIServer.Shutdown(ctx); err != nil {
			errChan <- fmt.Errorf("openapi server shutdown error: %w", err)
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := a.internalServer.Shutdown(ctx); err != nil {
			errChan <- fmt.Errorf("internal server shutdown error: %w", err)
		}
	}()

	wg.Wait()
	close(errChan)

	for err := range errChan {
		a.logger.Error("Shutdown error", "error", err)
		return err
	}

	// Close database connection
	if a.dbPool != nil {
		a.dbPool.Close()
		a.logger.Info("Database connection closed")
	}

	a.logger.Info("All servers stopped gracefully")
	return nil
}
