import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import {
  conversationsApi,
  messagesApi,
  type Conversation,
  type Message,
  type ConversationCreateRequest,
  type MessageCreateRequest,
} from '../api/client';

export const queryKeys = {
  conversations: (user_id: string) => ['conversations', user_id] as const,
  messages: (conversation_id: string) => ['messages', conversation_id] as const,
} as const;

export function useConversations(user_id: Ref<string>) {
  return useQuery({
    queryKey: computed(() => queryKeys.conversations(user_id.value)),
    queryFn: () => conversationsApi.list(user_id.value),
    enabled: computed(() => !!user_id.value),
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConversationCreateRequest) => conversationsApi.create(data),
    onSuccess: (newConversation, variables) => {
      queryClient.setQueryData(queryKeys.conversations(variables.user.id), (oldData: any) => {
        if (!oldData) return { items: [newConversation] };
        return {
          ...oldData,
          items: [newConversation, ...oldData.items],
        };
      });
    },
  });
}

export function useUpdateConversationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversation_id,
      user_id,
      status,
    }: {
      conversation_id: string;
      user_id: string;
      status: 'open' | 'pending' | 'closed';
    }) => conversationsApi.updateStatus(conversation_id, user_id, status),
    onSuccess: (updatedConversation, variables) => {
      // Обновляем кэш разговора
      queryClient.setQueryData(queryKeys.conversations(variables.user_id), (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((conv: Conversation) =>
            conv.id === updatedConversation.id ? updatedConversation : conv
          ),
        };
      });
    },
  });
}

export function useMessageHistory(conversationId: Ref<string>) {
  return useQuery({
    queryKey: computed(() => queryKeys.messages(conversationId.value)),
    queryFn: () => messagesApi.getHistory(conversationId.value),
    enabled: computed(() => !!conversationId.value),
    // Сортируем сообщения по seq_no
    select: (data) => ({
      ...data,
      items: data.items
        .sort((a, b) => a.seq_no - b.seq_no)
        .map((msg) => ({ ...msg, isReceived: true })),
    }),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: MessageCreateRequest;
    }) => messagesApi.send(conversationId, data),
    onSuccess: (newMessage, variables) => {
      // Добавляем новое сообщение в кэш
      queryClient.setQueryData(queryKeys.messages(variables.conversationId), (oldData: any) => {
        if (!oldData)
          return {
            conversation_id: variables.conversationId,
            items: [newMessage],
            next_after_seq: newMessage.seq_no + 1,
          };

        return {
          ...oldData,
          items: [...oldData.items, newMessage].sort((a, b) => a.seq_no - b.seq_no),
          next_after_seq: Math.max(oldData.next_after_seq, newMessage.seq_no + 1),
        };
      });
    },
  });
}

export function useRateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversation_id,
      user_id,
      is_like,
    }: {
      conversation_id: string;
      user_id: string;
      is_like: boolean;
    }) => conversationsApi.rate(conversation_id, user_id, { is_like }),
    onSuccess: (updatedConversation: Conversation, variables) => {
      // Обновляем кэш разговора
      queryClient.setQueryData(queryKeys.conversations(variables.user_id), (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((conv: Conversation) =>
            conv.id === updatedConversation.id ? updatedConversation : conv
          ),
        };
      });
    },
  });
}

export function useAddMessageFromWS() {
  const queryClient = useQueryClient();

  return (message: Message) => {
    queryClient.setQueryData(queryKeys.messages(message.conversation_id), (oldData: any) => {
      if (!oldData)
        return {
          conversation_id: message.conversation_id,
          items: [message],
          next_after_seq: message.seq_no + 1,
        };

      const exists = oldData.items.some((m: Message) => m.message_id === message.message_id);
      if (exists) return oldData;

      return {
        ...oldData,
        items: [...oldData.items, message].sort((a, b) => a.seq_no - b.seq_no),
        next_after_seq: Math.max(oldData.next_after_seq, message.seq_no + 1),
      };
    });
  };
}

export const useConversationApi = () => ({
  useConversations,
  useCreateConversation,
  useUpdateConversationStatus,
  useRateConversation,
  useMessageHistory,
  useSendMessage,
  useAddMessageFromWS,
});

export function useActiveSupportChat(userId: Ref<string>, userName: Ref<string>) {
  const createConversation = useCreateConversation();
  const updateStatus = useUpdateConversationStatus();

  const { data: conversations, isLoading: isLoadingConversations } = useConversations(userId);

  const activeSupportChat = computed(() => {
    if (!conversations.value?.items) return null;

    return (
      conversations.value.items.find(
        (conv) => conv.type === 'support' && conv.status !== 'closed'
      ) || null
    );
  });

  const getOrCreateSupportChat = async () => {
    if (activeSupportChat.value) {
      if (activeSupportChat.value.status === 'pending') {
        await updateStatus.mutateAsync({
          conversation_id: activeSupportChat.value.id,
          user_id: userId.value,
          status: 'open',
        });
      }
      return activeSupportChat.value;
    }

    if (conversations.value?.items) {
      const oldSupportChats = conversations.value.items.filter(
        (conv) => conv.type === 'support' && conv.status !== 'closed'
      );

      for (const chat of oldSupportChats) {
        await updateStatus.mutateAsync({
          conversation_id: chat.id,
          user_id: userId.value,
          status: 'closed',
        });
      }
    }

    const newConversation = await createConversation.mutateAsync({
      type: 'support',
      user: {
        id: userId.value,
        username: userName.value,
      },
      source: 'web',
      page_url: window.location.href,
      locale: navigator.language,
      timezone: -(new Date().getTimezoneOffset() / 60),
      app_version: '1.0.0',
    });

    return newConversation;
  };

  return {
    activeSupportChat,
    isLoadingConversations,
    getOrCreateSupportChat,
    isCreating: computed(() => createConversation.isPending.value),
    isUpdating: computed(() => updateStatus.isPending.value),
  };
}
