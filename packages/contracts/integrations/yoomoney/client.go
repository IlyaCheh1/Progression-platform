package yoomoney

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"time"
)

// Client is a sandbox YooKassa stand-in for local/dev (no network calls).
type Client struct {
	mu       sync.Mutex
	shopID   string
	secret   string
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
		payments: make(map[string]*PaymentState),
	}
}

func (c *Client) CreatePayment(in CreatePaymentInput) (CreatePaymentResult, error) {
	if in.IdempotencyKey == "" {
		return CreatePaymentResult{}, fmt.Errorf("idempotencyKey required")
	}
	if in.AmountMinor <= 0 {
		return CreatePaymentResult{}, fmt.Errorf("amount must be positive")
	}
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
	p := &PaymentState{
		ID:              id,
		IdempotencyKey:  in.IdempotencyKey,
		AmountMinor:     in.AmountMinor,
		Currency:        in.Currency,
		Description:     in.Description,
		Status:          "pending",
		ConfirmationURL: url,
		ReturnURL:       in.ReturnURL,
		CreatedAt:       time.Now().UTC(),
	}
	c.payments[id] = p
	return CreatePaymentResult{ID: id, Status: p.Status, ConfirmationURL: url}, nil
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

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
