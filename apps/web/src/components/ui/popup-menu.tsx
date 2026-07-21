"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type PopupMenuProps = {
  trigger: ReactNode;
  children?: ReactNode;
  className?: string;
  placement?: "bottom-left" | "bottom-right" | "top-left" | "top-right" | "bottom" | "top" | "left" | "right";
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOverlay?: boolean;
  margin?: number;
  /** Open on hover (OG talent popups). */
  hover?: boolean;
};

function computeMenuPosition(
  triggerRect: DOMRect,
  menuRect: DOMRect,
  placement: PopupMenuProps["placement"],
  margin: number,
) {
  let top = triggerRect.bottom + margin;
  let left = triggerRect.left;

  if (placement === "bottom-left" || placement === "left") {
    left = triggerRect.right - menuRect.width;
  }
  if (placement === "bottom-right" || placement === "right" || placement === "bottom" || placement === "top") {
    left = triggerRect.left + triggerRect.width / 2 - menuRect.width / 2;
  }
  if (placement === "top" || placement === "top-left" || placement === "top-right") {
    top = triggerRect.top - menuRect.height - margin;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (
    top + menuRect.height > viewportHeight - 8 &&
    triggerRect.top - menuRect.height - margin >= 8
  ) {
    top = triggerRect.top - menuRect.height - margin;
  }

  left = Math.max(8, Math.min(left, viewportWidth - menuRect.width - 8));
  top = Math.max(8, Math.min(top, viewportHeight - menuRect.height - 8));

  return { top, left };
}

export default function PopupMenu({
  trigger,
  children,
  className,
  placement = "bottom-left",
  isOpen: controlledIsOpen,
  onOpenChange,
  isOverlay = false,
  margin = 12,
  hover = false,
}: PopupMenuProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const setIsOpen = useCallback(
    (open: boolean) => {
      if (onOpenChange) {
        onOpenChange(open);
      } else {
        setInternalIsOpen(open);
      }
    },
    [onOpenChange],
  );

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: -9999, left: -9999 });
  const [hasPosition, setHasPosition] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    if (!hover) return;
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setIsOpen(false), 180);
  }, [clearCloseTimer, hover, setIsOpen]);

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!isOpen || hover) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [hover, isOpen, setIsOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setHasPosition(false);
      return;
    }

    let frame = 0;

    const measure = () => {
      if (!triggerRef.current || !menuRef.current) {
        frame = requestAnimationFrame(measure);
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      if (menuRect.width === 0 || menuRect.height === 0) {
        frame = requestAnimationFrame(measure);
        return;
      }

      setMenuPosition(computeMenuPosition(triggerRect, menuRect, placement, margin));
      setHasPosition(true);
    };

    frame = requestAnimationFrame(measure);

    return () => cancelAnimationFrame(frame);
  }, [isOpen, margin, placement, portalMounted, children]);

  const toggleMenu = () => {
    if (!isOpen) {
      setHasPosition(false);
      setMenuPosition({ top: -9999, left: -9999 });
    }
    setIsOpen(!isOpen);
  };

  const openMenu = () => {
    if (!isOpen) {
      setHasPosition(false);
      setMenuPosition({ top: -9999, left: -9999 });
      setIsOpen(true);
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        role={hover ? undefined : "button"}
        tabIndex={hover ? undefined : 0}
        className="relative inline-flex shrink-0 cursor-pointer items-center"
        onMouseEnter={
          hover
            ? () => {
                clearCloseTimer();
                openMenu();
              }
            : undefined
        }
        onMouseLeave={hover ? scheduleClose : undefined}
        onClick={hover ? undefined : toggleMenu}
        onKeyDown={
          hover
            ? undefined
            : (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleMenu();
                }
              }
        }
      >
        {trigger}
      </div>

      {isOpen &&
        portalMounted &&
        createPortal(
          <>
            {isOverlay && (
              <div
                className="fixed inset-0 z-40 bg-black/50"
                aria-hidden
                onClick={() => setIsOpen(false)}
              />
            )}
            <div
              ref={menuRef}
              role="menu"
              className={cn(
                "fixed z-50 transition-opacity duration-200",
                hasPosition ? "opacity-100" : "pointer-events-none opacity-0",
                className,
              )}
              style={{ top: menuPosition.top, left: menuPosition.left }}
              onMouseEnter={hover ? clearCloseTimer : undefined}
              onMouseLeave={hover ? scheduleClose : undefined}
            >
              {children}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
