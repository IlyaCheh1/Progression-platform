"use client";

import { useEffect, useState } from "react";

export type DeviceType = "mobile" | "desktop";

type UseDeviceOptions = {
  /** Minimum viewport width that counts as desktop. Defaults to 1280 (OG / Tailwind xl). */
  desktopMinWidth?: number;
  /** Initial width on the server to avoid hydration mismatches. */
  initialWidth?: number;
};

/**
 * Detects mobile vs desktop viewport.
 * - Mobile: width < desktopMinWidth
 * - Desktop: width >= desktopMinWidth
 * - shouldRotate: mobile + portrait
 */
export function useDevice(options?: UseDeviceOptions) {
  const desktopMinWidth = options?.desktopMinWidth ?? 1280;

  const [isHydrated, setIsHydrated] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(() => {
    const width = options?.initialWidth ?? desktopMinWidth;
    const deviceType: DeviceType = width >= desktopMinWidth ? "desktop" : "mobile";
    return { deviceType, shouldRotate: false };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const deviceType: DeviceType = width >= desktopMinWidth ? "desktop" : "mobile";
      const shouldRotate = deviceType === "mobile" && height > width;
      setDeviceInfo({ deviceType, shouldRotate });
    };

    setIsHydrated(true);
    handleResize();

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [desktopMinWidth]);

  const { deviceType, shouldRotate } = deviceInfo;
  const isMobile = deviceType === "mobile";
  const isDesktop = deviceType === "desktop";

  return { isMobile, isDesktop, deviceType, shouldRotate, isHydrated } as const;
}

export default useDevice;
