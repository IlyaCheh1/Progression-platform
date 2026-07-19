<template>
  <!--Rate support block-->
  <div
    v-if="chatState === 'over'"
    class="w-full flex justify-center items-center backdrop-blur-[25px] rounded-[20px] mb-[16px] py-[12px]"
    style="background: rgba(108, 111, 172, 0.08)"
  >
    <div class="flex flex-col gap-[12px] text-[#64748B] font-golos">
      <span class="font-normal text-xs text-center">Мы помогли вам?</span>
      <div class="flex gap-[8px]">
        <button
          style="background: rgba(108, 111, 172, 0.08)"
          class="w-[44px] h-[44px] backdrop-blur-[25px] rounded-full flex justify-center items-center"
          @click="$emit('sendRateConversation', false)"
        >
          <SadFace />
        </button>
        <button
          style="background: rgba(108, 111, 172, 0.08)"
          class="w-[44px] h-[44px] backdrop-blur-[25px] rounded-full flex justify-center items-center"
          @click="$emit('sendRateConversation', true)"
        >
          <Heart />
        </button>
      </div>
    </div>
  </div>

  <!--Thank you block-->
  <div
    v-if="chatState === 'thankYou'"
    class="w-full flex justify-center items-center backdrop-blur-[25px] rounded-[20px] mb-[16px] py-[12px]"
    style="background: rgba(108, 111, 172, 0.08)"
  >
    <span class="font-golos font-normal text-xs text-center text-neutral-50"
      >Спасибо за оценку 💜</span
    >
  </div>

  <!--FOR LATER <div v-if="showLinksBlock" class="w-full flex flex-col gap-[12px] mb-[24px]">

  </div> -->

  <div
    v-if="attachedFiles.length > 0"
    class="p-[12px] flex flex-col gap-[10px] rounded-[20px] mb-[12px]"
    style="background: rgba(108, 111, 172, 0.08)"
  >
    <div class="flex gap-[10px]">
      <span class="font-normal text-[12px] leading-[10px] text-neutral-50 opacity-50"
        >{{ attachedFiles.length }} фото</span
      >

      <span
        :style="{ color: accentColor }"
        class="font-normal text-[12px] leading-[10px] cursor-pointer"
        @click="removeAllFiles"
        >Отменить</span
      >
    </div>
    <div class="flex gap-[8px]">
      <div
        v-for="file in attachedFiles"
        :key="file.attachment_id"
        class="group relative w-[40px] h-[40px] rounded-[12px] overflow-hidden bg-gray-200 flex justify-center items-center"
      >
        <img :src="file.download_url" :alt="file.file_name" class="w-full h-full object-cover" />
        <button
          style="background: rgba(108, 111, 172, 0.08)"
          @click="removeFile(file.attachment_id)"
          class="absolute top-[8px] left-[8px] backdrop-blur-[25px] w-[23.999998092651367px] h-[23.999998092651367px] rounded-lg flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Cross />
        </button>
      </div>
    </div>
    <span
      v-if="exceedsFileLimit"
      class="font-normal text-[12px] leading-3 text-neutral-50 opacity-50"
      >Превышен максимум</span
    >
  </div>

  <div class="flex gap-[10px] grow w-full min-h-[44px]">
    <div
      class="rounded-[24px] flex-1 flex flex-col overflow-hidden"
      style="background: rgba(108, 111, 172, 0.08)"
    >
      <!-- Replying message -->
      <div class="px-[14px] mt-[10px] flex gap-[6px] items-center w-full" v-if="replyingMessage">
        <MsgSeparator />
        <div class="flex flex-col w-full min-w-0">
          <span class="font-normal text-[10px] leading-3 text-neutral-50 opacity-50 truncate">{{
            replyingMessage.sender
          }}</span>
          <span class="font-normal text-xs text-neutral-50 truncate">{{
            replyingMessage.text
          }}</span>
        </div>
      </div>

      <div class="flex items-end flex-1">
        <div class="flex justify-center items-center h-full pl-[10px]">
          <button
            :disabled="chatState !== 'active'"
            class="mr-[6px] w-[24px] h-[24px] flex-shrink-0 transition-opacity"
            :class="chatState === 'active' ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'"
            @click="attachFile"
          >
            <AttachFile
              class="w-6 h-6 text-[#64748b] transition-colors"
              :class="chatState === 'active' ? 'hover:text-neutral-50' : ''"
            />
          </button>
        </div>

        <!-- Скрытый input для выбора файлов -->
        <input
          ref="fileInputRef"
          type="file"
          multiple
          accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg"
          @change="handleFileSelect"
          style="display: none"
        />

        <!-- Chat Textarea -->
        <textarea
          ref="textareaRef"
          v-model="message"
          placeholder="Сообщение..."
          rows="1"
          @input="adjustHeight"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.enter.shift.exact="addNewLine"
          class="flex-1 py-[10px] bg-transparent border-none outline-none text-neutral-50 placeholder-[#64748b] font-golos resize-none max-h-[120px] min-h-[24px] leading-6 hide-scrollbar"
          :class="[isMobile ? 'text-md' : 'text-sm']"
          style="
            word-wrap: break-word;
            white-space: pre-wrap;
            overflow-wrap: break-word;
            overflow-y: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          "
        ></textarea>

        <!-- Smiles -->
        <div class="py-[4px] pr-[4px]">
          <SmileBtn @emoji-select="insertEmoji" />
        </div>
      </div>
    </div>

    <!-- Send btn -->
    <div class="flex items-end">
      <button
        @click="sendMessage"
        :disabled="sendDisabled"
        class="flex items-center justify-center w-[44px] cursor-pointer h-[44px] rounded-[24px] transition-colors disabled:cursor-not-allowed"
        :class="[!sendDisabled ? 'text-neutral-50 cursor-not-allowed' : 'text-[#64748b]']"
        :style="{
          background: !sendDisabled ? props.accentColor : 'rgba(108, 111, 172, 0.08)',
        }"
      >
        <SendMsg class="w-6 h-6" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import AttachFile from '../assets/AttachFile.svg';
import SendMsg from '../assets/SendMsg.svg';
import SadFace from '../assets/SadFace.svg';
import Heart from './svg/Heart.vue';
import SmileBtn from './SmileBtn.vue';
import MsgSeparator from '../assets/MsgSeparator.svg';
import Cross from '../assets/Cross.svg';
import { Message } from '../composables/useChatSession';
import { Attachment, attachmentsApi } from '../api/client';
import { ChatState } from '@/types/chat';

const props = defineProps<{
  accentColor: string;
  sendMessage?: (text: string, replyToMessageId?: string, attachments?: Attachment[]) => void;
  canSendMessages?: boolean;
  replyingMessage?: Message | null;
  conversationId?: string;
  chatState?: ChatState;
  isMobile?: boolean;
}>();

defineEmits<{
  sendRateConversation: [isPositive: boolean];
}>();

const message = ref('');

const attachedFiles = ref<Attachment[]>([]);
const fileInputRef = ref<HTMLInputElement>();
const isUploading = ref<boolean>(false);
const exceedsFileLimit = ref<boolean>(false);

const textareaRef = ref<HTMLTextAreaElement>();

// Функция открытия проводника
const attachFile = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const removeAllFiles = () => {
  attachedFiles.value.forEach((file) => {
    URL.revokeObjectURL(file.download_url || '');
  });
  attachedFiles.value = [];
  exceedsFileLimit.value = false; // Сбрасываем флажок
};

// Обработка выбранных файлов
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    const selectedFiles = Array.from(target.files);

    const totalFiles = attachedFiles.value.length + selectedFiles.length;
    let filesToProcess = selectedFiles;

    // Если превышает лимит, берем только первые файлы до лимита
    if (totalFiles > 6) {
      const availableSlots = 6 - attachedFiles.value.length;
      filesToProcess = selectedFiles.slice(0, availableSlots);
      exceedsFileLimit.value = true;
    } else {
      exceedsFileLimit.value = false;
    }

    isUploading.value = true;

    for (const file of filesToProcess) {
      if (isValidImageFile(file)) {
        const tempAttachment: Attachment = {
          attachment_id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file_name: file.name,
          size_bytes: file.size,
          content_type: file.type,
          download_url: URL.createObjectURL(file),
        };
        attachedFiles.value.push(tempAttachment);

        uploadAndUpdateAttachment(file, tempAttachment.attachment_id);
      } else {
        alert(`Файл ${file.name} не поддерживается. Разрешены только изображения.`);
      }
    }

    target.value = '';
  }
};

// Загрузка файла и обновление attachment_id
const uploadAndUpdateAttachment = async (file: File, tempId: string) => {
  if (!props.conversationId) {
    console.error('No conversationId provided');
    return;
  }

  try {
    const initResponse = await attachmentsApi.init(props.conversationId, {
      file_name: file.name,
      content_type: file.type,
      size_bytes: file.size,
    });

    await fetch(initResponse.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    await attachmentsApi.complete(initResponse.attachment_id, props.conversationId);

    const index = attachedFiles.value.findIndex((f) => f.attachment_id === tempId);
    if (index !== -1) {
      attachedFiles.value[index].attachment_id = initResponse.attachment_id;
    }
  } catch (error) {
    console.error('Failed to upload attachment:', error);
    const index = attachedFiles.value.findIndex((f) => f.attachment_id === tempId);
    if (index !== -1) {
      URL.revokeObjectURL(attachedFiles.value[index].download_url || '');
      attachedFiles.value.splice(index, 1);
    }
  } finally {
    const hasTemporaryFiles = attachedFiles.value.some((file) =>
      file.attachment_id.startsWith('temp-')
    );
    if (!hasTemporaryFiles) {
      isUploading.value = false;
    }
  }
};

const sendDisabled = computed(() => {
  const hasMessage = message.value.trim().length > 0 && props.canSendMessages;
  const hasAttachments = attachedFiles.value.length > 0;

  if (hasAttachments) {
    const hasTemporaryFiles = attachedFiles.value.some((file) =>
      file.attachment_id.startsWith('temp-')
    );
    return (
      (!hasMessage && !hasAttachments) ||
      hasTemporaryFiles ||
      isUploading.value ||
      props.chatState !== 'active'
    );
  }

  return !hasMessage && !hasAttachments;
});

// Проверка типа файла
const isValidImageFile = (file: File): boolean => {
  const validTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
  ];
  return validTypes.includes(file.type);
};

const removeFile = (fileId: string) => {
  const index = attachedFiles.value.findIndex((f) => f.attachment_id === fileId);
  if (index !== -1) {
    URL.revokeObjectURL(attachedFiles.value[index].download_url || '');
    attachedFiles.value.splice(index, 1);

    // Если файлов стало меньше 6, сбрасываем флажок
    if (attachedFiles.value.length < 6) {
      exceedsFileLimit.value = false;
    }
  }
};

const adjustHeight = async () => {
  await nextTick();
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';

    const scrollHeight = textareaRef.value.scrollHeight;
    const maxHeight = 120;
    const newHeight = Math.min(scrollHeight, maxHeight);

    textareaRef.value.style.height = newHeight + 'px';
  }
};

const sendMessage = () => {
  if (
    (message.value.trim() || attachedFiles.value.length > 0) &&
    props.canSendMessages &&
    props.sendMessage
  ) {
    props.sendMessage(message.value.trim(), props.replyingMessage?.message_id, attachedFiles.value);

    message.value = '';

    attachedFiles.value.forEach((file) => {
      URL.revokeObjectURL(file.download_url || '');
    });
    attachedFiles.value = [];
    exceedsFileLimit.value = false; // Сбрасываем флажок

    adjustHeight();
  }
};

const insertEmoji = (emoji: string) => {
  if (textareaRef.value) {
    const start = textareaRef.value.selectionStart;
    const end = textareaRef.value.selectionEnd;
    const beforeText = message.value.substring(0, start);
    const afterText = message.value.substring(end);

    message.value = beforeText + emoji + afterText;

    let rawText = message.value;
    message.value = rawText;

    nextTick(() => {
      if (textareaRef.value) {
        const newPosition = start + emoji.length;
        textareaRef.value.setSelectionRange(newPosition, newPosition);
        textareaRef.value.focus();
      }
    });
  }
};

const addNewLine = () => {
  message.value += '\n';
  adjustHeight();
};

// Функция для фокуса на input (используется при reply)
const focusInput = () => {
  if (textareaRef.value) {
    textareaRef.value.focus();
  }
};

// Экспортируем функцию для использования через ref
defineExpose({
  focusInput,
});
</script>
