<template>
  <div class="w-full h-full flex flex-col min-h-0" @click="handleCloseMenu">
    <!-- Оверлей состояния WebSocket -->
    <div
      v-if="showConnectionOverlay"
      class="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[25px] -m-4"
      style="background: rgba(108, 111, 172, 0.08)"
    >
      <div class="text-center text-neutral-50 font-golos">
        <div class="font-normal text-[12px] leading-[20px] text-neutral-50 font-unbounded">
          {{ connectionStatusText }}
        </div>
        <div
          v-if="!connected && !chatInitError"
          class="flex justify-center items-center gap-[3px] mt-[9px]"
        >
          <div
            class="w-[4.8px] h-[4.8px] bg-white rounded-[100px]"
            style="animation: dotFade1 1.5s infinite; opacity: 0"
          ></div>
          <div
            class="w-[6.4px] h-[6.4px] bg-white rounded-[100px]"
            style="animation: dotFade2 1.5s infinite; opacity: 0"
          ></div>
          <div
            class="w-[8px] h-[8px] bg-white rounded-[100px]"
            style="animation: dotFade3 1.5s infinite; opacity: 0"
          ></div>
        </div>
      </div>
    </div>

    <div
      ref="chatContainer"
      id="chat"
      class="w-full flex-1 overflow-auto space-y-3 custom-scrollbar min-h-0"
      :style="{
        'scrollbar-width': 'thin',
        'scrollbar-color': 'rgba(255, 255, 255, 0.2) transparent',
      }"
    >
      <ChatMsg
        v-for="message in allMessages"
        :key="message.seq_no"
        :data-message-id="message.message_id"
        v-bind="message"
        :is-mobile="isMobile"
        :msgColor="props.msgColor"
        :logoGradients="props.logoGradients"
        :isMenuOpen="openMenuMessage?.message_id === message.message_id"
        :isRead="true"
        @openMenu="handleOpenMenu($event, message)"
        :username="username"
        @closeMenu="handleCloseMenu"
      />
      <!-- <ChatMsg
        v-if="isParticipantTyping"
        id="typing-indicator"
        :key="'typing-indicator'"
        :msgColor="msgColor"
        senderName="pos5player"
        :isLocal="false"
        type="text"
        :time="new Date()"
        :isTyping="isParticipantTyping"
        :logoGradients="logoGradients"
      /> -->
    </div>
    <div id="footer" class="flex-shrink-0 w-full mt-[12px]">
      <ChatFooter
        ref="chatFooterRef"
        :accentColor="msgColor"
        :sendMessage="handleSendMessage"
        :canSendMessages="!!conversationId"
        :replyingMessage="replyingMessage"
        :conversationId="conversationId"
        :chatState="chatState"
        :is-mobile="isMobile"
        @sendRateConversation="handleRateConversation"
      />
    </div>

    <!-- Глобальное контекстное меню -->
    <div
      v-show="openMenuMessage"
      class="fixed z-50 flex flex-col gap-3 bg-[#131525] p-4 rounded-[20px] shadow-lg min-w-[180px]"
      :style="{ left: menuPosition.x + 'px', top: menuPosition.y + 'px' }"
      @click.stop
    >
      <button
        @click="replyMessage"
        class="flex items-center gap-2 self-stretch text-white transition-colors"
        @mouseenter="handleButtonHover"
        @mouseleave="handleButtonLeave"
      >
        <ReplySvg class="w-6 h-6" />
        <span class="font-medium text-sm text-center text-nowrap">Ответить</span>
      </button>
      <button
        v-if="openMenuMessage?.text?.length"
        @click="copyMessage"
        class="flex items-center gap-2 self-stretch text-white transition-colors"
        @mouseenter="handleButtonHover"
        @mouseleave="handleButtonLeave"
      >
        <CopySvg class="w-6 h-6" />
        <span class="font-medium text-sm text-center text-nowrap">Скопировать текст</span>
      </button>

      <!-- <button
        v-if="openMenuMessage?.sender === 'user'"
        @click="copyMessage"
        class="flex items-center gap-2 self-stretch text-white transition-colors"
        @mouseenter="handleButtonHover"
        @mouseleave="handleButtonLeave"
      >
        <CancelSvg class="w-6 h-6" />
        <span class="font-medium text-sm text-center text-nowrap">Отменить отправку</span>
      </button> -->
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watchEffect, watch, onUnmounted } from 'vue';
import ChatFooter from './ChatFooter.vue';
import ChatMsg from './ChatMsg.vue';
import { Message } from '@/composables/useChatSession';
import ReplySvg from '../assets/Reply.svg';
import CopySvg from '../assets/Copy.svg';
import { useRxSocket } from '../composables/useRxSocket';
import { tap } from 'rxjs/operators';
import { generateClientId } from '../utils/generateMessageClientId';
import { Attachment } from '../api/client';
import { ChatState } from '@/types/chat';
import { useRateConversation } from '../composables/useConversationApi';
import notificationSound from '../assets/8bit.mp3';

const chatState = ref<ChatState>('loading');

const props = defineProps<{
  msgColor: string;
  logoGradients: [string, string, string, string, string, string];
  messageHistory: Message[];
  conversationId: string;
  isLoadingHistory: boolean;
  clientId?: string;
  username?: string;
  isOpen?: boolean;
  onCreateNewConversation?: () => Promise<string>;
  chatInitError?: string | null;
  isMobile?: boolean;
}>();

const emit = defineEmits<{
  toggleUnreadMessage: [];
  updateVisibleDate: [date: string];
}>();

const chatContainer = ref<HTMLElement>();
const chatFooterRef = ref<InstanceType<typeof ChatFooter>>();
const replyingMessage = ref<Message | null>(null);

// Intersection Observer для отслеживания видимых сообщений
let intersectionObserver: IntersectionObserver | null = null;

const setupIntersectionObserver = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const messageId = entry.target.getAttribute('data-message-id');
        if (messageId) {
          if (entry.isIntersecting) {
            visibleMessages.value.add(messageId);
          } else {
            visibleMessages.value.delete(messageId);
          }
        }
      });
      // Принудительно обновляем реактивность
      visibleMessages.value = new Set(visibleMessages.value);
    },
    {
      root: chatContainer.value,
      threshold: 0.1, // Сообщение считается видимым если видно 10% от него
    }
  );

  // Сразу наблюдаем за всеми существующими сообщениями
  if (chatContainer.value) {
    const messageElements = chatContainer.value.querySelectorAll('[data-message-id]');
    messageElements.forEach((element) => {
      intersectionObserver?.observe(element);
    });
  }
};

const { newMessages$, sendMessage, connected, disableReconnection } = useRxSocket({
  conversationId: computed(() => props.conversationId),
  onCreateNewConversation: props.onCreateNewConversation,
  onReconnected: () => {
    nextTick(() => {
      scrollToBottom();
    });
  },
});

const rateConversation = useRateConversation();

// Логика показа оверлея состояния подключения
const showConnectionOverlay = computed(() => {
  if (props.chatInitError) {
    return chatState.value !== 'over' && chatState.value !== 'thankYou';
  }

  return (
    !connected.value &&
    chatState.value !== 'over' &&
    chatState.value !== 'thankYou'
  );
});

const connectionStatusText = computed(() => {
  if (props.chatInitError) {
    return 'Чат недоступен. Попробуйте позже';
  }
  if (!connected.value) {
    return 'Устанавливаем связь';
  }
  return 'Подключено';
});

// Функция для воспроизведения звука уведомления
const playNotificationSound = () => {
  try {
    const audio = new Audio(notificationSound);
    audio.volume = 0.5; // Устанавливаем громкость на 50%
    audio.play().catch((error) => {
      console.warn('[ChatContent] Failed to play notification sound:', error);
    });
  } catch (error) {
    console.warn('[ChatContent] Error creating audio:', error);
  }
};

// Реактивный список всех сообщений (история + новые)
const allMessages = ref<Message[]>([]);

// Отслеживаем видимые сообщения для определения даты в хедере
const visibleMessages = ref<Set<string>>(new Set());

// Отслеживаем изменения в видимых сообщениях и передаем дату самого нижнего видимого
watch(
  [allMessages, visibleMessages],
  ([messages, visible]) => {
    if (messages.length > 0 && visible.size > 0) {
      // Находим самое нижнее видимое сообщение (с наибольшим seq_no среди видимых)
      const visibleMessagesData = messages.filter((msg) => visible.has(msg.message_id));
      if (visibleMessagesData.length > 0) {
        const bottomVisibleMessage = visibleMessagesData.reduce((prev, current) =>
          prev.seq_no > current.seq_no ? prev : current
        );
        emit('updateVisibleDate', bottomVisibleMessage.created_at);
      }
    } else if (messages.length > 0) {
      // Если нет видимых сообщений, используем последнее
      const lastMessage = messages[messages.length - 1];
      emit('updateVisibleDate', lastMessage.created_at);
    }
  },
  { deep: true }
);

watch(
  () => connected.value,
  (newVal, oldVal) => {
    if (newVal) {
      chatState.value = 'active';

      // Если это переподключение (было false, стало true), скроллим вниз
      if (oldVal === false) {
        nextTick(() => scrollToBottom());
      }
    }
  }
);

// Создаем поток сообщений начиная с истории
watchEffect(() => {
  if (props.conversationId && newMessages$) {
    // Инициализируем allMessages с историей и добавляем replyingMessage
    const messagesWithReplies = props.messageHistory.map((message) => {
      let replyingMessageData = null;
      if (message.reply_to_message_id) {
        replyingMessageData =
          props.messageHistory.find((m) => m.message_id === message.reply_to_message_id) || null;
      }

      return {
        ...message,
        replyingMessage: replyingMessageData,
      } as Message & { replyingMessage?: Message | null };
    });

    allMessages.value = messagesWithReplies;

    const messagesStream$ = newMessages$.pipe(
      tap((wsMessage: any) => {
        // Обрабатываем закрытие разговора
        if (wsMessage.type === 'conversation.closed') {
          chatState.value = 'over';
          // Дополнительно отключаем переподключения через UI
          disableReconnection();
          return;
        }

        // Обрабатываем обычные сообщения
        if (wsMessage.type === 'message.created') {
          const newMessage = wsMessage.data as Message;

          let replyingMessage = null;
          if (newMessage.reply_to_message_id) {
            replyingMessage =
              allMessages.value.find((m) => m.message_id === newMessage.reply_to_message_id) ||
              null;
          }

          if (newMessage.sender === 'user') {
            const localMessageIndex = allMessages.value.findIndex(
              (m) =>
                (m as any).isReceived === false && m.sender === 'user' && m.text === newMessage.text
            );

            if (localMessageIndex !== -1) {
              allMessages.value[localMessageIndex] = {
                ...newMessage,
                replyingMessage: replyingMessage,
                isReceived: true,
              } as Message & { replyingMessage?: Message | null };
              return;
            }
          }

          // Проверяем дубликаты и добавляем новое сообщение (не от пользователя)
          const exists = allMessages.value.some((m) => m.message_id === newMessage.message_id);
          if (!exists) {
            // Добавляем сообщение с найденным replyingMessage
            const messageWithReply = {
              ...newMessage,
              replyingMessage: replyingMessage,
            } as Message & { replyingMessage?: Message | null };

            allMessages.value.push(messageWithReply);
            if (!props.isOpen) {
              emit('toggleUnreadMessage');
              if (newMessage.sender === 'support' || newMessage.sender === 'system') {
                playNotificationSound();
              }
            }
            nextTick(() => scrollToBottom());
          }
        }
      })
    );

    const sub = messagesStream$.subscribe();

    return () => {
      sub.unsubscribe();
    };
  }
});

// Функция для добавления локального сообщения при отправке
const addLocalMessage = (text: string, replyToMessageId?: string, attachments?: Attachment[]) => {
  // Находим сообщение, на которое отвечаем (если есть)
  let replyingMessageData = null;
  if (replyToMessageId) {
    replyingMessageData = allMessages.value.find((m) => m.message_id === replyToMessageId) || null;
  }

  const localMessage = {
    message_id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    conversation_id: props.conversationId,
    seq_no: allMessages.value.length, // временный seq_no
    sender: 'user',
    source: 'web',
    content_type: 'text',
    attachments: attachments || [],
    text,
    reply_to_message_id: replyToMessageId,
    replyingMessage: replyingMessageData,
    created_at: new Date().toISOString(),
    isReceived: false, // флаг для отслеживания локальных сообщений
  } as Message & { isReceived: boolean; replyingMessage?: Message | null };

  // Добавляем локально для мгновенного отклика
  allMessages.value.push(localMessage);
  nextTick(() => scrollToBottom());

  if (replyingMessage.value) {
    replyingMessage.value = null;
  }

  return localMessage;
};

const handleSendMessage = (text: string, replyToMessageId?: string, attachments?: Attachment[]) => {
  if (!props.conversationId) return;
  addLocalMessage(text, replyToMessageId, attachments);
  sendMessage(
    text,
    generateClientId(),
    replyToMessageId,
    attachments?.map((a) => a.attachment_id) || []
  );
};

const openMenuMessage = ref<Message | null>(null);
const menuPosition = ref({ x: 0, y: 0 });

// Открыть меню
const handleOpenMenu = (event: MouseEvent, message: Message) => {
  openMenuMessage.value = message;

  // Получаем размеры контейнера чата
  const chatRect = chatContainer.value?.getBoundingClientRect();
  if (!chatRect) return;

  // Размеры меню (примерные с учетом padding и кнопок)
  const menuWidth = 180;
  const menuHeight = 140;

  // Позиция клика относительно viewport
  let x = event.clientX;
  let y = event.clientY;

  // Проверяем, не выходит ли меню за правую границу
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 10;
  }

  // Проверяем, не выходит ли меню за нижнюю границу
  if (y + menuHeight > window.innerHeight) {
    y = y - menuHeight;
  }

  // Не даем меню уйти за левую границу
  if (x < 10) {
    x = 10;
  }

  // Не даем меню уйти за верхнюю границу
  if (y < 10) {
    y = 10;
  }

  menuPosition.value = { x, y };
};

// Закрыть меню
const handleCloseMenu = () => {
  openMenuMessage.value = null;
};

// Копировать сообщение
const copyMessage = () => {
  if (openMenuMessage.value?.text) {
    navigator.clipboard.writeText(openMenuMessage.value.text);
  }
  handleCloseMenu();
};

const replyMessage = () => {
  replyingMessage.value = openMenuMessage.value;
  handleCloseMenu();

  // Фокусируемся на input в ChatFooter
  nextTick(() => {
    chatFooterRef.value?.focusInput();
  });
};

const handleRateConversation = async (isPositive: boolean) => {
  try {
    await rateConversation.mutateAsync({
      conversation_id: props.conversationId,
      user_id: props.clientId || '',
      is_like: isPositive,
    });

    chatState.value = 'thankYou';
  } catch (error) {
    console.error('Failed to rate conversation:', error);
  }
};

const handleButtonHover = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  target.style.color = props.msgColor;
};

const handleButtonLeave = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  target.style.color = 'white';
};

// Функция для скролла в самый низ
const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

// Скролл в низ при инициализации
onMounted(async () => {
  await nextTick();
  scrollToBottom();
  setupIntersectionObserver();
});

// Наблюдаем за изменениями в allMessages чтобы переустановить observer
watch(
  allMessages,
  async () => {
    await nextTick();
    setupIntersectionObserver();
  },
  { flush: 'post' }
);

// Cleanup intersection observer
onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }
});
</script>
