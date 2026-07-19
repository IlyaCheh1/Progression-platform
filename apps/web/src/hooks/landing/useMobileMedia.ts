"use client";

import { useLayoutEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

export function useMobileMedia() {
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}
