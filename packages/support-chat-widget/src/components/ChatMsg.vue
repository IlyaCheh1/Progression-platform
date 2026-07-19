<template>
  <!-- Сообщения поддержки -->
  <div v-if="isSupportMsg" class="relative">
    <div @contextmenu.prevent="onContextMenu" class="inline-block text-left w-full cursor-default">
      <div class="w-full flex gap-[10px]">
        <div id="avatar" class="h-full">
          <SupportAvatar :logo-gradients="logoGradients" />
        </div>
        <div
          id="message"
          class="px-[12px] py-[8px] flex flex-col gap-0.5 rounded-tr-[20px] rounded-br-[20px] rounded-bl-[20px] min-w-[120px]"
          style="background: rgba(108, 111, 172, 0.08)"
        >
          <div class="w-full">
            <span class="font-normal text-[12px] leading-[20px] font-unbounded text-neutral-50">{{
              'Йеннифер'
            }}</span>
          </div>

          <div v-if="attachments && attachments.length > 0" id="attachment-msg" class="w-full">
            <Attachments
              :is-support-msg="isSupportMsg"
              :has-text="!!text"
              :attachments="attachments"
            />
          </div>

          <div
            id="message-content"
            v-if="!isTyping && text"
            :class="
              text && text.length > 30
                ? 'flex flex-col gap-[4px] font-normal text-sm font-golos'
                : 'grid grid-cols-[1fr_auto] gap-[15px] font-normal text-sm font-golos items-end'
            "
          >
            <div id="msg" class="min-w-0">
              <span
                class="text-neutral-50 break-words word-break-break-word whitespace-pre-wrap"
                :class="[isMobile ? 'text-[16px]' : 'text-sm']"
                >{{ text }}</span
              >
            </div>
            <div
              id="time"
              :class="text && text.length > 30 ? 'flex items-end justify-end' : 'flex items-end'"
            >
              <span class="text-neutral-50 font-normal text-xs whitespace-nowrap">{{
                formatTime(created_at)
              }}</span>
            </div>
          </div>

          <!-- Время отдельно для сообщений только с аттачментами -->
          <div
            v-else-if="!isTyping && !text && attachments && attachments.length > 0"
            id="time-only"
            class="flex justify-end"
          >
            <div class="bg-black/20 backdrop-blur-sm rounded px-2 py-1">
              <span class="text-neutral-50 font-normal text-xs">{{ formatTime(created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Сообщения пользователя -->
  <div v-else class="relative">
    <div @contextmenu.prevent="onContextMenu" class="flex justify-end w-full cursor-default">
      <div class="flex flex-col max-w-[85%]">
        <div id="attachment">
          <Attachments v-if="attachments" :has-text="!!text" :attachments="attachments" />
        </div>

        <div
          id="message_content"
          :style="{
            background: !!text ? msgColor : 'rgba(108, 111, 172, 0.08)',
          }"
          class="flex flex-col gap-[4px] text-neutral-50"
          :class="[
            !!attachments && attachments.length > 0 ? '' : 'rounded-tl-[20px]',
            !text
              ? 'absolute bottom-[8px] right-[8px] p-[4px] rounded-[8px] backdrop-blur-[20px]'
              : 'rounded-br-[20px] rounded-bl-[20px] px-3 py-2 min-w-[80px]',
          ]"
        >
          <div
            class="flex gap-[6px] items-center rounded-[2px]"
            v-if="replyingMessage"
            style="background: rgba(255, 255, 255, 0.08)"
          >
            <MsgSeparatorBig class="text-white" />
            <div class="flex flex-col min-w-0">
              <span class="font-normal text-[10px] leading-3 text-neutral-50 opacity-50 truncate">{{
                replyUserName
              }}</span>
              <span class="font-normal text-xs text-neutral-50 truncate break-words">{{
                replyingMessage.text
              }}</span>
            </div>
          </div>

          <div
            :class="
              text && text.length > 30
                ? 'flex flex-col gap-[4px] w-full'
                : 'grid grid-cols-[1fr_auto] gap-[4px] items-end w-full'
            "
          >
            <div v-if="text?.length" class="min-w-0">
              <span
                class="font-normal text-start text-sm break-words word-break-break-word whitespace-pre-wrap"
                :class="[isMobile ? 'text-[16px]' : 'text-sm']"
                >{{ text }}</span
              >
            </div>
            <div
              :class="
                text && text.length > 30
                  ? 'flex gap-[4px] items-end justify-end'
                  : 'flex gap-[4px] items-end'
              "
            >
              <span class="font-normal text-xs whitespace-nowrap">{{
                formatTime(created_at)
              }}</span>
              <span v-if="isReceived"><IsRead /></span>
              <span v-else><SentSvg /></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Message } from '@/composables/useChatSession';
import IsRead from '../assets/IsRead.svg';
import SentSvg from '../assets/MsgSent.svg';
import SupportAvatar from './svg/SupportAvatar.vue';
import Attachments from './MsgAttachments.vue';
import MsgSeparatorBig from '../assets/MsgSeparatorBig.svg';
import { computed } from 'vue';

const props = defineProps<
  Message & {
    msgColor: string;
    logoGradients: [string, string, string, string, string, string];
    isMenuOpen?: boolean;
  } & {
    username?: string;
    isTyping?: boolean; // TODO
    isMobile?: boolean;
  }
>();

const emit = defineEmits<{
  openMenu: [event: MouseEvent, message: Message];
  closeMenu: [];
}>();

const isSupportMsg = computed(() => {
  return props.sender === 'support' || props.sender === 'system';
});

function onContextMenu(event: MouseEvent) {
  emit('openMenu', event, props);
}

const replyUserName = computed(() => {
  return props.replyingMessage?.sender === 'user' ? props.username || 'Вы' : 'Йеннифер';
});

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
</script>
