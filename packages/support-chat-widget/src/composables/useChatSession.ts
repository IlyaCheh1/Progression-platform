import { ref, computed, watch, type Ref } from 'vue';
import { useCreateConversation, useMessageHistory } from './useConversationApi';

// Re-export types from API client for compatibility
export type {
  Message,
  ConversationType,
  SenderType,
  ConversationStatus,
  SourceType,
  ContentType,
} from '../api/client';

export interface UseChatSessionOptions {
  userId: Ref<string>;
  userName: Ref<string>;
  topic?: Ref<string>;
  needToInitializeChat?: Ref<boolean>;
}

export function useChatSession({
  userId,
  userName,
  topic,
  needToInitializeChat,
}: UseChatSessionOptions) {
  const conversationId = ref<string>('');
  const isInitialized = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Создание новой conversation
  const createConversationMutation = useCreateConversation();

  const {
    data: messageHistory,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useMessageHistory(conversationId);

  // Инициализация чата - всегда создаем новую conversation
  const initializeChat = async () => {
    if (!userId.value || !userName.value) {
      console.warn('[Chat] Missing userId or userName');
      error.value = 'Missing user credentials';
      return;
    }

    if (isLoading.value) {
      console.warn('[Chat] Already initializing');
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      console.log('[Chat] Creating new support conversation...');

      // Всегда создаем новую conversation для support
      const conversation = await createConversationMutation.mutateAsync({
        type: 'support',
        user: {
          id: userId.value,
          username: userName.value,
        },
        source: 'web',
        page_url: window.location.href,
        locale: navigator.language,
        timezone: -(new Date().getTimezoneOffset() / 60), // Часовой пояс в часах
        app_version: '1.0.0',
        topic: topic?.value,
      });

      conversationId.value = conversation.id;

      // Загружаем историю сообщений если есть
      await refetchHistory();

      isInitialized.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize chat';
    } finally {
      isLoading.value = false;
    }
  };

  // Автоматическая инициализация при изменении пользователя
  watch(
    [userId, userName, needToInitializeChat],
    ([newUserId, newUserName, newNeedToInitializeChat]) => {
      if (newUserId && newUserName && !isInitialized.value && newNeedToInitializeChat) {
        initializeChat();
      }
    },
    { immediate: true }
  );

  // Создание нового разговора (для переподключения после закрытия)
  const createNewConversation = async (): Promise<string> => {
    if (!userId.value || !userName.value) {
      throw new Error('Missing user credentials');
    }

    try {
      const conversation = await createConversationMutation.mutateAsync({
        type: 'support',
        user: {
          id: userId.value,
          username: `${userName.value}_${Math.random().toString(36).substring(2, 8)}`,
        },
        source: 'web',
        page_url: window.location.href,
        locale: navigator.language,
        timezone: -(new Date().getTimezoneOffset() / 60),
        app_version: '1.0.0',
      });

      conversationId.value = conversation.id;
      console.log('[Chat] Created new conversation for reconnection');

      return conversation.id;
    } catch (err) {
      console.error('[Chat] Failed to create new conversation:', err);
      throw err;
    }
  };

  // Computed свойства для удобства
  const messages = computed(() => messageHistory.value?.items || []);

  return {
    // State
    conversationId: computed(() => conversationId.value),
    messageHistory: messages,
    isLoading: computed(() => isLoading.value),
    isLoadingHistory: computed(() => isLoadingHistory.value),
    isInitialized: computed(() => isInitialized.value),
    error: computed(() => error.value),

    // Actions
    initializeChat,
    refetchHistory,
    createNewConversation,
  };
}
