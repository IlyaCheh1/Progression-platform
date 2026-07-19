"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { chatUserIdFromStudentId } from "@/lib/chat-user-id";
import { loadSession, SESSION_CHANGED_EVENT } from "@/lib/session";

const SCRIPT_ID = "mos-support-chat-script";
const WIDGET_TAG = "og-chat";

function resolveChatEndpoints() {
  const apiFromEnv = process.env.NEXT_PUBLIC_SUPPORT_CHAT_API;
  const wsFromEnv = process.env.NEXT_PUBLIC_SUPPORT_CHAT_WS;

  if (typeof window === "undefined") {
    return {
      apiBaseUrl: apiFromEnv ?? "http://127.0.0.1:8084",
      wsBaseUrl: wsFromEnv ?? "ws://127.0.0.1:8084",
    };
  }

  const host = window.location.hostname;
  const isLoopback = host === "localhost" || host === "127.0.0.1";
  const envPointsToLoopback =
    !apiFromEnv ||
    apiFromEnv.includes("127.0.0.1") ||
    apiFromEnv.includes("localhost");

  if (apiFromEnv && wsFromEnv && (isLoopback || !envPointsToLoopback)) {
    return { apiBaseUrl: apiFromEnv, wsBaseUrl: wsFromEnv };
  }

  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";

  return {
    apiBaseUrl: `${protocol}://${host}:8084`,
    wsBaseUrl: `${wsProtocol}://${host}:8084`,
  };
}

function applyWidgetAttributes(el: Element, userId: string, userName: string) {
  if (!(el instanceof HTMLElement)) return;

  el.setAttribute("user-id", userId);
  el.setAttribute("user-name", userName);
  el.setAttribute("theme", "mos");
  el.setAttribute("position", "bottom-right");
  el.setAttribute("size-class", "w-[342px] h-[600px]");

  const { apiBaseUrl, wsBaseUrl } = resolveChatEndpoints();
  el.setAttribute("api-base-url", apiBaseUrl);
  el.setAttribute("ws-base-url", wsBaseUrl);

  el.style.position = "fixed";
  el.style.right = "1rem";
  el.style.bottom = "1rem";
  el.style.zIndex = "9999";
  el.style.pointerEvents = "none";
}

function shouldShowChat(pathname: string): boolean {
  return !pathname.startsWith("/login") && !pathname.startsWith("/auth/");
}

export default function SupportChatLauncher() {
  const pathname = usePathname();
  const [sessionTick, setSessionTick] = useState(0);

  useEffect(() => {
    function bumpSessionTick() {
      setSessionTick((n) => n + 1);
    }
    function onStorage(event: StorageEvent) {
      if (event.key === "mos.session") bumpSessionTick();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener(SESSION_CHANGED_EVENT, bumpSessionTick);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SESSION_CHANGED_EVENT, bumpSessionTick);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!shouldShowChat(pathname)) return;

    const session = loadSession();
    if (!session?.studentId) return;

    let cancelled = false;

    void (async () => {
      const userId = await chatUserIdFromStudentId(session.studentId);
      if (cancelled) return;

      const userName = session.name || session.login || "Ученик";

      function mountWidget() {
        const existing = document.querySelector(WIDGET_TAG);
        if (existing) {
          applyWidgetAttributes(existing, userId, userName);
          return;
        }
        const el = document.createElement(WIDGET_TAG);
        applyWidgetAttributes(el, userId, userName);
        document.body.appendChild(el);
      }

      if (customElements.get(WIDGET_TAG)) {
        mountWidget();
        return;
      }

      const scriptEl = document.getElementById(SCRIPT_ID);
      if (scriptEl) {
        scriptEl.addEventListener("load", mountWidget, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.type = "module";
      script.src = "/chat/og-chat.js";
      script.addEventListener("load", mountWidget, { once: true });
      document.body.appendChild(script);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, sessionTick]);

  return null;
}
