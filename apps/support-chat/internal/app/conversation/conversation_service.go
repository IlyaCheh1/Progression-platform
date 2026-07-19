package conversation

import "log/slog"

type ConversationAppServiceImpl struct {
	convService     ConversationDomainService
	userService     UserDomainService
	telegramService TelegramAppService
	logger          *slog.Logger
}

func NewAppService(
	impl ConversationDomainService,
	userImpl UserDomainService,
	telegramService TelegramAppService,
	logger *slog.Logger,
) *ConversationAppServiceImpl {
	return &ConversationAppServiceImpl{
		convService:     impl,
		userService:     userImpl,
		telegramService: telegramService,
		logger:          logger,
	}
}
