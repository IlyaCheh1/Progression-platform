import { ref, shallowRef, onUnmounted, computed, watch, type Ref } from 'vue';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, merge, of, EMPTY } from 'rxjs';
import { retryWhen, scan, filter, tap, shareReplay, delayWhen, switchMap } from 'rxjs/operators';
import { timer } from 'rxjs';
import { getWsBaseUrl } from '../lib/chat-config';

// Types based on OpenAPI spec
export type WsMessageType =
  | 'welcome'
  | 'message.created'
  | 'message.send'
  | 'error'
  | 'ping'
  | 'pong'
  | 'conversation.closed';

export interface WsIncomingMessage {
  type: WsMessageType;
  data: any;
}

export interface WsOutgoingMessage {
  type: WsMessageType;
  data: any;
}

// WebSocket message types from OpenAPI spec
export interface WsClientMessageSend {
  type: 'message.send';
  data: {
    text: string;
    client_id?: string;
    reply_to_message_id?: string;
  };
}

export interface WsServerWelcome {
  type: 'welcome';
  data: {
    user_id: string;
    server_time: string;
  };
}

export interface WsServerMessageCreated {
  type: 'message.created';
  data: {
    message_id: string;
    conversation_id: string;
    seq_no: number;
    sender: 'user' | 'support' | 'assistant' | 'system';
    source: 'web' | 'telegram' | 'system';
    content_type: 'text';
    text?: string;
    reply_to_message_id?: string;
    created_at: string;
  };
}

export interface WsError {
  type: 'error';
  data: {
    code: string;
    message: string;
  };
}

export interface UseRxSocketOptions {
  conversationId: Ref<string>;
  afterSeq?: Ref<number>;
  baseUrl?: string;
  heartbeatMs?: number;
  maxBackoffMs?: number;
  shouldReconnect?: Ref<boolean>; // Новый параметр для контроля переподключений
  onCreateNewConversation?: () => Promise<string>; // Callback для создания нового разговора
  onReconnected?: () => void; // Callback при переподключении
}

export function useRxSocket(opts: UseRxSocketOptions) {
  const {
    conversationId,
    afterSeq = ref(0),
    baseUrl = getWsBaseUrl(),
    maxBackoffMs = 15_000,
    shouldReconnect = ref(true), // По умолчанию переподключения включены
    onCreateNewConversation,
    onReconnected,
  } = opts;

  const connected = ref(false);
  const lastError = shallowRef<unknown>(null);
  const outbox = ref<WsOutgoingMessage[]>([]);
  const destroy$ = new Subject<void>();
  const forceReconnect$ = new Subject<void>();
  const conversationChanged$ = new Subject<void>();
  const socketRef = shallowRef<WebSocketSubject<WsIncomingMessage> | null>(null);

  // Отслеживание отправленных сообщений для проверки соединения
  const pendingMessages = new Map<string, { timestamp: number; timeout: NodeJS.Timeout }>();
  const MESSAGE_TIMEOUT = 20000; // 20 секунд

  // Ping-pong система
  const pingInterval = ref<NodeJS.Timeout | null>(null);
  const lastPongReceived = ref<number>(Date.now());
  const PING_INTERVAL = 15000;
  const PONG_TIMEOUT = 10000; // 10 секунд

  // Функция для корректного отписывания от текущего сокета
  function cleanupCurrentSocket() {
    if (socketRef.value) {
      console.log('[WS] Cleaning up current socket connection');
      socketRef.value.complete();
      socketRef.value = null;
    }
    connected.value = false;
  }

  // Функции для ping-pong
  function startPing() {
    stopPing(); // Остановим предыдущий интервал если есть

    pingInterval.value = setInterval(() => {
      const s = socketRef.value;
      if (connected.value && s) {
        s.next({ type: 'ping', data: {} });

        // Проверяем, получили ли pong в течение PONG_TIMEOUT
        setTimeout(() => {
          const timeSinceLastPong = Date.now() - lastPongReceived.value;
          if (timeSinceLastPong > PONG_TIMEOUT) {
            console.warn('[WS] Pong timeout - triggering reconnection');
            // Принудительно закрываем текущее соединение
            if (socketRef.value) {
              socketRef.value.complete();
            }
            // Сбрасываем состояние подключения
            connected.value = false;
            lastError.value = new Error('Pong timeout');
            // Останавливаем ping до нового подключения
            stopPing();
            // Триггерим переподключение через небольшую задержку
            setTimeout(() => {
              forceReconnect$.next();
            }, 1000);
          }
        }, PONG_TIMEOUT);
      }
    }, PING_INTERVAL);
  }

  function stopPing() {
    if (pingInterval.value) {
      clearInterval(pingInterval.value);
      pingInterval.value = null;
    }
  }

  // Функция создания нового WebSocket
  function createSocket() {
    if (!wsUrl.value) {
      throw new Error('No conversation ID provided');
    }

    const s = webSocket<WsIncomingMessage>({
      url: wsUrl.value,
      serializer: (v) => JSON.stringify(v),
      deserializer: (e) => {
        try {
          return JSON.parse(e.data);
        } catch (err) {
          console.warn('Failed to parse WebSocket message:', e.data);
          throw err;
        }
      },
      openObserver: {
        next: () => {
          connected.value = true;
          lastError.value = null;
          lastPongReceived.value = Date.now();

          // Запускаем ping
          startPing();

          // Вызываем callback при подключении/переподключении
          if (onReconnected) {
            onReconnected();
          }

          // Отправляем сообщения из очереди
          while (outbox.value.length > 0) {
            const msg = outbox.value.shift();
            if (msg) {
              try {
                s.next(msg);
                console.log('[WS] Sent queued message:', msg);
              } catch (err) {
                console.warn('[WS] Failed to send queued message:', err);
                outbox.value.unshift(msg);
                break;
              }
            }
          }
        },
      },
      closeObserver: {
        next: (event) => {
          connected.value = false;
          stopPing(); // Останавливаем ping при отключении
          console.log('[WS] Disconnected:', event.code, event.reason);
        },
      },
    });

    socketRef.value = s;
    return s;
  }

  // Построение URL с параметрами
  const wsUrl = computed(() => {
    if (!conversationId.value) return '';

    const params = new URLSearchParams();
    params.set('conv_id', conversationId.value);

    if (afterSeq.value > 0) {
      params.set('after_seq', afterSeq.value.toString());
    }

    return `${baseUrl}/api/v1/messages/ws?${params.toString()}`;
  });

  // Создаём поток подключений с ретраями и принудительным переподключением
  const socket$ = merge(
    of(null), // Запускаем сразу
    forceReconnect$.pipe(
      tap(() => {
        console.log('[WS] Force reconnection triggered');
        cleanupCurrentSocket();
      })
    ),
    conversationChanged$.pipe(
      tap(() => {
        console.log('[WS] Conversation changed, reconnecting');
        cleanupCurrentSocket();
      })
    )
  ).pipe(
    switchMap(() => {
      if (!conversationId.value) {
        console.log('[WS] Waiting for conversation ID');
        return EMPTY;
      }

      console.log('[WS] Creating new socket connection');
      return createSocket().pipe(
        retryWhen((errors) =>
          errors.pipe(
            tap((err) => {
              lastError.value = err;
              console.error('[WS] Error:', err);
            }),
            filter(() => {
              const canReconnect = shouldReconnect.value;
              if (!canReconnect) {
                console.log('[WS] Reconnection disabled, stopping retries');
              }
              return canReconnect;
            }),
            scan((acc) => Math.min(acc * 2 || 1000, maxBackoffMs), 0),
            delayWhen((ms: number) => {
              console.log(`[WS] Retrying in ${ms}ms...`);
              return timer(ms);
            })
          )
        )
      );
    }),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  // Функция отправки сообщений
  function send(payload: WsOutgoingMessage) {
    const s = socketRef.value;
    if (connected.value && s) {
      try {
        s.next(payload);
        console.log('[WS] Sent message:', payload);

        // Отслеживаем message.send для проверки соединения
        if (payload.type === 'message.send' && payload.data?.client_id) {
          const clientId = payload.data.client_id;
          const timeout = setTimeout(() => {
            console.warn(`[WS] Message ${clientId} timeout - connection may be dead`);
            connected.value = false;
            lastError.value = new Error('Message delivery timeout');
            pendingMessages.delete(clientId);
          }, MESSAGE_TIMEOUT);

          pendingMessages.set(clientId, { timestamp: Date.now(), timeout });
          console.log(`[WS] Tracking message ${clientId} for delivery`);
        }
      } catch (err) {
        console.warn('[WS] Failed to send, adding to outbox:', err);
        outbox.value.push(payload);
      }
    } else {
      outbox.value.push(payload);
    }
  }

  // Отправка текстового сообщения (основная функция для чата)
  function sendMessage(
    text: string,
    clientId?: string,
    replyToMessageId?: string,
    attachedImagesIds?: string[]
  ) {
    // Если переподключения отключены (чат закрыт), создаем новый разговор
    if (!shouldReconnect.value) {
      console.log('[WS] Re-enabling reconnections for new message');
      shouldReconnect.value = true;

      // Создаем новый разговор если есть callback
      if (onCreateNewConversation) {
        console.log('[WS] Creating new conversation for new message');
        onCreateNewConversation()
          .then(() => {
            console.log('[WS] New conversation created, creating socket connection');
            try {
              cleanupCurrentSocket(); // Отписываемся от старого сокета
              createSocket().subscribe();
            } catch (err) {
              console.error('[WS] Failed to create new connection:', err);
            }
          })
          .catch((err) => {
            console.error('[WS] Failed to create new conversation:', err);
          });
      } else {
        // Fallback - просто создаем новое подключение
        console.log('[WS] Creating new connection for new message (no conversation callback)');
        try {
          cleanupCurrentSocket(); // Отписываемся от старого сокета
          createSocket().subscribe();
        } catch (err) {
          console.error('[WS] Failed to create new connection:', err);
        }
      }
    }

    send({
      type: 'message.send',
      data: {
        text,
        client_id: clientId,
        reply_to_message_id: replyToMessageId,
        attachments: attachedImagesIds,
      },
    });
    console.log('[WS] Queued message:', text);
  }

  const messages$ = socket$.pipe(
    filter((msg): msg is WsIncomingMessage => !!msg && typeof msg === 'object' && 'type' in msg),
    tap((msg) => {
      // При получении любого сообщения сбрасываем ошибку (соединение работает)
      if (lastError.value) {
        console.log('[WS] Received message, clearing connection error');
        lastError.value = null;
      }

      // Обработка pong сообщений
      if (msg.type === 'pong') {
        lastPongReceived.value = Date.now();
        console.log('[WS] Received pong from server');
      }

      // Если получили подтверждение отправленного сообщения
      if (msg.type === 'message.created' && msg.data?.client_id) {
        const clientId = msg.data.client_id;
        const pending = pendingMessages.get(clientId);
        if (pending) {
          clearTimeout(pending.timeout);
          pendingMessages.delete(clientId);
        }
      }
    })
  );

  // Фильтрованные потоки по типам сообщений
  const welcomeMessages$ = messages$.pipe(
    filter((msg): msg is WsServerWelcome => msg.type === 'welcome')
  );

  const newMessages$ = messages$.pipe(
    filter(
      (msg): msg is WsServerMessageCreated | WsIncomingMessage =>
        msg.type === 'message.created' || msg.type === 'conversation.closed'
    )
  );

  const closeConversation$ = messages$.pipe(filter((msg) => msg.type === 'conversation.closed'));

  const errorMessages$ = messages$.pipe(filter((msg): msg is WsError => msg.type === 'error'));

  const statusText = computed(() => {
    if (connected.value) return 'CONNECTED';
    if (lastError.value) return 'ERROR';
    return 'DISCONNECTED';
  });

  const hasQueuedMessages = computed(() => outbox.value.length > 0);

  watch(conversationId, (nextId, prevId) => {
    if (nextId && nextId !== prevId) {
      conversationChanged$.next();
    }
  });

  const socketSubscription = socket$.subscribe({
    error: (err) => {
      lastError.value = err;
      console.error('[WS] Socket stream error:', err);
    },
  });

  // Очистка при размонтировании
  onUnmounted(() => {
    console.log('[WS] Cleaning up...');
    socketSubscription.unsubscribe();
    // Очищаем все pending timeouts
    for (const [, pending] of pendingMessages) {
      clearTimeout(pending.timeout);
    }
    pendingMessages.clear();

    stopPing();

    destroy$.next();
    destroy$.complete();
    forceReconnect$.complete();
    conversationChanged$.complete();
    socketRef.value?.complete();
  });

  return {
    // State
    connected: computed(() => connected.value),
    statusText,
    lastError: computed(() => lastError.value),
    hasQueuedMessages,

    // RxJS Streams
    welcomeMessages$, // Welcome сообщения при подключении
    newMessages$, // Новые сообщения чата
    errorMessages$, // Ошибки от сервера
    closeConversation$, // Сообщения о закрытии беседы

    // Actions
    send, // Отправка произвольного сообщения
    sendMessage, // Отправка текстового сообщения

    // Control methods
    disableReconnection: () => {
      shouldReconnect.value = false;
      console.log('[WS] Reconnection disabled');
    },
    enableReconnection: () => {
      shouldReconnect.value = true;
      console.log('[WS] Reconnection enabled');
    },
    disconnect: () => {
      shouldReconnect.value = false;
      cleanupCurrentSocket(); // Отписываемся от текущего сокета
      console.log('[WS] Manually disconnecting...');
    },
  };
}
