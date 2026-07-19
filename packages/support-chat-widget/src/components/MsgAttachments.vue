<template>
  <div
    v-if="attachments.length > 0"
    class="overflow-hidden w-full max-w-sm"
    :class="isSupportMsg ? '' : hasText ? 'rounded-t-[20px]' : 'rounded-[20px]'"
  >
    <!-- 1 изображение: занимает всю ширину, пропорция ~183/243 -->
    <template v-if="attachments.length === 1">
      <div class="w-full aspect-[3/4] min-w-[183px] min-h-[243px]">
        <AttachmentImage :attachment="attachments[0]" />
      </div>
    </template>

    <!-- 2 изображения: грид 1 ряд, 2 столбца, пропорция ~106/137 -->
    <template v-else-if="attachments.length === 2">
      <div class="grid grid-cols-2 gap-0.5 w-full min-w-[214px]">
        <AttachmentImage
          v-for="attachment in attachments"
          :key="attachment.attachment_id"
          :attachment="attachment"
          class="aspect-[106/137] min-w-[106px] min-h-[137px]"
        />
      </div>
    </template>

    <!-- 3 изображения: первая занимает всю высоту, остальные две в столбик -->
    <template v-else-if="attachments.length === 3">
      <div class="grid grid-cols-2 gap-0.5 w-full min-w-[214px] aspect-[214/208]">
        <AttachmentImage
          :attachment="attachments[0]"
          class="row-span-2 aspect-[106/208] min-w-[106px] min-h-[208px]"
        />
        <AttachmentImage
          :attachment="attachments[1]"
          class="aspect-[106/103] min-w-[106px] min-h-[103px]"
        />
        <AttachmentImage
          :attachment="attachments[2]"
          class="aspect-[106/103] min-w-[106px] min-h-[103px]"
        />
      </div>
    </template>

    <!-- 4 изображения: сетка 2x2 -->
    <template v-else-if="attachments.length === 4">
      <div class="grid grid-cols-2 grid-rows-2 gap-0.5 w-full min-w-[214px] aspect-[214/208]">
        <AttachmentImage
          v-for="attachment in attachments"
          :key="attachment.attachment_id"
          :attachment="attachment"
          class="aspect-[106/103] min-w-[106px] min-h-[103px]"
        />
      </div>
    </template>

    <!-- 5 изображений: первый ряд 2x80x80, потом 1x162x80, потом 2x80x80 -->
    <template v-else-if="attachments.length === 5">
      <div class="grid grid-cols-2 gap-0.5 w-full min-w-[162px] aspect-[162/240]">
        <!-- Первый ряд: 2 картинки -->
        <AttachmentImage
          v-for="attachment in attachments.slice(0, 2)"
          :key="attachment.attachment_id"
          :attachment="attachment"
          class="aspect-square min-w-[80px] min-h-[80px]"
        />
        <!-- Второй ряд: 1 картинка на всю ширину -->
        <AttachmentImage
          :attachment="attachments[2]"
          class="col-span-2 aspect-[162/80] min-w-[162px] min-h-[80px]"
        />
        <!-- Третий ряд: 2 картинки -->
        <AttachmentImage
          v-for="attachment in attachments.slice(3, 5)"
          :key="attachment.attachment_id"
          :attachment="attachment"
          class="aspect-square min-w-[80px] min-h-[80px]"
        />
      </div>
    </template>

    <!-- 6+ изображений: сетка 2x3 (6 квадратов 80x80) -->
    <template v-else>
      <div class="grid grid-cols-2 grid-rows-3 gap-0.5 w-full min-w-[162px] aspect-[162/240]">
        <template
          v-for="(attachment, index) in attachments.slice(0, 6)"
          :key="attachment.attachment_id"
        >
          <!-- Первые 5 изображений как обычно -->
          <AttachmentImage
            v-if="index < 5"
            :attachment="attachment"
            class="aspect-square min-w-[80px] min-h-[80px]"
          />
          <!-- Последняя картинка с overlay если есть еще -->
          <div v-else class="relative aspect-square min-w-[80px] min-h-[80px]">
            <AttachmentImage :attachment="attachment" />
            <div
              v-if="attachments.length > 6"
              class="absolute inset-0 bg-black/60 text-white flex items-center justify-center font-semibold text-sm"
            >
              +{{ attachments.length - 6 }}
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Attachment } from '@/api/client';
import AttachmentImage from './AttachmentImage.vue';

defineProps<{
  attachments: Attachment[];
  hasText?: boolean;
  isSupportMsg?: boolean;
}>();
</script>
