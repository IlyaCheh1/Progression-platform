"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useHorizontalSwipe } from "@/hooks/landing/useHorizontalSwipe";
import { HALL_RENTAL_HALLS, stepHallPhoto, type HallRentalHall, type HallRentalPhoto } from "@/lib/landing/hall-rental";

export function HallChipRow({
  hallId,
  onChange,
  controls,
}: {
  hallId: HallRentalHall["id"];
  onChange: (id: HallRentalHall["id"]) => void;
  controls?: string;
}) {
  return (
    <div className="hall-chip-row" role="tablist" aria-label="Залы">
      {HALL_RENTAL_HALLS.map((item) => {
        const active = item.id === hallId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`hall-tab-${item.id}`}
            className={`hall-day-chip ${active ? "is-active" : ""}`}
            aria-selected={active}
            aria-controls={controls}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function HallSlideTrack({
  photos,
  pos,
  instant,
  onSettle,
}: {
  photos: readonly HallRentalPhoto[];
  pos: number;
  instant: boolean;
  onSettle?: (event: React.TransitionEvent<HTMLDivElement>) => void;
}) {
  const track = [...photos, ...photos, ...photos];
  return (
    <div
      className={`hall-slide-track${instant ? " is-instant" : ""}`}
      onTransitionEnd={onSettle}
    >
      {track.map((photo, trackIndex) => (
        <div className="hall-slide-item" key={`${photo.src}-${trackIndex}`} data-track-index={trackIndex}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt="" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

function PeekHallFilmstrip({ photos }: { photos: readonly HallRentalPhoto[] }) {
  const count = photos.length;
  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState(count);
  const [moving, setMoving] = useState(false);
  const [instant, setInstant] = useState(false);
  const shiftRef = useRef<(delta: number) => void>(() => {});
  const swipeRef = useHorizontalSwipe((direction) => shiftRef.current(direction));
  const current = photos[index] ?? photos[0];
  const previous = photos[stepHallPhoto(index, -1, count)];
  const next = photos[stepHallPhoto(index, 1, count)];

  useEffect(() => {
    if (!instant) return;
    const frame = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(frame);
  }, [instant, pos]);

  useEffect(() => {
    if (!moving) return;
    const timer = window.setTimeout(() => {
      setInstant(true);
      setPos(count + index);
      setMoving(false);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [moving, index, count]);

  if (!current || !previous || !next || count === 0) return null;

  const shift = (delta: number) => {
    if (delta === 0 || moving) return;
    const nextIndex = stepHallPhoto(index, delta, count);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIndex(nextIndex);
      setInstant(true);
      setPos(count + nextIndex);
      return;
    }
    setMoving(true);
    setIndex(nextIndex);
    setPos((value) => value + delta);
  };

  const goTo = (target: number) => {
    let delta = target - index;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    shift(delta);
  };

  const settle = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !event.propertyName.includes("transform")) return;
    const settled = count + index;
    if (pos !== settled) {
      setInstant(true);
      setPos(settled);
    }
    setMoving(false);
  };

  const slide = { "--hall-pos": pos } as CSSProperties;
  shiftRef.current = shift;

  return (
    <div className="hall-filmstrip-block mt-10">
      <div
        ref={swipeRef}
        className={`hall-filmstrip reveal-fade hall-filmstrip--peek${instant ? " is-instant" : ""}`}
        role="group"
        aria-label="Фото зала"
        data-hall-index={index}
        style={slide}
      >
        <button
          type="button"
          className="hall-filmstrip-frame is-side is-prev"
          aria-label={`Предыдущее фото: ${previous.caption}`}
          onClick={() => shift(-1)}
        >
          <HallSlideTrack photos={photos} pos={pos} instant={instant} />
        </button>
        <figure className="hall-filmstrip-frame is-center">
          <HallSlideTrack photos={photos} pos={pos} instant={instant} onSettle={settle} />
          <figcaption className="sr-only">{current.caption}</figcaption>
        </figure>
        <button
          type="button"
          className="hall-filmstrip-frame is-side is-next"
          aria-label={`Следующее фото: ${next.caption}`}
          onClick={() => shift(1)}
        >
          <HallSlideTrack photos={photos} pos={pos} instant={instant} />
        </button>
      </div>
      <div className="hall-filmstrip-dots" role="tablist" aria-label="Кадры зала">
        {photos.map((photo, photoIndex) => (
          <button
            key={photo.src}
            type="button"
            role="tab"
            className={`hall-filmstrip-dot${photoIndex === index ? " is-active" : ""}`}
            aria-selected={photoIndex === index}
            aria-label={photo.caption}
            onClick={() => goTo(photoIndex)}
          />
        ))}
      </div>
    </div>
  );
}

export function HallFilmstrip({
  photos,
  peek = false,
}: {
  photos: readonly HallRentalPhoto[];
  peek?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const swipeRef = useHorizontalSwipe((direction) => {
    setIndex((value) => stepHallPhoto(value, direction, count));
  });
  const current = photos[index] ?? photos[0];
  const previous = photos[stepHallPhoto(index, -1, count)];
  const next = photos[stepHallPhoto(index, 1, count)];

  if (peek) return <PeekHallFilmstrip photos={photos} />;
  if (!current || !previous || !next) return null;

  return (
    <div className="mt-10">
      <div ref={swipeRef} className="hall-filmstrip reveal-fade" role="group" aria-label="Фото зала">
        <button
          type="button"
          className="hall-filmstrip-frame is-side is-prev"
          aria-label={`Предыдущее фото: ${previous.caption}`}
          onClick={() => setIndex((value) => stepHallPhoto(value, -1, count))}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previous.src} alt="" className="object-cover" />
        </button>
        <figure className="hall-filmstrip-frame is-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.src} alt={current.alt} className="object-cover" />
          <figcaption className="sr-only">{current.caption}</figcaption>
        </figure>
        <button
          type="button"
          className="hall-filmstrip-frame is-side is-next"
          aria-label={`Следующее фото: ${next.caption}`}
          onClick={() => setIndex((value) => stepHallPhoto(value, 1, count))}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={next.src} alt="" className="object-cover" />
        </button>
      </div>
    </div>
  );
}

/** Chips and filmstrip for /arenda. Characteristic cards stay on the page. */
export default function HallRentalMedia() {
  const [hallId, setHallId] = useState<HallRentalHall["id"]>("ushu");
  const hall = HALL_RENTAL_HALLS.find((item) => item.id === hallId) ?? HALL_RENTAL_HALLS[0];

  return (
    <div className="mt-8">
      <HallChipRow hallId={hall.id} onChange={setHallId} />
      <HallFilmstrip key={hall.id} photos={hall.photos} />
    </div>
  );
}
