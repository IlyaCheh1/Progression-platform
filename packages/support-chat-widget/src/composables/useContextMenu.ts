import { ref, computed, onMounted, onUnmounted } from 'vue';

export function useContextMenu() {
  const isOpen = ref(false);
  const x = ref(0);
  const y = ref(0);
  const menuRef = ref<HTMLElement>();

  const open = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    x.value = event.clientX;
    y.value = event.clientY;
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
  };

  const handleClickOutside = (event: Event) => {
    if (isOpen.value && menuRef.value && !menuRef.value.contains(event.target as Node)) {
      close();
    }
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen.value) {
      close();
    }
  };

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleEscape);
  });

  // Computed стили для позиционирования меню
  const menuStyles = computed(() => ({
    position: 'fixed' as const,
    left: `${x.value}px`,
    top: `${y.value}px`,
    zIndex: 1000,
  }));

  return {
    isOpen,
    x,
    y,
    menuRef,
    menuStyles,
    open,
    close,
  };
}
