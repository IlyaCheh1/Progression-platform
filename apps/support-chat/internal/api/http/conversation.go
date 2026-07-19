package http

import (
	"context"
	"net/http"

	api "github.com/masterofsword/support-chat/internal/api/http/generated"
	"github.com/masterofsword/support-chat/internal/app/conversation"
	"github.com/masterofsword/support-chat/internal/domain/conversation/model"
)

func (h *HttpApiHandler) CreateConversation(ctx context.Context, req api.CreateConversationRequestObject) (api.CreateConversationResponseObject, error) {
	h.logger.Info("CreateConversation called", "type", req.Body.Type, "topic", req.Body.Topic)

	// Create app-level conversation info with user data
	convInfo := &conversation.CreateConversationInfo{
		Type:       model.ConversationType(req.Body.Type),
		Topic:      req.Body.Topic,
		Source:     model.ConversationSource(*req.Body.Source),
		PageUrl:    req.Body.PageUrl,
		Locale:     req.Body.Locale,
		AppVersion: req.Body.AppVersion,
		UserId:     req.Body.User.Id,
		Username:   req.Body.User.Username,
	}

	resp, err := h.convAppService.CreateConversation(ctx, convInfo)
	if err != nil {
		h.logger.Error("Failed to create conversation", "error", err, "topic", req.Body.Topic, "type", req.Body.Type)
		return api.CreateConversation500JSONResponse{
			Code:    http.StatusText(http.StatusInternalServerError),
			Message: "Failed to create conversation",
		}, err
	}

	h.logger.Info("Conversation created successfully", "id", resp.Id, "topic", resp.Topic)
	return api.CreateConversation200JSONResponse{
		CreatedAt: resp.CreatedAt,
		Id:        resp.Id,
		Status:    api.ConversationStatus(resp.Status),
		Topic:     resp.Topic,
		Type:      api.ConversationType(resp.Type),
		IsLike:    resp.IsLike,
	}, nil
}

func (h *HttpApiHandler) GetMyConversations(ctx context.Context, req api.GetMyConversationsRequestObject) (api.GetMyConversationsResponseObject, error) {
	h.logger.Info("GetMyConversations called", "limit", *req.Params.Limit, "user_id", req.Params.UserId)

	conversations, err := h.convAppService.GetMyConversations(ctx, req.Params.UserId, int32(*req.Params.Limit))
	if err != nil {
		h.logger.Error("Failed to get conversations", "error", err, "limit", *req.Params.Limit)
		return api.GetMyConversations500JSONResponse{
			Code:    http.StatusText(http.StatusInternalServerError),
			Message: "Failed to get conversations",
		}, err
	}

	resp := make([]api.Conversation, 0, len(conversations))
	for _, conv := range conversations {
		resp = append(resp, api.Conversation{
			CreatedAt: conv.CreatedAt,
			Id:        conv.Id,
			Status:    api.ConversationStatus(conv.Status),
			Topic:     conv.Topic,
			Type:      api.ConversationType(conv.Type),
			IsLike:    conv.IsLike,
		})
	}

	h.logger.Info("Conversations retrieved successfully", "count", len(conversations))
	return api.GetMyConversations200JSONResponse{
		Items:      &resp,
		NextCursor: nil,
	}, nil
}

func (h *HttpApiHandler) UpdateConversationStatusById(ctx context.Context, req api.UpdateConversationStatusByIdRequestObject) (api.UpdateConversationStatusByIdResponseObject, error) {
	h.logger.Info("UpdateConversationStatusById called", "conversationId", req.ConversationId, "status", req.Body.Status, "user_id", req.Params.UserId)

	conv, err := h.convAppService.UpdateConversationStatus(ctx, req.ConversationId, model.ConversationStatus(req.Body.Status))
	if err != nil {
		h.logger.Error("Failed to update conversation status", "error", err, "conversationId", req.ConversationId, "status", req.Body.Status)
		return api.UpdateConversationStatusById500JSONResponse{
			Code:    http.StatusText(http.StatusInternalServerError),
			Message: "Failed to update conversation status",
		}, err
	}

	h.logger.Info("Conversation status updated successfully", "conversationId", req.ConversationId, "status", conv.Status)
	return api.UpdateConversationStatusById200JSONResponse{
		CreatedAt: conv.CreatedAt,
		Id:        conv.Id,
		Status:    api.ConversationStatus(conv.Status),
		Topic:     conv.Topic,
		Type:      api.ConversationType(conv.Type),
		IsLike:    conv.IsLike,
	}, nil
}

func (h *HttpApiHandler) RateConversation(ctx context.Context, req api.RateConversationRequestObject) (api.RateConversationResponseObject, error) {
	h.logger.Info("RateConversation called", "conversationId", req.ConversationId, "isLike", req.Body.IsLike, "user_id", req.Params.UserId)

	conv, err := h.convAppService.RateConversation(ctx, req.ConversationId, req.Body.IsLike)
	if err != nil {
		h.logger.Error("Failed to rate conversation", "error", err, "conversationId", req.ConversationId, "isLike", req.Body.IsLike)
		return api.RateConversation500JSONResponse{
			Code:    http.StatusText(http.StatusInternalServerError),
			Message: "Failed to rate conversation",
		}, err
	}

	h.logger.Info("Conversation rated successfully", "conversationId", req.ConversationId, "isLike", conv.IsLike)
	return api.RateConversation200JSONResponse{
		CreatedAt: conv.CreatedAt,
		Id:        conv.Id,
		Status:    api.ConversationStatus(conv.Status),
		Topic:     conv.Topic,
		Type:      api.ConversationType(conv.Type),
		IsLike:    conv.IsLike,
	}, nil
}
