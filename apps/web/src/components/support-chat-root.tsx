"use client";

import { Suspense } from "react";
import SupportChatLauncher from "@/components/support-chat-launcher";

export default function SupportChatRoot() {
  return (
    <Suspense fallback={null}>
      <SupportChatLauncher />
    </Suspense>
  );
}
