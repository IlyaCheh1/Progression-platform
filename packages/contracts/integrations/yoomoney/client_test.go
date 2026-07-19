package yoomoney_test

import (
	"testing"

	"github.com/masterofsword/contracts/integrations/yoomoney"
)

func TestCreatePaymentIdempotent(t *testing.T) {
	c := yoomoney.NewClient("shop", "secret")
	r1, err := c.CreatePayment(yoomoney.CreatePaymentInput{
		IdempotencyKey: "attempt-1",
		AmountMinor:    10000,
		Currency:       "RUB",
		Description:    "test",
	})
	if err != nil {
		t.Fatal(err)
	}
	r2, err := c.CreatePayment(yoomoney.CreatePaymentInput{
		IdempotencyKey: "attempt-1",
		AmountMinor:    10000,
		Currency:       "RUB",
		Description:    "test",
	})
	if err != nil {
		t.Fatal(err)
	}
	if r1.ID != r2.ID {
		t.Fatalf("idempotent create differ: %s vs %s", r1.ID, r2.ID)
	}
}

func TestSimulateWebhook(t *testing.T) {
	c := yoomoney.NewClient("shop", "secret")
	r, _ := c.CreatePayment(yoomoney.CreatePaymentInput{
		IdempotencyKey: "a2", AmountMinor: 500, Currency: "RUB",
	})
	st, err := c.SimulateWebhook(r.ID)
	if err != nil || st != "succeeded" {
		t.Fatalf("webhook: %v %s", err, st)
	}
}
