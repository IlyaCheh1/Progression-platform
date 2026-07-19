const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://chat.onlygames.ru';
const DEFAULT_WS_BASE = import.meta.env.VITE_WS_URL || 'wss://chat.onlygames.ru';

let apiBaseUrl = DEFAULT_API_BASE;
let wsBaseUrl = DEFAULT_WS_BASE;

export function setChatEndpoints(apiBase?: string | null, wsBase?: string | null) {
  if (apiBase) {
    apiBaseUrl = apiBase.replace(/\/$/, '');
  }
  if (wsBase) {
    wsBaseUrl = wsBase.replace(/\/$/, '');
  }
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export function getWsBaseUrl() {
  return wsBaseUrl;
}
