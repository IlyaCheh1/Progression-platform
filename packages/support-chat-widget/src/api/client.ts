// API types based on OpenAPI spec
export type ConversationType = 'support' | 'direct' | 'group' | 'ai';
export type ConversationStatus = 'open' | 'pending' | 'closed';
export type SenderType = 'user' | 'support' | 'assistant' | 'system';
export type SourceType = 'web' | 'telegram' | 'system';
export type ContentType = 'text';

export interface User {
  id: string;
  username: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  status: ConversationStatus;
  topic?: string;
  created_at: string;
}

export interface Message {
  message_id: string;
  conversation_id: string;
  seq_no: number;
  sender: SenderType;
  source: SourceType;
  content_type: ContentType;
  text?: string;
  attachments?: Attachment[];
  reply_to_message_id?: string;
  created_at: string;

  //local data
  isReceived?: boolean;
  replyingMessage?: Message | null;
}

export interface ConversationCreateRequest {
  type: ConversationType;
  user: User;
  participants?: string[];
  topic?: string;
  source?: 'web' | 'ios' | 'android';
  page_url?: string;
  locale?: string;
  timezone?: number;
  app_version?: string;
}

export interface MessageCreateRequest {
  content_type: ContentType;
  text?: string;
  attachments?: string[];
  client_id?: string;
  reply_to_message_id?: string;
}

export interface Attachment {
  attachment_id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  download_url?: string;
  expires_in?: number;
}

export interface ConversationRateRequest {
  is_like: boolean;
}

export interface AttachmentInitRequest {
  file_name: string;
  content_type: string;
  size_bytes: number;
}

export interface AttachmentInitResponse {
  attachment_id: string;
  upload_url: string;
  storage_key: string;
  expires_in: number;
}

export interface AttachmentResponse {
  attachment_id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  status: 'init' | 'complete';
  created_at: string;
}

export interface AttachmentDownloadResponse {
  attachment_id: string;
  download_url: string;
  expires_in: number;
}

export interface ConversationListResponse {
  items: Conversation[];
  next_cursor?: string;
}

export interface MessageListResponse {
  conversation_id: string;
  items: Message[];
  next_after_seq: number;
}

export interface ErrorResponse {
  code: string;
  message: string;
}

import { getApiBaseUrl } from '../lib/chat-config';

const API_PREFIX = '/api/v1';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Main API client function
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${API_PREFIX}${path}`;

  const res = await fetch(url, {
    credentials: 'include', // For SSO cookies
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}`;
    let errorCode = res.status.toString();

    try {
      const responseText = await res.text();

      try {
        const errorData: ErrorResponse = JSON.parse(responseText);
        errorMessage = errorData.message;
        errorCode = errorData.code;
      } catch {
        errorMessage = responseText || errorMessage;
      }
    } catch {
      // Если не удалось прочитать тело, используем статус
      errorMessage = `HTTP ${res.status} ${res.statusText}`;
    }

    throw new ApiError(errorMessage, res.status, errorCode);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return null as T;
  }

  return res.json() as Promise<T>;
}

// Convenience methods for different HTTP verbs
export const apiClient = {
  get: <T>(path: string, params?: Record<string, any>) => {
    const url = params ? `${path}?${new URLSearchParams(params).toString()}` : path;
    return api<T>(url, { method: 'GET' });
  },

  post: <T>(path: string, data?: any) =>
    api<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(path: string, data?: any) =>
    api<T>(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(path: string) => api<T>(path, { method: 'DELETE' }),
};

// Specific API methods based on OpenAPI spec
export const conversationsApi = {
  // POST /conversations
  create: (data: ConversationCreateRequest) => apiClient.post<Conversation>('/conversations', data),

  // GET /conversations
  list: (userId: string, limit?: number) =>
    apiClient.get<ConversationListResponse>('/conversations', {
      user_id: userId,
      limit: limit?.toString(),
    }),

  // PATCH /conversations/{conversationId}
  updateStatus: (conversationId: string, userId: string, status: ConversationStatus) =>
    apiClient.patch<Conversation>(`/conversations/${conversationId}?user_id=${userId}`, { status }),

  // PATCH /conversations/{conversationId}/rate
  rate: (conversationId: string, userId: string, data: ConversationRateRequest) =>
    apiClient.patch<Conversation>(`/conversations/${conversationId}/rate?user_id=${userId}`, data),
};

export const messagesApi = {
  // GET /conversations/{conversationId}/messages - простой запрос всей истории
  getHistory: (conversationId: string) =>
    apiClient.get<MessageListResponse>(`/conversations/${conversationId}/messages?limit=100`),

  // POST /conversations/{conversationId}/messages
  send: (conversationId: string, data: MessageCreateRequest) =>
    apiClient.post<Message>(`/conversations/${conversationId}/messages`, data),
};

export const attachmentsApi = {
  // POST /attachments/init
  init: (conversationId: string, data: AttachmentInitRequest) =>
    apiClient.post<AttachmentInitResponse>(
      `/attachments/init?conversation_id=${conversationId}`,
      data
    ),

  // POST /attachments/{attachmentId}/complete
  complete: (attachmentId: string, conversationId: string) =>
    apiClient.post<AttachmentResponse>(
      `/attachments/${attachmentId}/complete?conversation_id=${conversationId}`
    ),

  // GET /attachments/{attachmentId}/download
  getDownloadUrl: (attachmentId: string) =>
    apiClient.get<AttachmentDownloadResponse>(`/attachments/${attachmentId}/download`),
};

// WebSocket message types
export interface WsClientMessageSend {
  type: 'message.send';
  data: {
    text?: string;
    attachments?: string[]; // uids
    client_id?: string;
    reply_to_message_id?: string;
  };
}

export interface WsServerWelcome {
  type: 'welcome';
  data: {
    user_id: string;
    server_time: string;
  };
}

export interface WsServerMessageCreated {
  type: 'message.created';
  data: Message;
}

export interface WsError {
  type: 'error';
  data: ErrorResponse;
}
