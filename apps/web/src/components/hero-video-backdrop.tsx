"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CAN_FALLBACK_HERO_MEDIA_TO_LOCAL,
  heroMediaUrl,
  heroPosterUrl,
} from "@/lib/hero-media";
import { isHeroVideoReady } from "@/lib/hero-video-ready";

const MEDIA_CLASS = "h-full w-full object-cover object-center";
const MEDIA_FILTER = "saturate(1.8) brightness(0.35)";

type HeroVideoBackdropProps = {
  index: number;
  file: string;
  isActive: boolean;
  isNext: boolean;
  isMounted: boolean;
  reduceMotion: boolean;
  registerVideo: (index: number, node: HTMLVideoElement | null) => void;
  blurred?: boolean;
  forceLocal?: boolean;
};

export default function HeroVideoBackdrop({
  index,
  file,
  isActive,
  isNext,
  isMounted,
  reduceMotion,
  registerVideo,
  blurred = false,
  forceLocal = false,
}: HeroVideoBackdropProps) {
  const [useLocalFallback, setUseLocalFallback] = useState(forceLocal);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const poster = heroPosterUrl(file, useLocalFallback);
  const videoSrc = heroMediaUrl(file, useLocalFallback);
  const blurClass = blurred ? " scale-110 blur-md" : "";

  const syncVideoReady = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setVideoReady(isHeroVideoReady(video.readyState));
    }
  }, []);

  const fallBackToLocal = useCallback(() => {
    if (!CAN_FALLBACK_HERO_MEDIA_TO_LOCAL || useLocalFallback) return;
    setUseLocalFallback(true);
    setVideoReady(false);
  }, [useLocalFallback]);

  const handleVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      registerVideo(index, node);
    },
    [index, registerVideo],
  );

  useEffect(() => {
    if (!isMounted) {
      setVideoReady(false);
      setUseLocalFallback(forceLocal);
    }
  }, [forceLocal, isMounted]);

  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!isMounted || !video) {
      setVideoReady(false);
      return;
    }

    const sync = () => {
      setVideoReady(isHeroVideoReady(video.readyState));
    };

    sync();
    video.addEventListener("canplay", sync);
    video.addEventListener("loadeddata", sync);

    return () => {
      video.removeEventListener("canplay", sync);
      video.removeEventListener("loadeddata", sync);
    };
  }, [isMounted, videoSrc]);

  if (!isMounted) return null;

  if (reduceMotion) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={poster}
        alt=""
        className={`${MEDIA_CLASS}${blurClass}`}
        style={{ filter: MEDIA_FILTER }}
        decoding="async"
        fetchPriority={index === 0 ? "high" : "low"}
        onError={fallBackToLocal}
      />
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        aria-hidden
        className={`absolute inset-0 transition-opacity duration-300 ${MEDIA_CLASS}${blurClass}`}
        style={{
          filter: MEDIA_FILTER,
          opacity: videoReady && isActive ? 0 : 1,
        }}
        decoding="async"
        fetchPriority={index === 0 ? "high" : "low"}
        onError={fallBackToLocal}
      />
      <video
        key={videoSrc}
        ref={handleVideoRef}
        className={`absolute inset-0 transition-opacity duration-300 ${MEDIA_CLASS}${blurClass}`}
        style={{
          filter: MEDIA_FILTER,
          opacity: videoReady ? 1 : 0,
          transform: "translateZ(0)",
        }}
        muted
        loop
        playsInline
        preload={isActive || isNext || index === 0 ? "auto" : "metadata"}
        poster={poster}
        src={videoSrc}
        onCanPlay={syncVideoReady}
        onLoadedData={syncVideoReady}
        onError={fallBackToLocal}
      />
    </div>
  );
}
