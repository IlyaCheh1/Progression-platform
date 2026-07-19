import { ref, computed, onMounted, onUnmounted } from 'vue';

export function useDevice() {
  const isMobile = ref(false);
  const isTablet = ref(false);
  const isDesktop = ref(false);
  const shouldUseFullscreen = ref(false);
  const orientation = ref('portrait');

  // Computed свойства для ориентации
  const isPortrait = computed(() => orientation.value === 'portrait');
  const isLandscape = computed(() => orientation.value === 'landscape');

  const checkDevice = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    isMobile.value = width <= 480;

    isTablet.value = width > 480 && width < 1024;

    isDesktop.value = width >= 1024;

    orientation.value = width > height ? 'landscape' : 'portrait';

    const userAgent = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );

    // Полноэкранный режим для мобильных устройств ИЛИ узких экранов
    shouldUseFullscreen.value = (isMobile.value && isMobileUA) || width <= 480;
  };

  // Слушатель изменения размера окна
  const handleResize = () => {
    checkDevice();
  };

  onMounted(() => {
    checkDevice();
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });

  return {
    isMobile,
    isTablet,
    isDesktop,
    shouldUseFullscreen,
    orientation,
    isPortrait,
    isLandscape,
  };
}
