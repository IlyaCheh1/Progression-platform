import type { Metadata, Viewport } from "next";
import { Golos_Text, Unbounded } from "next/font/google";
import SupportChatRoot from "@/components/support-chat-root";
import "./globals.css";

const golosText = Golos_Text({
  variable: "--font-golos-text",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Мастер меча",
  description: "Играй. Тренируйся. Прокачивай персонажа.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${golosText.variable} ${unbounded.variable}`}>
      <body className="min-h-screen bg-mos-bg font-golos text-mos-text antialiased">
        {children}
        <SupportChatRoot />
      </body>
    </html>
  );
}
