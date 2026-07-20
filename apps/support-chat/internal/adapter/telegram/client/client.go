package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/masterofsword/support-chat/internal/infra/config"
)

// TelegramBotClient handles HTTP requests to Telegram Bot API
type TelegramBotClient struct {
	botToken   string
	baseURL    string
	httpClient *http.Client
	logger     *slog.Logger
}

// NewTelegramBotClient creates new Telegram Bot API client
func NewTelegramBotClient(cfg *config.TelegramConfig, logger *slog.Logger) *TelegramBotClient {
	return &TelegramBotClient{
		botToken: cfg.BotToken,
		baseURL:  cfg.APIBaseURL,
		httpClient: &http.Client{
			// Bound Bot API waits so a stuck Telegram call cannot freeze chat open/send for ~minute.
			Timeout: 10 * time.Second,
		},
		logger: logger,
	}
}

// GetMe returns the bot identity for the configured token.
func (c *TelegramBotClient) GetMe(ctx context.Context) (*GetMeResponse, error) {
	url := fmt.Sprintf("%s/bot%s/getMe", c.baseURL, c.botToken)
	var response GetMeResponse
	if err := c.makeRequest(ctx, "GET", url, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to call getMe: %w", err)
	}
	return &response, nil
}

// GetChat returns chat metadata for the support group/channel.
func (c *TelegramBotClient) GetChat(ctx context.Context, chatID int64) (*GetChatResponse, error) {
	url := fmt.Sprintf("%s/bot%s/getChat", c.baseURL, c.botToken)
	request := map[string]int64{"chat_id": chatID}
	var response GetChatResponse
	if err := c.makeRequest(ctx, "POST", url, request, &response); err != nil {
		return nil, fmt.Errorf("failed to call getChat: %w", err)
	}
	return &response, nil
}

// CreateForumTopic creates a new forum topic in supergroup
func (c *TelegramBotClient) CreateForumTopic(ctx context.Context, chatID int64, name string) (*CreateForumTopicResponse, error) {
	url := fmt.Sprintf("%s/bot%s/createForumTopic", c.baseURL, c.botToken)

	request := CreateForumTopicRequest{
		ChatID: chatID,
		Name:   name,
	}

	var response CreateForumTopicResponse
	if err := c.makeRequest(ctx, "POST", url, request, &response); err != nil {
		return nil, fmt.Errorf("failed to create forum topic: %w", err)
	}

	c.logger.Info("Created Telegram forum topic",
		"chat_id", chatID,
		"topic_name", name,
		"topic_id", response.Result.MessageThreadID)

	return &response, nil
}

// SendMessage sends message to specific chat/topic
func (c *TelegramBotClient) SendMessage(ctx context.Context, chatID int64, text string, threadID *int32) (*SendMessageResponse, error) {
	url := fmt.Sprintf("%s/bot%s/sendMessage", c.baseURL, c.botToken)

	request := SendMessageRequest{
		ChatID:          chatID,
		Text:            text,
		MessageThreadID: threadID,
	}

	var response SendMessageResponse
	if err := c.makeRequest(ctx, "POST", url, request, &response); err != nil {
		return nil, fmt.Errorf("failed to send message: %w", err)
	}

	c.logger.Debug("Sent message to Telegram", "chat_id", chatID, "thread_id", threadID)
	return &response, nil
}

// SendMediaGroup sends multiple media files as a group to specific chat/topic
func (c *TelegramBotClient) SendMediaGroup(ctx context.Context, chatID int64, media []MediaItem, threadID *int32) (*SendMediaGroupResponse, error) {
	url := fmt.Sprintf("%s/bot%s/sendMediaGroup", c.baseURL, c.botToken)

	request := SendMediaGroupRequest{
		ChatID:          chatID,
		Media:           media,
		MessageThreadID: threadID,
	}

	var response SendMediaGroupResponse
	if err := c.makeRequest(ctx, "POST", url, request, &response); err != nil {
		return nil, fmt.Errorf("failed to send media group: %w", err)
	}

	c.logger.Debug("Sent media group to Telegram", "chat_id", chatID, "thread_id", threadID, "media_count", len(media))
	return &response, nil
}

type setWebhookRequest struct {
	URL            string   `json:"url"`
	AllowedUpdates []string `json:"allowed_updates,omitempty"`
}

type setWebhookResponse struct {
	OK          bool   `json:"ok"`
	Description string `json:"description"`
}

// SetWebhook registers the bot webhook URL with Telegram.
func (c *TelegramBotClient) SetWebhook(ctx context.Context, webhookURL string) error {
	url := fmt.Sprintf("%s/bot%s/setWebhook", c.baseURL, c.botToken)
	request := setWebhookRequest{
		URL:            webhookURL,
		AllowedUpdates: []string{"message"},
	}
	var response setWebhookResponse
	if err := c.makeRequest(ctx, "POST", url, request, &response); err != nil {
		return err
	}
	if !response.OK {
		return fmt.Errorf("setWebhook failed: %s", response.Description)
	}
	c.logger.Info("Telegram webhook registered", "url", webhookURL)
	return nil
}

// makeRequest makes HTTP request to Telegram Bot API
func (c *TelegramBotClient) makeRequest(ctx context.Context, method, url string, request interface{}, response interface{}) error {
	var bodyReader *bytes.Reader
	if request != nil {
		jsonData, err := json.Marshal(request)
		if err != nil {
			return fmt.Errorf("failed to marshal request: %w", err)
		}
		bodyReader = bytes.NewReader(jsonData)
		c.logger.Debug("Making Telegram API request",
			"method", method,
			"path", telegramPathForLog(url),
			"request", string(jsonData))
	} else {
		bodyReader = bytes.NewReader(nil)
		c.logger.Debug("Making Telegram API request",
			"method", method,
			"path", telegramPathForLog(url))
	}

	httpReq, err := http.NewRequestWithContext(ctx, method, url, bodyReader)
	if err != nil {
		return fmt.Errorf("failed to create HTTP request: %w", err)
	}
	if request != nil {
		httpReq.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return fmt.Errorf("failed to read Telegram response: %w", err)
	}

	var apiStatus struct {
		OK          bool   `json:"ok"`
		Description string `json:"description"`
		ErrorCode   int    `json:"error_code"`
	}
	if err := json.Unmarshal(body, &apiStatus); err != nil {
		return fmt.Errorf("HTTP %d: invalid Telegram response: %w", resp.StatusCode, err)
	}
	if resp.StatusCode != http.StatusOK || !apiStatus.OK {
		if apiStatus.Description != "" {
			return fmt.Errorf("telegram API error: %s (http: %d, code: %d)", apiStatus.Description, resp.StatusCode, apiStatus.ErrorCode)
		}
		return fmt.Errorf("telegram API error: HTTP %d", resp.StatusCode)
	}

	if err := json.Unmarshal(body, response); err != nil {
		return fmt.Errorf("failed to decode response: %w", err)
	}

	return nil
}

func telegramPathForLog(url string) string {
	// Avoid logging the bot token.
	const marker = "/bot"
	idx := strings.Index(url, marker)
	if idx < 0 {
		return url
	}
	rest := url[idx+len(marker):]
	if slash := strings.Index(rest, "/"); slash >= 0 {
		return url[:idx+len(marker)] + "***" + rest[slash:]
	}
	return url[:idx+len(marker)] + "***"
}
