package client

// Telegram Bot API request models
type CreateForumTopicRequest struct {
	ChatID int64  `json:"chat_id"`
	Name   string `json:"name"`
}

type SendMessageRequest struct {
	ChatID          int64  `json:"chat_id"`
	Text            string `json:"text"`
	MessageThreadID *int32 `json:"message_thread_id,omitempty"`
}

type SendMediaGroupRequest struct {
	ChatID          int64       `json:"chat_id"`
	Media           []MediaItem `json:"media"`
	MessageThreadID *int32      `json:"message_thread_id,omitempty"`
}

type MediaItem struct {
	Type    string `json:"type"`  // "photo" or "document"
	Media   string `json:"media"` // URL to download the file
	Caption string `json:"caption,omitempty"`
}

// Telegram Bot API response models
type CreateForumTopicResponse struct {
	OK     bool                   `json:"ok"`
	Result CreateForumTopicResult `json:"result"`
}

type CreateForumTopicResult struct {
	MessageThreadID int32  `json:"message_thread_id"`
	Name            string `json:"name"`
}

type SendMessageResponse struct {
	OK     bool                  `json:"ok"`
	Result TelegramMessageResult `json:"result"`
}

type SendMediaGroupResponse struct {
	OK     bool                    `json:"ok"`
	Result []TelegramMessageResult `json:"result"`
}

type TelegramMessageResult struct {
	MessageID       int64  `json:"message_id"`
	MessageThreadID *int32 `json:"message_thread_id,omitempty"`
	Date            int64  `json:"date"`
	Text            string `json:"text"`
	Chat            struct {
		ID   int64  `json:"id"`
		Type string `json:"type"`
	} `json:"chat"`
}

type TelegramErrorResponse struct {
	OK          bool   `json:"ok"`
	ErrorCode   int    `json:"error_code"`
	Description string `json:"description"`
}

type GetMeResponse struct {
	OK     bool `json:"ok"`
	Result struct {
		ID        int64  `json:"id"`
		IsBot     bool   `json:"is_bot"`
		FirstName string `json:"first_name"`
		Username  string `json:"username"`
	} `json:"result"`
}

type GetChatResponse struct {
	OK     bool `json:"ok"`
	Result struct {
		ID       int64  `json:"id"`
		Type     string `json:"type"`
		Title    string `json:"title"`
		IsForum  bool   `json:"is_forum"`
		Username string `json:"username"`
	} `json:"result"`
}
