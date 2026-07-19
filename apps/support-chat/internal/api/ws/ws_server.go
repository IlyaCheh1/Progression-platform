package ws

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	messageModel "github.com/masterofsword/support-chat/internal/domain/message/model"
	"github.com/masterofsword/support-chat/internal/infra/config"
)

type WebSocketServer struct {
	logger               *slog.Logger
	messageAppService    MessageAppService
	attachmentAppService AttachmentAppService
	connectionManager    *ConnectionManager
	config               config.WebSocketConfig
}

func NewWebSocketServer(
	logger *slog.Logger,
	messageAppService MessageAppService,
	attachmentAppService AttachmentAppService,
	config config.WebSocketConfig,
) *WebSocketServer {
	return &WebSocketServer{
		logger:               logger,
		messageAppService:    messageAppService,
		attachmentAppService: attachmentAppService,
		connectionManager:    NewConnectionManager(logger, config),
		config:               config,
	}
}

// SetMessageAppService sets the message app service (used to break circular dependency)
func (ws *WebSocketServer) SetMessageAppService(messageAppService MessageAppService) {
	ws.messageAppService = messageAppService
}

// SetAttachmentService sets the attachment app service
func (ws *WebSocketServer) SetAttachmentService(attachmentService AttachmentAppService) {
	ws.attachmentAppService = attachmentService
}

func (ws *WebSocketServer) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Validate conversation ID
	convIDStr := r.URL.Query().Get("conv_id")
	if convIDStr == "" {
		http.Error(w, "conv_id parameter is required", http.StatusBadRequest)
		return
	}

	convUUID, err := uuid.Parse(convIDStr)
	if err != nil {
		http.Error(w, "invalid conv_id format", http.StatusBadRequest)
		return
	}

	ws.logger.Info("WebSocket connection attempt", "conversation_id", convIDStr)

	// Create upgrader with configured buffer sizes
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// For now allow all origins - in production should check allowed origins
			return true
		},
		ReadBufferSize:  ws.config.ReadBufferSize,
		WriteBufferSize: ws.config.WriteBufferSize,
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		ws.logger.Error("WebSocket upgrade failed", "error", err)
		return
	}

	// Add connection to manager
	wsConn := ws.connectionManager.AddConnection(convIDStr, conn)

	// Handle connection
	ws.handleConnection(wsConn, convUUID, r.URL.Query().Get("after_seq"))
}

func (ws *WebSocketServer) handleConnection(conn *Connection, convId uuid.UUID, afterSeqStr string) {
	defer func() {
		ws.connectionManager.RemoveConnection(conn)
		conn.WebSocket.Close()
	}()

	// Send welcome message
	welcomeFrame := NewWelcomeFrame()
	if err := ws.sendFrame(conn, welcomeFrame); err != nil {
		conn.logger.Error("Failed to send welcome frame", "error", err)
		return
	}

	// Send initial welcome message to conversation if it's empty
	ws.sendInitialWelcomeMessage(conn, convId)

	// Handle backfill if afterSeq is provided
	if afterSeqStr != "" {
		if afterSeq, err := strconv.ParseInt(afterSeqStr, 10, 64); err != nil {
			conn.logger.Error("Invalid after_seq parameter", "after_seq", afterSeqStr, "error", err)
		} else {
			conn.logger.Info("Message backfill requested", "after_seq", afterSeq)
			go ws.handleBackfill(conn, convId, afterSeq)
		}
	}

	// Start read and write pumps
	go ws.writePump(conn)
	ws.readPump(conn, convId)
}

func (ws *WebSocketServer) readPump(conn *Connection, convUUID uuid.UUID) {
	defer conn.WebSocket.Close()

	// Set read deadline and pong handler using config
	pongTimeout := time.Duration(ws.config.PongTimeout) * time.Second
	conn.WebSocket.SetReadDeadline(time.Now().Add(pongTimeout))
	conn.WebSocket.SetPongHandler(func(string) error {
		conn.WebSocket.SetReadDeadline(time.Now().Add(pongTimeout))
		conn.logger.Info("Received pong from client")
		return nil
	})

	for {
		_, messageBytes, err := conn.WebSocket.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				conn.logger.Error("WebSocket read error", "error", err)
			}
			break
		}

		// Parse client frame
		var clientFrame ClientFrame
		if err := json.Unmarshal(messageBytes, &clientFrame); err != nil {
			conn.logger.Error("Failed to parse client frame", "error", err)
			ws.sendErrorFrame(conn, "invalid_frame", "Invalid JSON format")
			continue
		}

		// Handle different frame types
		switch clientFrame.Type {
		case FrameMessageSend:
			ws.handleMessageSend(conn, convUUID, clientFrame.Data)
		case FramePing:
			ws.handlePing(conn)
		default:
			ws.sendErrorFrame(conn, "unknown_frame_type", "Unknown frame type: "+clientFrame.Type)
		}
	}
}

func (ws *WebSocketServer) writePump(conn *Connection) {
	pingInterval := time.Duration(ws.config.PingInterval) * time.Second
	ticker := time.NewTicker(pingInterval)
	conn.logger.Info("Starting write pump", "ping_interval", pingInterval)
	defer func() {
		ticker.Stop()
		conn.WebSocket.Close()
	}()

	for {
		select {
		case message, ok := <-conn.Send:
			conn.WebSocket.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				conn.WebSocket.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := conn.WebSocket.WriteMessage(websocket.TextMessage, message); err != nil {
				conn.logger.Error("WebSocket write error", "error", err)
				return
			}

		case <-ticker.C:
			conn.WebSocket.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := conn.WebSocket.WriteMessage(websocket.PingMessage, nil); err != nil {
				conn.logger.Error("Failed to send ping", "error", err)
				return
			}
			conn.logger.Info("Sent ping to client")
		}
	}
}

func (ws *WebSocketServer) handleMessageSend(conn *Connection, convUUID uuid.UUID, data interface{}) {
	// Parse message send data
	dataBytes, err := json.Marshal(data)
	if err != nil {
		ws.sendErrorFrame(conn, "invalid_data", "Failed to parse message data")
		return
	}

	var sendData MessageSendData
	if err := json.Unmarshal(dataBytes, &sendData); err != nil {
		ws.sendErrorFrame(conn, "invalid_message_data", "Invalid message send data format")
		return
	}

	// Validate message content - must have either text or attachments
	isTextEmpty := sendData.Text == ""
	isAttachmentsEmpty := len(sendData.Attachments) == 0

	if isTextEmpty && isAttachmentsEmpty {
		ws.sendErrorFrame(conn, "empty_message", "Message must contain either text or attachments")
		return
	}

	conn.logger.Info("Received message send", "text_length", len(sendData.Text), "client_id", sendData.ClientID, "reply_to_message_id", sendData.ReplyToMessageID, "attachments_count", len(sendData.Attachments))

	// Parse ReplyToMessageID if provided
	var replyToMessageID *uuid.UUID
	if sendData.ReplyToMessageID != nil {
		replyUUID, err := uuid.Parse(*sendData.ReplyToMessageID)
		if err != nil {
			ws.sendErrorFrame(conn, "invalid_reply_id", "Invalid reply_to_message_id format")
			return
		}
		replyToMessageID = &replyUUID
	}

	// Parse attachment IDs if provided
	var attachmentIDs []uuid.UUID
	if len(sendData.Attachments) > 0 {
		attachmentIDs = make([]uuid.UUID, len(sendData.Attachments))
		for i, attachmentIDStr := range sendData.Attachments {
			attachmentID, err := uuid.Parse(attachmentIDStr)
			if err != nil {
				ws.sendErrorFrame(conn, "invalid_attachment_id", "Invalid attachment ID format")
				return
			}
			attachmentIDs[i] = attachmentID
		}
	}

	// Create message model
	messModel := &messageModel.Message{
		ConversationID:   convUUID,
		SenderKind:       messageModel.UserSenderKind,
		Source:           messageModel.WebMessageSource,
		ContentType:      messageModel.TextContentType,
		ContentText:      &sendData.Text,
		ClientID:         sendData.ClientID,
		ReplyToMessageID: replyToMessageID,
	}

	// Create message through MessageAppService (broadcast is handled inside)
	if ws.messageAppService == nil {
		conn.logger.Error("MessageAppService not initialized")
		ws.sendErrorFrame(conn, "service_unavailable", "Message service not available")
		return
	}

	ctx := context.Background()

	// Check if the service supports attachments
	if len(attachmentIDs) > 0 {
		// Use the attachment-enabled method
		createdMessage, err := ws.messageAppService.SendMessageWithAttachments(ctx, messModel, attachmentIDs)
		if err != nil {
			conn.logger.Error("Failed to create message with attachments", "error", err)
			ws.sendErrorFrame(conn, "message_creation_failed", "Failed to create message")
			return
		}
		conn.logger.Info("Message created via WebSocket with attachments", "message_id", createdMessage.ID.String(), "seq_no", createdMessage.SeqNo, "attachments_count", len(attachmentIDs))
	} else {
		// Use the standard method
		createdMessage, err := ws.messageAppService.SendMessage(ctx, messModel)
		if err != nil {
			conn.logger.Error("Failed to create message", "error", err)
			ws.sendErrorFrame(conn, "message_creation_failed", "Failed to create message")
			return
		}
		conn.logger.Info("Message created via WebSocket", "message_id", createdMessage.ID.String(), "seq_no", createdMessage.SeqNo)
	}
}

func (ws *WebSocketServer) sendFrame(conn *Connection, frame ServerFrame) error {
	frameBytes, err := json.Marshal(frame)
	if err != nil {
		return err
	}

	select {
	case conn.Send <- frameBytes:
		return nil
	default:
		return websocket.ErrCloseSent
	}
}

func (ws *WebSocketServer) sendErrorFrame(conn *Connection, code, message string) {
	errorFrame := NewErrorFrame(code, message)
	if err := ws.sendFrame(conn, errorFrame); err != nil {
		conn.logger.Error("Failed to send error frame", "error", err)
	}
}

func (ws *WebSocketServer) handlePing(conn *Connection) {
	conn.logger.Debug("Received application-level ping from client")

	pongFrame := NewPongFrame()
	if err := ws.sendFrame(conn, pongFrame); err != nil {
		conn.logger.Error("Failed to send pong frame", "error", err)
		return
	}

	conn.logger.Debug("Sent application-level pong to client")
}

// GetConnectionCount returns the number of active WebSocket connections
func (ws *WebSocketServer) GetConnectionCount() int {
	return ws.connectionManager.GetConnectionCount()
}

// GetConversationConnectionCount returns the number of connections for a specific conversation
func (ws *WebSocketServer) GetConversationConnectionCount(convID string) int {
	return ws.connectionManager.GetConversationConnectionCount(convID)
}

// BroadcastToConversation broadcasts a message to all WebSocket connections in a conversation
func (ws *WebSocketServer) BroadcastToConversation(convID string, message []byte) {
	ws.connectionManager.BroadcastToConversation(convID, message)
}

// BroadcastMessage implements MessageBroadcaster interface
func (ws *WebSocketServer) BroadcastMessage(message *messageModel.Message) error {
	// Get attachment data with download URLs if attachment service is available
	var attachmentData []AttachmentData
	if ws.attachmentAppService != nil && len(message.AttachmentIDs) > 0 {
		ctx := context.Background()

		// Get attachments by IDs
		attachments, err := ws.attachmentAppService.GetAttachmentsByIDs(ctx, message.ConversationID, message.AttachmentIDs)
		if err != nil {
			ws.logger.Error("Failed to get attachments for message broadcast",
				"message_id", message.ID.String(),
				"attachment_count", len(message.AttachmentIDs),
				"error", err)
		} else {
			// Generate download URLs for attachments
			attachmentData, err = ws.attachmentAppService.GetAttachmentDataWithDownloadURLs(ctx, attachments)
			if err != nil {
				ws.logger.Error("Failed to generate download URLs for message attachments",
					"message_id", message.ID.String(),
					"attachment_count", len(attachments),
					"error", err)
				attachmentData = nil
			}
		}
	}

	messageFrame := NewMessageCreatedFrame(message, attachmentData)
	frameBytes, err := json.Marshal(messageFrame)
	if err != nil {
		return err
	}

	// Broadcast to all connections in the conversation
	ws.connectionManager.BroadcastToConversation(message.ConversationID.String(), frameBytes)

	ws.logger.Debug("Message broadcasted to WebSocket connections",
		"message_id", message.ID.String(),
		"conversation_id", message.ConversationID.String(),
		"attachment_count", len(attachmentData),
		"connections", ws.connectionManager.GetConversationConnectionCount(message.ConversationID.String()))

	return nil
}

// BroadcastConversationClosed broadcasts a conversation closed event to all WebSocket connections in the conversation and then closes them
func (ws *WebSocketServer) BroadcastConversationClosed(conversationID, closedBy, reason string, closedAt time.Time) error {
	closedFrame := NewConversationClosedFrame(conversationID, closedBy, reason, closedAt)
	frameBytes, err := json.Marshal(closedFrame)
	if err != nil {
		return err
	}

	connectionCount := ws.connectionManager.GetConversationConnectionCount(conversationID)

	// Broadcast to all connections in the conversation
	ws.connectionManager.BroadcastToConversation(conversationID, frameBytes)

	ws.logger.Debug("Conversation closed event broadcasted to WebSocket connections",
		"conversation_id", conversationID,
		"closed_by", closedBy,
		"reason", reason,
		"connections", connectionCount)

	// Give clients a moment to receive the close message, then close all connections
	go func() {
		time.Sleep(500 * time.Millisecond) // Wait 500ms for clients to process the close event
		ws.connectionManager.CloseConversationConnections(conversationID, reason)
	}()

	return nil
}

// handleBackfill sends historical messages to the client
func (ws *WebSocketServer) handleBackfill(conn *Connection, convUUID uuid.UUID, afterSeq int64) {
	if ws.messageAppService == nil {
		conn.logger.Error("MessageAppService not initialized for backfill")
		return
	}

	ctx := context.Background()

	// Get messages after the specified sequence number
	// Use a reasonable limit to avoid overwhelming the connection
	limit := int32(100)
	messages, err := ws.messageAppService.GetMessagesByConvId(ctx, convUUID, afterSeq, limit, true)
	if err != nil {
		conn.logger.Error("Failed to get messages for backfill",
			"conversation_id", convUUID,
			"after_seq", afterSeq,
			"error", err)
		ws.sendErrorFrame(conn, "backfill_failed", "Failed to load message history")
		return
	}

	conn.logger.Info("Sending message backfill",
		"conversation_id", convUUID,
		"after_seq", afterSeq,
		"message_count", len(messages))

	// Send each message as message.created frame
	for _, message := range messages {
		// Get attachment data with download URLs if available
		var attachmentData []AttachmentData
		if ws.attachmentAppService != nil && len(message.AttachmentIDs) > 0 {
			// Get attachments by IDs
			attachments, err := ws.attachmentAppService.GetAttachmentsByIDs(ctx, message.ConversationID, message.AttachmentIDs)
			if err != nil {
				conn.logger.Error("Failed to get attachments for backfill message",
					"message_id", message.ID.String(),
					"attachment_count", len(message.AttachmentIDs),
					"error", err)
			} else {
				// Generate download URLs for attachments
				attachmentData, err = ws.attachmentAppService.GetAttachmentDataWithDownloadURLs(ctx, attachments)
				if err != nil {
					conn.logger.Error("Failed to generate download URLs for backfill message attachments",
						"message_id", message.ID.String(),
						"attachment_count", len(attachments),
						"error", err)
					attachmentData = nil
				}
			}
		}

		messageFrame := NewMessageCreatedFrame(message, attachmentData)
		if err := ws.sendFrame(conn, messageFrame); err != nil {
			conn.logger.Error("Failed to send backfill message",
				"message_id", message.ID.String(),
				"error", err)
			// Continue sending other messages even if one fails
			continue
		}

		// Small delay to avoid overwhelming the client
		time.Sleep(10 * time.Millisecond)
	}

	conn.logger.Info("Message backfill completed",
		"conversation_id", convUUID,
		"sent_count", len(messages))
}

// sendInitialWelcomeMessage sends a welcome message if the conversation is empty
func (ws *WebSocketServer) sendInitialWelcomeMessage(conn *Connection, convUUID uuid.UUID) {
	if ws.messageAppService == nil {
		conn.logger.Error("MessageAppService not initialized for welcome message")
		return
	}

	ctx := context.Background()

	// Check if conversation is empty by getting first message
	messages, err := ws.messageAppService.GetMessagesByConvId(ctx, convUUID, 0, 1, true)
	if err != nil {
		conn.logger.Error("Failed to check if conversation is empty", "error", err)
		return
	}

	// If conversation already has messages, don't send welcome message
	if len(messages) > 0 {
		conn.logger.Debug("Conversation already has messages, skipping welcome message",
			"conversation_id", convUUID,
			"message_count", len(messages))
		return
	}

	// Create welcome message
	welcomeText := "Любишь боль. Мы уже поняли."
	welcomeMessage := &messageModel.Message{
		ConversationID: convUUID,
		SenderKind:     messageModel.SystemSenderKind,
		Source:         messageModel.SystemMessageSource,
		ContentType:    messageModel.TextContentType,
		ContentText:    &welcomeText,
	}

	// Send welcome message through MessageAppService
	// This will save it to database and broadcast to all connected clients
	createdMessage, err := ws.messageAppService.SendMessage(ctx, welcomeMessage)
	if err != nil {
		conn.logger.Error("Failed to send welcome message", "error", err)
		return
	}

	conn.logger.Info("Welcome message sent to conversation",
		"conversation_id", convUUID,
		"message_id", createdMessage.ID.String(),
		"text", welcomeText)
}
