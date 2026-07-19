"use client";

import { useEffect, useState } from "react";

const HERO_HIDE_ROOT_MARGIN = "-50% 0px 0px 0px";

export function useHeroVisible(heroId = "hero") {
  const [isHeroVisible, setIsHeroVisible] = useState(true);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    if (!hero) {
      setIsHeroVisible(false);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => setIsHeroVisible(entry.isIntersecting), {
      threshold: 0,
      rootMargin: HERO_HIDE_ROOT_MARGIN,
    });

    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroId]);

  return isHeroVisible;
}
