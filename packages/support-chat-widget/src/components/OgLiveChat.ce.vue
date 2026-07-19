<template>
  <div id="chatContainer" :class="containerClasses">
    <!-- Полноэкранная подложка с backdrop-blur (только в fullscreen режиме) -->
    <div
      v-if="shouldUseFullscreen && isOpen"
      class="fixed inset-0 w-full h-full backdrop-blur-sm bg-black/20 z-20"
    >
      <!-- Кнопка "Назад" динамически позиционируется над чатом -->
      <div class="absolute z-40" :style="backButtonStyle">
        <button
          class="h-[36px] w-[83px] flex items-center px-1 py-2 rounded-xl backdrop-blur-[25px]"
          style="background: rgba(108, 111, 172, 0.08)"
          @click="toggleChat"
        >
          <Back class="mx-[10px]" />
          <span class="font-medium text-sm text-center text-neutral-50">Назад</span>
        </button>
      </div>
    </div>

    <!-- Окно чата (всегда создается после первого открытия, но показывается только когда isOpen = true) -->
    <div
      v-if="isChatEverOpened"
      v-show="isOpen"
      :class="chatClasses"
      :style="fullscreenStyle"
      class="relative"
    >
      <!-- Фоновые градиенты -->
      <div class="absolute inset-0 w-full h-full">
        <ChatBgGradients :gradients="gradients" class="w-full h-full" />
      </div>

      <!-- Содержимое чата поверх фона -->
      <div class="relative z-10 w-full h-full flex flex-col gap-[12px]">
        <ChatHeader :visible-message-date="visibleMessageDate" />
        <!-- ChatContent создается один раз и остается смонтированным -->
        <ChatContent
          :msg-color="mainAccent"
          :logo-gradients="logoGradients"
          :message-history="messageHistory"
          :conversation-id="conversationId"
          :is-loading-history="isLoadingHistory"
          :client-id="userId"
          :username="userName"
          :on-create-new-conversation="createNewConversation"
          :chat-init-error="chatInitError"
          :isOpen="isOpen"
          :is-mobile="shouldUseFullscreen"
          @toggle-unread-message="toggleUnreadMessage"
          @update-visible-date="updateVisibleDate"
        />
      </div>
    </div>

    <!-- Кнопка чата (скрывается только когда чат открыт в полноэкранном режиме) -->
    <div
      v-if="!(isOpen && shouldUseFullscreen)"
      :class="[buttonContainerClasses, 'pointer-events-auto']"
    >
      <button
        @click="toggleChat"
        :class="[
          buttonClasses,
          'flex mt-[16px] items-center justify-center active:scale-95 relative',
        ]"
        :style="{
          outline: 'none',
          background: buttonBg,
        }"
        aria-label="Открыть чат"
      >
        <Chat />

        <div
          v-if="unreadMessage"
          class="absolute top-0 right-0 w-2.5 h-2.5 rounded-[100px] outline-4 outline-t-4 outline-l-4 outline-r-4 outline-b-4 outline outline-[#0b0b0c]"
          :style="{ backgroundColor: mainAccent }"
        ></div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useAttribute, type OgChatAttributes } from '../composables/useAttribute';
import { useDevice } from '../composables/useDevice';
import { useChatSession } from '../composables/useChatSession';
import { setChatEndpoints } from '../lib/chat-config';
import Chat from '../assets/Chat.svg';
import ChatBgGradients from './ChatBgGradients.vue';
import ChatHeader from './ChatHeader.vue';
import ChatContent from './ChatContent.vue';
import Back from '../assets/Back.svg';
const isOpen = ref(false);
const isChatEverOpened = ref(false);
const unreadMessage = ref(false);

const props = withDefaults(defineProps<OgChatAttributes>(), {
  position: 'bottom-right',
  theme: 'mos',
  sizeClass: 'w-[342px] h-[600px]',
  userId: undefined,
  userName: undefined,
  topic: undefined,
  apiBaseUrl: undefined,
  wsBaseUrl: undefined,
});

watch(
  () => [props.apiBaseUrl, props.wsBaseUrl] as const,
  ([apiBaseUrl, wsBaseUrl]) => {
    setChatEndpoints(apiBaseUrl, wsBaseUrl);
  },
  { immediate: true }
);

const {
  conversationId,
  messageHistory,
  isLoadingHistory,
  createNewConversation,
  error: chatInitError,
} = useChatSession({
  userId: computed(() => props.userId || ''),
  userName: computed(() => props.userName || ''),
  topic: computed(() => props.topic || ''),
  needToInitializeChat: computed(() => isChatEverOpened.value), // Инициализируем только когда открыт чат
});

const visibleMessageDate = ref<string | Date>(new Date());

const updateVisibleDate = (date: string) => {
  visibleMessageDate.value = date;
};

// обработчик для закрытия чата при взаимодействии снаружи
const onDocumentInteraction = (evt: Event) => {
  if (!isOpen.value) return;

  const target = evt.target as Element | null;
  if (!target) return;

  const ogChatElement = target.closest('og-chat');
  const isInsideWebComponent = !!ogChatElement;

  if (!isInsideWebComponent) {
    isOpen.value = false;
  }
};

watch(isOpen, (newValue) => {
  if (newValue && !isChatEverOpened.value) {
    isChatEverOpened.value = true;
  }

  if (isOpen.value) {
    unreadMessage.value = false;
  }
});

const toggleUnreadMessage = () => {
  if (!isOpen.value) {
    unreadMessage.value = true;
  }
};

const { shouldUseFullscreen } = useDevice();
const isFullscreenMode = computed(() => shouldUseFullscreen.value && isOpen.value);

const containerClasses = computed(() => {
  if (isFullscreenMode.value) {
    return [
      'fixed inset-0 z-40',
      'flex flex-col justify-end items-center', // Прижимаем к низу
      'w-full h-full',
    ].join(' ');
  }

  if (!isOpen.value) {
    return ['fixed pointer-events-none'].join(' ');
  }

  return [sizeClasses.value, 'fixed flex flex-col justify-end'].join(' ');
});

const chatClasses = computed(() => {
  if (isFullscreenMode.value) {
    return [
      chatWindowClasses.value,
      'relative overflow-hidden',
      'w-full',
      'z-30', // Чат поверх подложки (такой же как кнопка)
      'rounded-t-[32px]',
    ].join(' ');
  }

  return chatWindowClasses.value + ' relative overflow-hidden rounded-[32px]';
});

const fullscreenStyle = computed(() => {
  if (isFullscreenMode.value) {
    return {
      height: 'calc(var(--app-vh, 100vh) * 0.8)',
      maxHeight: 'calc(var(--app-vh, 100vh) * 0.8)',
    };
  }
  return {};
});

// Динамическая позиция кнопки "Назад" - над окном чатаß
const backButtonStyle = computed(() => {
  if (isFullscreenMode.value) {
    return {
      bottom: 'calc(var(--app-vh, 100vh) * 0.8 + 62px)', // Высота чата + отступ
      left: '16px',
    };
  }
  return {};
});

function updateAppVh() {
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty('--app-vh', `${vh}px`);
}

onMounted(() => {
  updateAppVh();
  window.visualViewport?.addEventListener('resize', updateAppVh);
  window.addEventListener('resize', updateAppVh);

  document.addEventListener('pointerdown', onDocumentInteraction, { capture: true });
  document.addEventListener('touchstart', onDocumentInteraction, { capture: true });
});

onBeforeUnmount(() => {
  window.visualViewport?.removeEventListener('resize', updateAppVh);
  window.removeEventListener('resize', updateAppVh);
  document.documentElement.style.removeProperty('--app-vh');

  document.removeEventListener('pointerdown', onDocumentInteraction, { capture: true });
  document.removeEventListener('touchstart', onDocumentInteraction, { capture: true });
});

watch(isFullscreenMode, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

const {
  sizeClasses,
  buttonClasses,
  buttonContainerClasses,
  chatWindowClasses,
  gradients,
  mainAccent,
  logoGradients,
  buttonBg,
} = useAttribute(props);

const toggleChat = () => {
  isOpen.value = !isOpen.value;
};
</script>
