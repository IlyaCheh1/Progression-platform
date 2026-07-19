package model

import (
	"time"

	"github.com/google/uuid"
)

type Attachment struct {
	ID             uuid.UUID
	ConversationID uuid.UUID
	MessageID      *uuid.UUID
	StorageKey     string
	FileName       string
	ContentType    string
	SizeBytes      *int64
	Status         AttachmentStatus
	CreatedAt      time.Time
}

type AttachmentInit struct {
	ConversationID uuid.UUID
	FileName       string
	ContentType    string
	SizeBytes      int64
	StorageKey     string
}

type AttachmentDownloadUrl struct {
	ID          uuid.UUID
	DownloadUrl string
	ExpiresIn   int
}

type AttachmentStatus string

const (
	InitAttachmentStatus     AttachmentStatus = "init"
	CompleteAttachmentStatus AttachmentStatus = "complete"
)
