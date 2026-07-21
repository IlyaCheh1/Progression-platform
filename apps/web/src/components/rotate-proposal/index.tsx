"use client";

import { useEffect } from "react";
import "./rotate-proposal.css";

function RotateIcon({ className }: { className?: string }) {
  return (
    <svg
      width="80"
      height="100"
      viewBox="60 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="118" y="24" width="74" height="142" rx="14" stroke="currentColor" strokeWidth="4" />
      <rect x="140.5" y="30" width="30" height="4" rx="2" fill="currentColor" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M155.142 108.33C162.111 108.33 167.761 102.565 167.761 95.4528C167.761 88.3408 162.111 82.5755 155.142 82.5755C148.173 82.5755 142.523 88.3408 142.523 95.4528C142.523 102.565 148.173 108.33 155.142 108.33ZM155.142 110.906C163.505 110.906 170.284 103.987 170.284 95.4528C170.284 86.9185 163.505 80 155.142 80C146.779 80 140 86.9185 140 95.4528C140 103.987 146.779 110.906 155.142 110.906Z"
        fill="url(#rotateIconRingOuter)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M155.083 105.735C160.68 105.735 165.217 101.131 165.217 95.4528C165.217 89.7743 160.68 85.171 155.083 85.171C149.486 85.171 144.949 89.7743 144.949 95.4528C144.949 101.131 149.486 105.735 155.083 105.735ZM155.083 102.307C158.815 102.307 161.839 99.2385 161.839 95.4528H148.327C148.327 99.2385 151.352 102.307 155.083 102.307Z"
        fill="url(#rotateIconRingInner)"
      />
      <path
        d="M228.267 72.6365L217.341 71.0154C216.524 70.8982 215.759 71.4607 215.637 72.281L214.016 83.207C213.895 84.0273 214.462 84.789 215.282 84.9101C215.356 84.9219 215.43 84.9258 215.505 84.9258C216.235 84.9258 216.876 84.3906 216.985 83.6446L218.184 75.5743C223.251 80.7813 226.126 87.7383 226.126 95.0743C226.126 103.344 222.493 111.148 216.157 116.488C215.524 117.023 215.442 117.969 215.977 118.602C216.274 118.953 216.696 119.133 217.126 119.133C217.465 119.133 217.809 119.016 218.09 118.781C225.102 112.871 229.121 104.23 229.121 95.0743C229.121 87.4923 226.36 80.2692 221.43 74.6522L227.828 75.6015C228.653 75.7187 229.41 75.1562 229.532 74.3359C229.653 73.5156 229.086 72.7539 228.266 72.6328L228.267 72.6365Z"
        fill="currentColor"
      />
      <defs>
        <linearGradient id="rotateIconRingOuter" x1="165.237" y1="83.0047" x2="144.532" y2="109.211" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d4a84b" />
          <stop offset="1" stopColor="#e5b042" />
        </linearGradient>
        <linearGradient id="rotateIconRingInner" x1="165.237" y1="83.0047" x2="144.532" y2="109.211" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d4a84b" />
          <stop offset="1" stopColor="#e5b042" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Fullscreen prompt to physically rotate the device (OnlyGames pattern). */
export default function RotateProposal() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="rotate-proposal fixed inset-0 z-[9999] bg-mos-bg">
      <div className="rotate-proposal__gradient flex h-full items-start justify-center">
        <div className="mt-[30vh] flex flex-col items-center justify-center text-center">
          <RotateIcon className="rotate-proposal__icon text-primaryText" />
          <h1 className="mt-8 font-unbounded text-sm text-primaryText">
            Поверните устройство горизонтально
          </h1>
        </div>
      </div>
    </div>
  );
}
