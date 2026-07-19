"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { chatUserIdFromStudentId } from "@/lib/chat-user-id";
import { loadSession } from "@/lib/session";

const SCRIPT_ID = "mos-support-chat-script";
const WIDGET_TAG = "og-chat";

function shouldShowChat(pathname: string): boolean {
  return !pathname.startsWith("/login") && !pathname.startsWith("/auth/");
}

export default function SupportChatLauncher() {
  const pathname = usePathname();
  const [sessionTick, setSessionTick] = useState(0);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === "mos.session") setSessionTick((n) => n + 1);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
          existing.setAttribute("user-id", userId);
          existing.setAttribute("user-name", userName);
          return;
        }
        const el = document.createElement(WIDGET_TAG);
        el.setAttribute("user-id", userId);
        el.setAttribute("user-name", userName);
        el.setAttribute("theme", "mos");
        el.setAttribute("position", "bottom-right");
        el.setAttribute("size-class", "w-[342px] h-[600px]");
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
