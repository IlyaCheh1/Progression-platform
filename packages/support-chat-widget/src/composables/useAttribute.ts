import { themes } from '../themes';
import { computed } from 'vue';

export interface OgChatAttributes {
  position?: 'bottom-right' | 'bottom-left';
  sizeClass?: string;
  theme: 'market' | 'news' | 'streaming' | 'mos';
  userId?: string;
  userName?: string;
  topic?: string;
}

export interface OgChatTheme {
  buttonColor: string;
  gradientColors: [string, string, string, string, string, string];
  gradientLogo: [string, string, string, string, string, string];
  mainAccent: string;
}

export function useAttribute(props: OgChatAttributes) {
  const sizeClasses = computed(() => {
    return props.sizeClass || 'w-[342px] h-[600px]';
  });

  const buttonClasses = computed(() => {
    return `w-[52px] h-[52px] rounded-full`;
  });

  const gradients = computed(() => themes[props.theme].gradientColors);
  const logoGradients = computed(() => themes[props.theme].gradientLogo);
  const mainAccent = computed(() => themes[props.theme].mainAccent);
  const buttonBg = computed(() => themes[props.theme].buttonColor);

  const buttonContainerClasses = computed(() => {
    const alignment = {
      'bottom-right': 'justify-end',
      'bottom-left': 'justify-start',
    };

    return `flex w-full ${alignment[props.position || 'bottom-right']}`;
  });

  const chatWindowClasses = computed(() => {
    return 'flex flex-col justify-end self-stretch h-[536px] bg-[#0e0f19] p-4';
  });

  return {
    sizeClasses,
    gradients,
    logoGradients,
    buttonClasses,
    mainAccent,
    buttonContainerClasses,
    chatWindowClasses,
    buttonBg,
  };
}
