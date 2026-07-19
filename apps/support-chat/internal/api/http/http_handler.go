package http

import (
	"log/slog"
)

type HttpApiHandler struct {
	logger *slog.Logger

	convAppService       ConvAppService
	messageAppService    MessageAppService
	telegramAppService   TelegramAppService
	attachmentAppService AttachmentAppService
}

func NewHttpApiHandler(
	logger *slog.Logger,
	convAppService ConvAppService,
	messageAppService MessageAppService,
	telegramAppService TelegramAppService,
	attachmentAppService AttachmentAppService,
) *HttpApiHandler {
	return &HttpApiHandler{
		logger:               logger,
		convAppService:       convAppService,
		messageAppService:    messageAppService,
		telegramAppService:   telegramAppService,
		attachmentAppService: attachmentAppService,
	}
}
