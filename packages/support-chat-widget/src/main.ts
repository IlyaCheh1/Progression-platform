import { defineCustomElement } from 'vue';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import OgLivechat from './components/OgLiveChat.ce.vue';
import tailwindStyles from './tailwind.css?inline';
import fontsStyles from './styles/fonts.css?inline';

// Функция для загрузки Google Fonts в head документа
function loadGoogleFonts() {
  // Проверяем, не загружены ли уже шрифты
  const existingLink = document.querySelector('link[href*="fonts.googleapis.com"][href*="Golos+Text"]');
  if (existingLink) {
    return; // Шрифты уже загружены
  }

  // Создаем preconnect ссылки
  const preconnect1 = document.createElement('link');
  preconnect1.rel = 'preconnect';
  preconnect1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnect1);

  const preconnect2 = document.createElement('link');
  preconnect2.rel = 'preconnect';
  preconnect2.href = 'https://fonts.gstatic.com';
  preconnect2.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect2);

  // Создаем основную ссылку на шрифты
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400..900&family=Outfit:wght@100..900&family=Unbounded:wght@200..900&display=swap';
  document.head.appendChild(fontLink);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      gcTime: 30_000,
    },
    mutations: {
      retry: 1,
    },
  },
});

const LiveChatWebComponent = defineCustomElement(OgLivechat, {
  styles: [fontsStyles, tailwindStyles],
  configureApp(app) {
    app.use(VueQueryPlugin, { queryClient });
  },
});

// Загружаем шрифты в head документа при регистрации компонента
loadGoogleFonts();

customElements.define('og-chat', LiveChatWebComponent);

export default LiveChatWebComponent;
