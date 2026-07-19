package ws

import (
	"time"

	"github.com/masterofsword/support-chat/internal/domain/message/model"
)

// WebSocket frame types following OpenAPI spec

// Client -> Server frames
type ClientFrame struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type MessageSendData struct {
	Text             string   `json:"text"`
	Attachments      []string `json:"attachments,omitempty"`
	ClientID         *string  `json:"client_id,omitempty"`
	ReplyToMessageID *string  `json:"reply_to_message_id,omitempty"`
}

// Server -> Client frames
type ServerFrame struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type WelcomeData struct {
	UserID     *string   `json:"user_id,omitempty"` // nil for now since no auth
	ServerTime time.Time `json:"server_time"`
}

type AttachmentData struct {
	AttachmentID string `json:"attachment_id"`
	FileName     string `json:"file_name"`
	ContentType  string `json:"content_type"`
	SizeBytes    int64  `json:"size_bytes"`
	DownloadURL  string `json:"download_url"`
	ExpiresIn    int    `json:"expires_in"`
}

type MessageCreatedData struct {
	MessageID        string           `json:"message_id"`
	ConversationID   string           `json:"conversation_id"`
	SeqNo            int64            `json:"seq_no"`
	Sender           string           `json:"sender"`
	ClientID         *string          `json:"client_id"`
	Source           string           `json:"source"`
	ContentType      string           `json:"content_type"`
	Text             *string          `json:"text,omitempty"`
	Attachments      []AttachmentData `json:"attachments,omitempty"`
	ReplyToMessageID *string          `json:"reply_to_message_id,omitempty"`
	CreatedAt        time.Time        `json:"created_at"`
}

type ErrorData struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type ConversationClosedData struct {
	ConversationID string `json:"conversation_id"`
	ClosedBy       string `json:"closed_by"`
	ClosedAt       string `json:"closed_at"`
	Reason         string `json:"reason"`
}

type PingData struct {
	Timestamp time.Time `json:"timestamp,omitempty"`
}

type PongData struct {
	Timestamp time.Time `json:"timestamp"`
}

// Frame type constants
const (
	// Client -> Server
	FrameMessageSend = "message.send"
	FramePing        = "ping"

	// Server -> Client
	FrameWelcome            = "welcome"
	FrameMessageCreated     = "message.created"
	FrameConversationClosed = "conversation.closed"
	FrameError              = "error"
	FramePong               = "pong"
)

// Helper functions to create server frames
func NewWelcomeFrame() ServerFrame {
	return ServerFrame{
		Type: FrameWelcome,
		Data: WelcomeData{
			ServerTime: time.Now(),
		},
	}
}

func NewMessageCreatedFrame(msg *model.Message, attachments []AttachmentData) ServerFrame {
	var replyToMessageID *string
	if msg.ReplyToMessageID != nil {
		replyID := msg.ReplyToMessageID.String()
		replyToMessageID = &replyID
	}

	data := MessageCreatedData{
		MessageID:        msg.ID.String(),
		ConversationID:   msg.ConversationID.String(),
		SeqNo:            msg.SeqNo,
		ClientID:         msg.ClientID,
		Sender:           string(msg.SenderKind),
		Source:           string(msg.Source),
		ContentType:      string(msg.ContentType),
		Text:             msg.ContentText,
		Attachments:      attachments,
		ReplyToMessageID: replyToMessageID,
		CreatedAt:        msg.CreatedAt,
	}

	return ServerFrame{
		Type: FrameMessageCreated,
		Data: data,
	}
}

func NewConversationClosedFrame(conversationID, closedBy, reason string, closedAt time.Time) ServerFrame {
	return ServerFrame{
		Type: FrameConversationClosed,
		Data: ConversationClosedData{
			ConversationID: conversationID,
			ClosedBy:       closedBy,
			ClosedAt:       closedAt.Format(time.RFC3339),
			Reason:         reason,
		},
	}
}

func NewErrorFrame(code, message string) ServerFrame {
	return ServerFrame{
		Type: FrameError,
		Data: ErrorData{
			Code:    code,
			Message: message,
		},
	}
}

func NewPongFrame() ServerFrame {
	return ServerFrame{
		Type: FramePong,
		Data: PongData{
			Timestamp: time.Now(),
		},
	}
}
