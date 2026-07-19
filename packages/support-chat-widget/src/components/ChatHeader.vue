<template>
  <div id="header" class="w-full h-[18px] flex justify-center items-center">
    <div
      class="flex justify-center items-center gap-2.5 px-1 pb-0.5 rounded-[100px]"
      style="background: rgba(108, 111, 172, 0.08)"
    >
      <span class="font-normal text-xs text-slate-500 font-golos">{{ displayDate }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  visibleMessageDate?: Date | string;
}>();

// Функция для получения относительной даты
const getRelativeDate = (messageDate?: Date | string): string => {
  if (!messageDate) return 'Сегодня';

  const date = typeof messageDate === 'string' ? new Date(messageDate) : messageDate;
  const today = new Date();

  // Сбрасываем время для корректного сравнения дат
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const messageStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = todayStart.getTime() - messageStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Сегодня';
  } else if (diffDays === 1) {
    return 'Вчера';
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  }
};

const displayDate = computed(() => {
  return getRelativeDate(props.visibleMessageDate);
});
</script>
