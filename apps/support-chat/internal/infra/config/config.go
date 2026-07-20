package config

import (
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"

	"github.com/knadh/koanf/parsers/yaml"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/v2"
)

type Config struct {
	Logger LoggerConfig `koanf:"logger"`
	Server struct {
		OpenAPI  ServerConfig `koanf:"openapi"`
		Internal ServerConfig `koanf:"internal"`
	} `koanf:"server"`
	Postgresql PostgresqlConfig `koanf:"postgresql"`
	Telegram   TelegramConfig   `koanf:"telegram"`
	Storage    StorageConfig    `koanf:"storage"`
	WebSocket  WebSocketConfig  `koanf:"websocket"`
}

type PostgresqlConfig struct {
	Username string `koanf:"username"`
	Password string `koanf:"password"`
	DbName   string `koanf:"db_name"`
	DbHost   string `koanf:"db_host"`
	DbPort   string `koanf:"db_port"`
}

type LoggerConfig struct {
	// LogLevel possible values: debug, info, warn, error
	LogLevel string `koanf:"level"`
}

type ServerConfig struct {
	Host string `koanf:"host"`
	Port string `koanf:"port"`
}

type TelegramConfig struct {
	BotToken      string `koanf:"bot_token"`
	SupportChatID int64  `koanf:"support_chat_id"`
	WebhookSecret string `koanf:"webhook_secret"`
	APIBaseURL    string `koanf:"api_base_url"`
	PublicBaseURL string `koanf:"public_base_url"`
}

type StorageConfig struct {
	AccessKey    string   `koanf:"access_key"`
	SecretKey    string   `koanf:"secret_key"`
	Bucket       string   `koanf:"bucket"`
	Endpoint     string   `koanf:"endpoint"`
	Region       string   `koanf:"region"`
	MaxFileSize  int64    `koanf:"max_file_size"`
	PresignedTTL int      `koanf:"presigned_ttl"`
	AllowedTypes []string `koanf:"allowed_types"`
}

type WebSocketConfig struct {
	PingInterval    int `koanf:"ping_interval"`     // Seconds between ping messages
	PongTimeout     int `koanf:"pong_timeout"`      // Seconds to wait for pong response
	ReadBufferSize  int `koanf:"read_buffer_size"`  // WebSocket read buffer size
	WriteBufferSize int `koanf:"write_buffer_size"` // WebSocket write buffer size
	MessageBuffer   int `koanf:"message_buffer"`    // Size of the message buffer channel
}

func (s *ServerConfig) Address() string {
	return fmt.Sprintf("%s:%s", s.Host, s.Port)
}

func (c *LoggerConfig) Level() slog.Level {
	switch strings.ToLower(c.LogLevel) {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func (c *TelegramConfig) IsConfigured() bool {
	return strings.TrimSpace(c.BotToken) != "" && c.SupportChatID != 0
}

func LoadConfig(filename string) (Config, error) {
	// Set default values
	cfg := Config{
		WebSocket: WebSocketConfig{
			PingInterval:    30,   // 30 seconds
			PongTimeout:     60,   // 60 seconds
			ReadBufferSize:  1024, // 1KB
			WriteBufferSize: 1024, // 1KB
			MessageBuffer:   256,  // 256 messages
		},
	}

	k := koanf.New(".")

	if err := k.Load(file.Provider(filename), yaml.Parser()); err != nil {
		return Config{}, fmt.Errorf("failed to load config file %s: %w", filename, err)
	}

	_ = k.Load(file.Provider("config.local.yml"), yaml.Parser())

	_ = k.Load(env.Provider("OGC", "__", func(s string) string {
		s = strings.TrimPrefix(s, "OGC_")
		return strings.ToLower(s)
	}), nil)

	if err := k.Unmarshal("", &cfg); err != nil {
		return Config{}, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	applyTelegramEnvOverrides(&cfg)

	return cfg, nil
}

// applyTelegramEnvOverrides re-reads Telegram settings from the process environment.
// This is intentional: Coolify/env values are always strings, may include quotes/spaces,
// and nested koanf keys are easy to mis-name (OGC_TELEGRAM_* vs OGC_TELEGRAM__*).
func applyTelegramEnvOverrides(cfg *Config) {
	if v := firstNonEmptyEnv("OGC_TELEGRAM__BOT_TOKEN", "OGC_TELEGRAM_BOT_TOKEN"); v != "" {
		cfg.Telegram.BotToken = sanitizeEnvValue(v)
	}
	if v := firstNonEmptyEnv("OGC_TELEGRAM__WEBHOOK_SECRET", "OGC_TELEGRAM_WEBHOOK_SECRET"); v != "" {
		cfg.Telegram.WebhookSecret = sanitizeEnvValue(v)
	}
	if v := firstNonEmptyEnv("OGC_TELEGRAM__PUBLIC_BASE_URL", "OGC_TELEGRAM_PUBLIC_BASE_URL"); v != "" {
		cfg.Telegram.PublicBaseURL = strings.TrimRight(sanitizeEnvValue(v), "/")
	}
	if v := firstNonEmptyEnv("OGC_TELEGRAM__API_BASE_URL", "OGC_TELEGRAM_API_BASE_URL"); v != "" {
		cfg.Telegram.APIBaseURL = strings.TrimRight(sanitizeEnvValue(v), "/")
	}
	if v := firstNonEmptyEnv("OGC_TELEGRAM__SUPPORT_CHAT_ID", "OGC_TELEGRAM_SUPPORT_CHAT_ID"); v != "" {
		parsed, err := strconv.ParseInt(sanitizeEnvValue(v), 10, 64)
		if err == nil {
			cfg.Telegram.SupportChatID = parsed
		}
	}
}

func sanitizeEnvValue(v string) string {
	v = strings.TrimSpace(v)
	if len(v) >= 2 {
		if (v[0] == '"' && v[len(v)-1] == '"') || (v[0] == '\'' && v[len(v)-1] == '\'') {
			v = strings.TrimSpace(v[1 : len(v)-1])
		}
	}
	return v
}

func firstNonEmptyEnv(keys ...string) string {
	for _, key := range keys {
		if v := strings.TrimSpace(os.Getenv(key)); v != "" {
			return v
		}
	}
	return ""
}
