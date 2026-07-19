"use client";

import {
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
  placement?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOverlay?: boolean;
  margin?: number;
};

export default function PopupMenu({
  trigger,
  children,
  className,
  placement = "bottom-left",
  isOpen: controlledIsOpen,
  onOpenChange,
  isOverlay = false,
  margin = 12,
}: PopupMenuProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const setIsOpen = onOpenChange ?? setInternalIsOpen;

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: -9999, left: -9999 });
  const [hasPosition, setHasPosition] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, setIsOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setHasPosition(false);
      return;
    }

    const measure = () => {
      if (!triggerRef.current || !menuRef.current) {
        requestAnimationFrame(measure);
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      if (menuRect.width === 0 || menuRect.height === 0) {
        requestAnimationFrame(measure);
        return;
      }

      let top = triggerRect.bottom + margin;
      let left = triggerRect.left;

      if (placement === "bottom-left") {
        left = triggerRect.right - menuRect.width;
      }
      if (placement === "bottom-right") {
        left = triggerRect.left;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      left = Math.max(8, Math.min(left, viewportWidth - menuRect.width - 8));
      top = Math.max(8, Math.min(top, viewportHeight - menuRect.height - 8));

      setMenuPosition({ top, left });
      setHasPosition(true);
    };

    requestAnimationFrame(measure);
  }, [isOpen, margin, placement, portalMounted]);

  const toggleMenu = () => {
    if (!isOpen) {
      setHasPosition(false);
      setMenuPosition({ top: -9999, left: -9999 });
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className="relative inline-flex h-full items-center">
        <div
          ref={triggerRef}
          role="button"
          tabIndex={0}
          className="inline-flex h-full cursor-pointer items-center"
          onClick={toggleMenu}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleMenu();
            }
          }}
        >
          {trigger}
        </div>
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
            >
              {children}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
