package message

import "log/slog"

type MessageAppServiceImpl struct {
	messService       MessageDomainService
	convService       ConversationDomainService
	broadcaster       MessageBroadcaster
	telegramService   TelegramAppService
	attachmentService AttachmentAppService
	logger            *slog.Logger
}

func NewAppService(
	impl MessageDomainService,
	convService ConversationDomainService,
	broadcaster MessageBroadcaster,
	telegramService TelegramAppService,
	attachmentService AttachmentAppService,
	logger *slog.Logger,
) *MessageAppServiceImpl {
	return &MessageAppServiceImpl{
		messService:       impl,
		convService:       convService,
		broadcaster:       broadcaster,
		telegramService:   telegramService,
		attachmentService: attachmentService,
		logger:            logger,
	}
}
