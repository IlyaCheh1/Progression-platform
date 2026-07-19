package ws

import (
	"log/slog"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"github.com/masterofsword/support-chat/internal/infra/config"
)

type ConnectionManager struct {
	// connections by connection ID
	connections map[string]*Connection

	// conversation subscriptions: conv_id -> connection_id -> connection
	conversationSubs map[string]map[string]*Connection

	mu     sync.RWMutex
	logger *slog.Logger
	config config.WebSocketConfig
}

type Connection struct {
	ID        string
	UserID    string // will be empty for now since no auth
	ConvID    string
	WebSocket *websocket.Conn
	Send      chan []byte
	Manager   *ConnectionManager
	logger    *slog.Logger
	closeOnce sync.Once // Ensures Send channel is closed only once
}

func NewConnectionManager(logger *slog.Logger, config config.WebSocketConfig) *ConnectionManager {
	return &ConnectionManager{
		connections:      make(map[string]*Connection),
		conversationSubs: make(map[string]map[string]*Connection),
		logger:           logger,
		config:           config,
	}
}

func (cm *ConnectionManager) AddConnection(convID string, ws *websocket.Conn) *Connection {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	connID := uuid.New().String()
	conn := &Connection{
		ID:        connID,
		ConvID:    convID,
		WebSocket: ws,
		Send:      make(chan []byte, cm.config.MessageBuffer),
		Manager:   cm,
		logger:    cm.logger.With("connection_id", connID, "conversation_id", convID),
	}

	// Add to connections map
	cm.connections[connID] = conn

	// Add to conversation subscriptions
	if cm.conversationSubs[convID] == nil {
		cm.conversationSubs[convID] = make(map[string]*Connection)
	}
	cm.conversationSubs[convID][connID] = conn

	cm.logger.Info("Connection added", "connection_id", connID, "conversation_id", convID)
	return conn
}

func (cm *ConnectionManager) RemoveConnection(conn *Connection) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	// Remove from connections map
	delete(cm.connections, conn.ID)

	// Remove from conversation subscriptions
	if convSubs, exists := cm.conversationSubs[conn.ConvID]; exists {
		delete(convSubs, conn.ID)

		// Clean up empty conversation subscription
		if len(convSubs) == 0 {
			delete(cm.conversationSubs, conn.ConvID)
		}
	}

	// Close the Send channel only once using sync.Once to prevent panic
	conn.closeOnce.Do(func() {
		close(conn.Send)
	})
	cm.logger.Info("Connection removed", "connection_id", conn.ID, "conversation_id", conn.ConvID)
}

func (cm *ConnectionManager) BroadcastToConversation(convID string, message []byte) {
	cm.mu.RLock()
	connections, exists := cm.conversationSubs[convID]
	if !exists {
		cm.mu.RUnlock()
		return
	}

	// Create a copy of connections to avoid holding the lock while sending
	connsCopy := make([]*Connection, 0, len(connections))
	for _, conn := range connections {
		connsCopy = append(connsCopy, conn)
	}
	cm.mu.RUnlock()

	// Send to all connections
	for _, conn := range connsCopy {
		select {
		case conn.Send <- message:
		default:
			// Channel is full, remove connection
			cm.logger.Warn("Connection send channel full, removing", "connection_id", conn.ID)
			cm.RemoveConnection(conn)
			conn.WebSocket.Close()
		}
	}

	cm.logger.Debug("Broadcasted message to conversation", "conversation_id", convID, "connections", len(connsCopy))
}

func (cm *ConnectionManager) GetConnectionCount() int {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	return len(cm.connections)
}

func (cm *ConnectionManager) GetConversationConnectionCount(convID string) int {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	if convSubs, exists := cm.conversationSubs[convID]; exists {
		return len(convSubs)
	}
	return 0
}

// CloseConversationConnections closes all WebSocket connections for a conversation
func (cm *ConnectionManager) CloseConversationConnections(convID string, closeReason string) {
	cm.mu.RLock()
	connections, exists := cm.conversationSubs[convID]
	if !exists {
		cm.mu.RUnlock()
		cm.logger.Debug("No connections to close for conversation", "conversation_id", convID)
		return
	}

	// Create a copy of connections to avoid holding the lock while closing
	connsCopy := make([]*Connection, 0, len(connections))
	for _, conn := range connections {
		connsCopy = append(connsCopy, conn)
	}
	cm.mu.RUnlock()

	cm.logger.Info("Closing all connections for conversation",
		"conversation_id", convID,
		"connection_count", len(connsCopy),
		"reason", closeReason)

	// Close all connections
	for _, conn := range connsCopy {
		conn.logger.Info("Closing connection due to conversation closure", "reason", closeReason)

		// Close the WebSocket connection gracefully
		conn.WebSocket.Close()

		// Remove connection from manager (this will also close the Send channel)
		cm.RemoveConnection(conn)
	}
}
