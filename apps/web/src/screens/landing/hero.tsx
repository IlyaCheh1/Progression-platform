"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const VIDEOS = ["1.mp4", "2.mp4", "3.mp4", "4.mp4", "5.mp4", "6.mp4"];

/** S3/CDN base (no trailing slash), e.g. https://bucket.selstorage.ru/<bucket>/media/hero */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "/media/hero").replace(/\/$/, "");

function mediaUrl(file: string) {
  return `${MEDIA_BASE}/${file}`;
}

export default function Hero() {
  const [idx, setIdx] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % VIDEOS.length), 8000);
    return () => clearInterval(t);
  }, []);

  const poster = mediaUrl(`${idx + 1}.png`);

  return (
    <section id="hero" className="relative min-h-screen w-full overflow-hidden">
      {!reduced ? (
        <video
          key={VIDEOS[idx]}
          className="absolute inset-0 h-full w-full object-cover brightness-[0.45] saturate-[0.85]"
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
          src={mediaUrl(VIDEOS[idx])}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover brightness-[0.45]" />
      )}
      <div className="video-overlay absolute inset-0" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-start justify-center px-6 pt-20">
        <p className="mb-4 font-display text-xs uppercase tracking-[0.35em] text-mos-amber">Master of Sword</p>
        <h1 className="max-w-xl font-display text-4xl leading-tight text-mos-text md:text-6xl">
          Играй. Тренируйся.
          <br />
          Прокачивай персонажа.
        </h1>
        <p className="mt-5 max-w-lg text-base text-mos-muted md:text-lg">
          Школа исторического фехтования с RPG-прогрессией: опыт за тренировки, достижения и путь мастерства.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="mos-btn">
            Начать путь
          </Link>
          <a href="#tariffs" className="mos-btn border-mos-line text-mos-text">
            Смотреть тарифы
          </a>
        </div>
      </div>
    </section>
  );
}
