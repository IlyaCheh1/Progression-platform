import { OgChatTheme } from './composables/useAttribute';

interface Themes {
  market: OgChatTheme;
  news: OgChatTheme;
  streaming: OgChatTheme;
  mos: OgChatTheme;
}

export const themes: Themes = {
  market: {
    buttonColor: 'linear-gradient(140deg, #881AFF 12.89%, #5E16D9 50.9%, #3B0C8A 85.42%)',
    gradientColors: ['#00010D', '#8E3AEF', '#5E0056', '#0B0C19', '#AB218D', '#000DFF'],
    gradientLogo: ['#881AFF', '#5E16D9', '#3B0C8A', '#881AFF', '#5E16D9', '#3B0C8A'],
    mainAccent: '#8041ff',
  },
  news: {
    buttonColor: 'linear-gradient(218deg, #27D1F9 12.75%, #02B4FE 51.95%, #1854FD 90.38%)',
    gradientColors: ['#00010D', '#3ACBEF', '#00495E', '#000E2F', '#2189AB', '#000DFF'],
    gradientLogo: ['#27D1F9', '#02B4FE', '#1854FD', '#27D1F9', '#02B4FE', '#1854FD'],
    mainAccent: '#0EBFF6',
  },
  streaming: {
    buttonColor: 'linear-gradient(160deg, #F40307 5.21%, #9B1010 89.35%)',
    gradientColors: ['#00010D', '#9D0003', '#CD1C1F', '#000000', '#AB2128', '#FF0004'],
    gradientLogo: ['#F40307', '#D60A0D', '#9B1010', '#F40307', '#D60A0D', '#9B1010'],
    mainAccent: '#920616',
  },
  mos: {
    buttonColor: 'linear-gradient(145deg, #f0c35a 0%, #d4a84b 52%, #a67c2e 100%)',
    gradientColors: ['#0b0b0c', '#d4a84b', '#1a1a1d', '#0b0b0c', '#f0c35a', '#141416'],
    gradientLogo: ['#f0c35a', '#d4a84b', '#a67c2e', '#f0c35a', '#d4a84b', '#a67c2e'],
    mainAccent: '#d4a84b',
  },
};
