<template>
  <Popover class="relative" v-slot="{ open, close }">
    <PopoverButton
      class="w-[36px] h-[36px] rounded-full backdrop-blur-[25px] focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:outline-none flex items-center justify-center"
      :class="[open ? ' text-white' : 'text-[#64748b]']"
      :style="{
        background: open ? 'rgba(250, 250, 250, 0.08)' : 'transparent',
      }"
    >
      <button class="flex-shrink-0">
        <Smile class="w-6 h-6 cursor-pointer hover:text-neutral-50 transition-colors" />
      </button>
    </PopoverButton>

    <PopoverPanel class="fixed bottom-[150px] right-[120px] w-[202px] h-[108px] z-50 p-0!">
      <div
        class="p-[12px] pr-[4px] flex flex-wrap w-[225px] h-[108px] overflow-y-auto z-10 backdrop-blur-[25px] rounded-[20px]"
        style="background: rgba(108, 111, 172, 0.08)"
        :style="{
          'scrollbar-width': 'thin',
          'scrollbar-color': 'rgba(255, 255, 255, 0.2) transparent',
        }"
      >
        <button
          v-for="emoji in emojis"
          :key="emoji"
          type="button"
          class="font-normal display-block text-[24px] leading-[28px] flex items-center justify-center cursor-pointer whitespace-nowrap hover:bg-controlsHover"
          @click="selectEmoji(emoji, close)"
        >
          {{ emoji }}
        </button>
      </div>
    </PopoverPanel>
  </Popover>
</template>
<script lang="ts" setup>
import Smile from '../assets/Smile.svg';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue';

const emit = defineEmits<{
  emojiSelect: [emoji: string];
}>();

const emojis = [
  '😂',
  '🤣',
  '😍',
  '🥰',
  '😘',
  '😎',
  '😊',
  '😁',
  '😀',
  '😉',
  '😅',
  '🙃',
  '🥲',
  '🤔',
  '🥳',
  '🤩',
  '😏',
  '🥺',
  '😢',
  '😭',
  '😤',
  '😡',
  '🤬',
  '🤯',
  '😱',
  '🤗',
  '🙏',
  '👍',
  '👎',
  '👏',
  '🙌',
  '🤝',
  '👌',
  '🤌',
  '✌️',
  '🤞',
  '🤟',
  '🤘',
  '👊',
  '✊',
  '💪',
  '🫶',
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🤎',
  '🖤',
  '🤍',
  '💔',
  '💕',
  '💞',
  '💓',
  '💗',
  '💖',
  '💘',
  '💝',
  '💯',
  '💥',
  '🔥',
  '🌟',
  '✨',
  '🎉',
  '🎊',
  '🥳',
  '🎂',
  '🍰',
  '🍕',
  '🍔',
  '🍟',
  '🍣',
  '🍫',
  '🍭',
  '🍩',
  '🍪',
  '🍷',
  '🍺',
  '🍻',
  '🥂',
  '🍹',
  '☕',
  '🍼',
  '🥤',
  '🚗',
  '✈️',
  '🚀',
  '🏠',
  '🏖',
  '🗽',
  '🌍',
  '🌎',
  '🌏',
  '🌈',
  '⛅',
  '☀️',
  '🌙',
  '⭐',
  '🌌',
  '⛄',
  '❄️',
  '☔',
  '🌊',
  '🌋',
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐷',
  '🐸',
  '🐵',
  '🙈',
  '🙉',
  '🙊',
  '🐒',
  '🐔',
  '🐧',
  '🦉',
  '🦋',
  '🐞',
  '🐝',
  '🐠',
  '🐳',
  '🦈',
  '🐙',
  '🌸',
  '🌹',
  '🌺',
  '🌻',
  '🌷',
  '🌼',
  '🪴',
  '🍀',
  '🎄',
  '🌵',
  '🎁',
  '🛍',
  '💄',
  '👠',
  '👑',
  '👜',
  '👗',
  '🕶',
  '⌚',
  '📱',
  '💻',
  '🖤',
  '🤖',
  '👻',
  '💀',
  '☠️',
  '💩',
  '👽',
  '👾',
  '🎃',
];

const selectEmoji = (emoji: string, close: () => void) => {
  emit('emojiSelect', emoji);
  close();
};
</script>
