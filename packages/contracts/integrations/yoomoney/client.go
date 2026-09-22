package yoomoney

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

const liveAPIBase = "https://api.yookassa.ru/v3"

// Client is a ЮKassa adapter: in-memory sandbox by default, or live HTTP when
// credentials are provided via NewLiveClient / NewClientFromEnv.
type Client struct {
	mu       sync.Mutex
	shopID   string
	secret   string
	live     bool
	http     *http.Client
	apiBase  string
	payments map[string]*PaymentState
}

type PaymentState struct {
	ID              string
	IdempotencyKey  string
	AmountMinor     int64
	Currency        string
	Description     string
	Status          string
	ConfirmationURL string
	ReturnURL       string
	CreatedAt       time.Time
}

type CreatePaymentInput struct {
	IdempotencyKey string
	AmountMinor    int64
	Currency       string
	Description    string
	ReturnURL      string
	ReceiptEmail   string
}

type CreatePaymentResult struct {
	ID              string
	Status          string
	ConfirmationURL string
}

func NewClient(shopID, secret string) *Client {
	return &Client{
		shopID:   shopID,
		secret:   secret,
		live:     false,
		payments: make(map[string]*PaymentState),
		http:     &http.Client{Timeout: 20 * time.Second},
		apiBase:  liveAPIBase,
	}
}

// NewLiveClient talks to api.yookassa.ru with Basic auth (shopId:secretKey).
func NewLiveClient(shopID, secret string) *Client {
	c := NewClient(shopID, secret)
	c.live = true
	return c
}

// NewClientFromEnv returns a live client when YOOKASSA_SHOP_ID and
// YOOKASSA_SECRET_KEY are both non-empty; otherwise the local sandbox.
func NewClientFromEnv() *Client {
	shop := strings.TrimSpace(os.Getenv("YOOKASSA_SHOP_ID"))
	secret := strings.TrimSpace(os.Getenv("YOOKASSA_SECRET_KEY"))
	if shop != "" && secret != "" {
		return NewLiveClient(shop, secret)
	}
	return NewClient("sandbox-shop", "sandbox-secret")
}

func (c *Client) IsLive() bool {
	return c != nil && c.live
}

func (c *Client) CreatePayment(in CreatePaymentInput) (CreatePaymentResult, error) {
	if in.IdempotencyKey == "" {
		return CreatePaymentResult{}, fmt.Errorf("idempotencyKey required")
	}
	if in.AmountMinor <= 0 {
		return CreatePaymentResult{}, fmt.Errorf("amount must be positive")
	}
	if c.live {
		return c.createPaymentLive(in)
	}
	return c.createPaymentSandbox(in)
}

func (c *Client) createPaymentSandbox(in CreatePaymentInput) (CreatePaymentResult, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	for _, p := range c.payments {
		if p.IdempotencyKey == in.IdempotencyKey {
			return CreatePaymentResult{
				ID:              p.ID,
				Status:          p.Status,
				ConfirmationURL: p.ConfirmationURL,
			}, nil
		}
	}
	id := "yk-" + randomHex(8)
	url := fmt.Sprintf("https://yoomoney.ru/checkout/sandbox/%s", id)
	currency := in.Currency
	if currency == "" {
		currency = "RUB"
	}
	p := &PaymentState{
		ID:              id,
		IdempotencyKey:  in.IdempotencyKey,
		AmountMinor:     in.AmountMinor,
		Currency:        currency,
		Description:     in.Description,
		Status:          "pending",
		ConfirmationURL: url,
		ReturnURL:       in.ReturnURL,
		CreatedAt:       time.Now().UTC(),
	}
	c.payments[id] = p
	return CreatePaymentResult{ID: id, Status: p.Status, ConfirmationURL: url}, nil
}

func (c *Client) createPaymentLive(in CreatePaymentInput) (CreatePaymentResult, error) {
	currency := in.Currency
	if currency == "" {
		currency = "RUB"
	}
	value := fmt.Sprintf("%d.%02d", in.AmountMinor/100, in.AmountMinor%100)
	payload := map[string]any{
		"amount": map[string]string{
			"value":    value,
			"currency": currency,
		},
		"capture": true,
		"confirmation": map[string]string{
			"type":        "redirect",
			"return_url":  in.ReturnURL,
		},
		"description": in.Description,
	}
	if in.ReceiptEmail != "" {
		payload["receipt"] = map[string]any{
			"customer": map[string]string{"email": in.ReceiptEmail},
			"items": []map[string]any{{
				"description": in.Description,
				"quantity":    "1.00",
				"amount":      map[string]string{"value": value, "currency": currency},
				"vat_code":    1,
			}},
		}
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return CreatePaymentResult{}, err
	}
	req, err := http.NewRequest(http.MethodPost, c.apiBase+"/payments", bytes.NewReader(body))
	if err != nil {
		return CreatePaymentResult{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Idempotence-Key", in.IdempotencyKey)
	req.Header.Set("Authorization", "Basic "+basicAuth(c.shopID, c.secret))

	res, err := c.http.Do(req)
	if err != nil {
		return CreatePaymentResult{}, err
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return CreatePaymentResult{}, fmt.Errorf("yookassa create payment: %s: %s", res.Status, truncate(string(raw), 400))
	}
	var parsed struct {
		ID           string `json:"id"`
		Status       string `json:"status"`
		Confirmation struct {
			ConfirmationURL string `json:"confirmation_url"`
		} `json:"confirmation"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return CreatePaymentResult{}, err
	}
	if parsed.ID == "" {
		return CreatePaymentResult{}, fmt.Errorf("yookassa: empty payment id")
	}
	c.mu.Lock()
	c.payments[parsed.ID] = &PaymentState{
		ID:              parsed.ID,
		IdempotencyKey:  in.IdempotencyKey,
		AmountMinor:     in.AmountMinor,
		Currency:        currency,
		Description:     in.Description,
		Status:          parsed.Status,
		ConfirmationURL: parsed.Confirmation.ConfirmationURL,
		ReturnURL:       in.ReturnURL,
		CreatedAt:       time.Now().UTC(),
	}
	c.mu.Unlock()
	return CreatePaymentResult{
		ID:              parsed.ID,
		Status:          parsed.Status,
		ConfirmationURL: parsed.Confirmation.ConfirmationURL,
	}, nil
}

// ConfirmSucceeded marks a payment succeeded (sandbox) or verifies live status via API.
func (c *Client) ConfirmSucceeded(providerPaymentID string) (string, error) {
	if c.live {
		return c.confirmLive(providerPaymentID)
	}
	return c.SimulateWebhook(providerPaymentID)
}

func (c *Client) SimulateWebhook(providerPaymentID string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	p, ok := c.payments[providerPaymentID]
	if !ok {
		return "", fmt.Errorf("payment not found")
	}
	if p.Status == "succeeded" {
		return p.Status, nil
	}
	p.Status = "succeeded"
	return p.Status, nil
}

func (c *Client) confirmLive(providerPaymentID string) (string, error) {
	req, err := http.NewRequest(http.MethodGet, c.apiBase+"/payments/"+providerPaymentID, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Basic "+basicAuth(c.shopID, c.secret))
	res, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return "", fmt.Errorf("yookassa get payment: %s: %s", res.Status, truncate(string(raw), 400))
	}
	var parsed struct {
		ID     string `json:"id"`
		Status string `json:"status"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", err
	}
	if parsed.Status != "succeeded" {
		return parsed.Status, fmt.Errorf("payment status is %s", parsed.Status)
	}
	c.mu.Lock()
	if p, ok := c.payments[providerPaymentID]; ok {
		p.Status = "succeeded"
	} else {
		c.payments[providerPaymentID] = &PaymentState{
			ID: providerPaymentID, Status: "succeeded", CreatedAt: time.Now().UTC(),
		}
	}
	c.mu.Unlock()
	return parsed.Status, nil
}

func (c *Client) GetPayment(providerPaymentID string) (*PaymentState, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	p, ok := c.payments[providerPaymentID]
	if !ok {
		return nil, false
	}
	cp := *p
	return &cp, true
}

func (c *Client) Refund(providerPaymentID string, amountMinor int64) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	p, ok := c.payments[providerPaymentID]
	if !ok {
		return fmt.Errorf("payment not found")
	}
	if p.Status != "succeeded" {
		return fmt.Errorf("payment not succeeded")
	}
	if amountMinor <= 0 || amountMinor > p.AmountMinor {
		return fmt.Errorf("invalid refund amount")
	}
	p.Status = "refunded"
	return nil
}

func (c *Client) CreateRecurringPayment(in CreatePaymentInput, savedMethodID string) (CreatePaymentResult, error) {
	res, err := c.CreatePayment(in)
	if err != nil {
		return res, err
	}
	_ = savedMethodID
	return res, nil
}

func basicAuth(user, pass string) string {
	return base64.StdEncoding.EncodeToString([]byte(user + ":" + pass))
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
