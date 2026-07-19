<template>
  <div class="w-full h-full overflow-hidden bg-transparent">
    <!-- Если это изображение -->
    <img
      v-if="isImage"
      :src="attachment.download_url || placeholderUrl"
      :alt="attachment.file_name"
      class="w-full h-full object-cover transition-transform duration-200 hover:scale-105 cursor-pointer"
      @error="onImageError"
    />
    <!-- Если это файл (не изображение) -->
    <div
      v-else
      class="w-full h-full flex flex-col items-center justify-center bg-gray-50 border border-gray-200 p-2 text-center"
    >
      <div class="text-2xl mb-1">📎</div>
      <div class="flex-1 flex flex-col justify-center min-h-0">
        <div class="text-xs font-medium text-gray-800 mb-0.5 break-words leading-tight">
          {{ truncatedFileName }}
        </div>
        <div class="text-[10px] text-gray-600">{{ formatFileSize(attachment.size_bytes) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Attachment } from '@/api/client';

const props = defineProps<{
  attachment: Attachment;
}>();

const isImage = computed(() => {
  return props.attachment.content_type.startsWith('image/');
});

const truncatedFileName = computed(() => {
  const name = props.attachment.file_name;
  if (name.length > 20) {
    return name.substring(0, 17) + '...';
  }
  return name;
});

const placeholderUrl =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjBGMEYwIi8+CjxwYXRoIGQ9Ik0xMiA4VjE2TTggMTJIMTYiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+';

function onImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = placeholderUrl;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
</script>
