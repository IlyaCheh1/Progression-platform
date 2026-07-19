package error

import (
	"context"
	"errors"
	"fmt"
)

var (
	ErrUnknown      = errors.New("unknown error")
	ErrNotFound     = errors.New("not found")
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
)

type errorContextKey struct{}

func WithError(ctx context.Context, err error) context.Context {
	if err == nil {
		return ctx
	}

	ctxErr := FromContext(ctx)
	if ctxErr != nil {
		err = errors.Join(ctxErr, err)
	}

	return context.WithValue(ctx, errorContextKey{}, err)
}

func FromContext(ctx context.Context) error {
	v := ctx.Value(errorContextKey{})
	if v == nil {
		return nil
	}

	err, ok := v.(error)
	if !ok {
		return nil
	}

	return err
}

// NewUnknown wraps fmt.Errorf call creates a new domain-specific unknown error
func NewUnknown(format string, a ...any) error {
	format += ": %w"
	a = append(a, ErrUnknown)

	return fmt.Errorf(format, a...)
}

// NewNotFound wraps fmt.Errorf call creates a new domain-specific not found error
func NewNotFound(format string, a ...any) error {
	format += ": %w"
	a = append(a, ErrNotFound)

	return fmt.Errorf(format, a...)
}

// NewUnauthorized wraps fmt.Errorf call creates a new domain-specific unauthorized error
func NewUnauthorized(format string, a ...any) error {
	format += ": %w"
	a = append(a, ErrUnauthorized)

	return fmt.Errorf(format, a...)
}

func NewForbidden(format string, a ...any) error {
	format += ": %w"
	a = append(a, ErrForbidden)

	return fmt.Errorf(format, a...)
}

func IsUnknown(err error) bool {
	return errors.Is(err, ErrUnknown)
}

func IsNotFound(err error) bool {
	return errors.Is(err, ErrNotFound)
}

func IsUnauthorized(err error) bool {
	return errors.Is(err, ErrUnauthorized)
}

func IsForbidden(err error) bool {
	return errors.Is(err, ErrForbidden)
}
