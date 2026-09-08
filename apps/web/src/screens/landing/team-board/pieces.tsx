"use client";

import { useEffect, type CSSProperties, type PointerEvent as ReactPointerEvent, type Ref } from "react";

import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { TEAM_COPY } from "./copy.ts";
import { basePowerOf, ICON_PATHS, ROW_SIGILS } from "./symbols.ts";
import type { CardScore, CardSymbol, RowDef, SideId, TeamCard } from "./types.ts";

export function SymbolIcon({ name, className }: { name?: CardSymbol | (typeof ROW_SIGILS)[number]; className?: string }) {
  const symbol = name && name in ICON_PATHS ? name : "rhombus";
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden focusable="false">
      <path d={ICON_PATHS[symbol]} />
    </svg>
  );
}

export function TeamCardFace({
  card,
  power,
  powerBonus,
  className,
}: {
  card: TeamCard;
  power?: number;
  powerBonus?: number;
  className?: string;
}) {
  const shownPower = power ?? basePowerOf(card);
  const plateHint = card.badge ?? card.role;
  return (
    <span
      className={cn("team-card-face", className)}
      data-rarity={card.mock ? "bronze" : "gold"}
      style={
        {
          "--card-accent": card.visual.accent,
          "--card-object-position": card.image.objectPosition ?? "top center",
        } as CSSProperties
      }
    >
      <span className="team-card-artwork">
        {card.image.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.image.src} alt={card.image.alt} className="team-card-photo" draggable={false} />
        ) : (
          <span className="team-card-fallback" aria-hidden>
            <span className="team-card-bust" />
            <span className="team-card-initials">{card.initials}</span>
          </span>
        )}
      </span>
      <span className="team-card-vignette" aria-hidden />
      <span className="team-card-frame" aria-hidden />
      <span className="team-card-power" data-boosted={Boolean(powerBonus && powerBonus > 0) || undefined}>
        <span className="team-card-power-gem">
          <span className="team-card-power-value">{shownPower}</span>
        </span>
        {powerBonus && powerBonus > 0 ? <span className="team-card-power-bonus">+{powerBonus}</span> : null}
      </span>
      <span className="team-card-faction" title={plateHint}>
        <SymbolIcon name={card.visual.symbol} />
      </span>
      {card.mock ? <span className="team-card-mock">{TEAM_COPY.mockBadge}</span> : null}
      <span className="team-card-plate">
        <span className="team-card-name">{card.name}</span>
        {plateHint ? <span className="team-card-role">{plateHint}</span> : null}
      </span>
    </span>
  );
}

export const CardFace = TeamCardFace;

export function TeamCardButton({
  card,
  label,
  isSelected,
  isExpanded,
  isDragging,
  tilt,
  depth,
  className,
  power,
  powerBonus,
  onActivate,
  onPointerDown,
  registerRef,
}: {
  card: TeamCard;
  label: string;
  isSelected?: boolean;
  isExpanded?: boolean;
  isDragging?: boolean;
  tilt?: string;
  depth?: number;
  className?: string;
  power?: number;
  powerBonus?: number;
  onActivate: (cardId: string) => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>, cardId: string) => void;
  registerRef?: (cardId: string, node: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      type="button"
      ref={(node) => registerRef?.(card.id, node)}
      className={cn("team-card", className)}
      style={{ "--card-tilt": tilt ?? "0deg", "--card-depth": depth ?? 0 } as CSSProperties}
      aria-label={label}
      aria-pressed={isSelected}
      aria-expanded={isExpanded}
      data-dragging={isDragging || undefined}
      data-selected={isSelected || undefined}
      data-card-id={card.id}
      data-rarity={card.mock ? "bronze" : "gold"}
      data-side={card.side}
      onClick={() => onActivate(card.id)}
      onPointerDown={(event) => onPointerDown?.(event, card.id)}
    >
      <TeamCardFace card={card} power={power} powerBonus={powerBonus} />
    </button>
  );
}

export function MobileSideSwitcher({
  sides,
  activeSide,
  labelOf,
  onChange,
}: {
  sides: SideId[];
  activeSide: SideId;
  labelOf: (side: SideId) => string;
  onChange: (side: SideId) => void;
}) {
  return (
    <div className="team-side-switch" role="group" aria-label={TEAM_COPY.switchSides}>
      {sides.map((side) => (
        <button
          key={side}
          type="button"
          className="team-side-switch-button"
          data-active={activeSide === side || undefined}
          aria-pressed={activeSide === side}
          onClick={() => onChange(side)}
        >
          {labelOf(side)}
        </button>
      ))}
    </div>
  );
}

export function SidePanel({
  side,
  title,
  badge,
  isPlayerSide,
}: {
  side: SideId;
  title: string;
  badge?: string;
  isPlayerSide?: boolean;
}) {
  return (
    <aside className="team-side-panel" data-side={side} data-player-side={isPlayerSide || undefined}>
      <div className="team-side-panel-main">
        <h3 className="team-side-panel-title">{title}</h3>
        {badge ? <span className="team-side-panel-badge">{badge}</span> : null}
      </div>
    </aside>
  );
}

export function Hand({
  side,
  title,
  cards,
  emptyLabel,
  isReturnTarget,
  isActiveZone,
  basePowerByCardId,
  selectedCardId,
  expandedCardId,
  draggedCardId,
  cardLabel,
  onActivate,
  onPointerDown,
  registerZone,
  registerCardRef,
}: {
  side: SideId;
  title: string;
  cards: TeamCard[];
  emptyLabel: string;
  isReturnTarget?: boolean;
  isActiveZone?: boolean;
  basePowerByCardId?: Record<string, number>;
  selectedCardId: string | null;
  expandedCardId: string | null;
  draggedCardId?: string | null;
  cardLabel: (card: TeamCard) => string;
  onActivate: (cardId: string) => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>, cardId: string) => void;
  registerZone: (id: string, node: HTMLElement | null) => void;
  registerCardRef?: (cardId: string, node: HTMLButtonElement | null) => void;
}) {
  const mid = (cards.length - 1) / 2;
  return (
    <section
      className="team-hand"
      data-side={side}
      data-return-target={isReturnTarget || undefined}
      data-active-zone={isActiveZone || undefined}
      aria-label={title}
      ref={(node) => registerZone(`hand-${side}`, node)}
    >
      {cards.length === 0 ? (
        <p className="team-hand-empty">{emptyLabel}</p>
      ) : (
        <ul className="team-hand-list">
          {cards.map((card, index) => {
            const lift = index === 0 || index === cards.length - 1 ? 8 : index === Math.floor(mid) || index === Math.ceil(mid) ? -3 : 0;
            return (
              <li
                key={card.id}
                className="team-hand-slot"
                style={{ zIndex: index + 1, ...(lift ? { transform: `translateY(${lift}px)` } : {}) }}
              >
                <TeamCardButton
                  card={card}
                  label={cardLabel(card)}
                  isSelected={selectedCardId === card.id}
                  isExpanded={expandedCardId === card.id}
                  isDragging={draggedCardId === card.id}
                  power={basePowerByCardId?.[card.id]}
                  tilt={`${((index - mid) * 2).toFixed(2)}deg`}
                  depth={index}
                  onActivate={onActivate}
                  onPointerDown={onPointerDown}
                  registerRef={registerCardRef}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function BoardRow({
  row,
  rank,
  cards,
  emptyLabel,
  countLabel,
  dropState,
  rowPower,
  powerByCardId,
  selectedCardId,
  expandedCardId,
  draggedCardId,
  cardLabel,
  onActivate,
  onPointerDown,
  registerZone,
  registerCardRef,
}: {
  row: RowDef;
  rank: number;
  cards: TeamCard[];
  emptyLabel: string;
  countLabel: string;
  dropState?: "allowed" | "active" | "blocked" | "idle";
  rowPower?: number;
  powerByCardId?: Record<string, CardScore>;
  selectedCardId: string | null;
  expandedCardId: string | null;
  draggedCardId?: string | null;
  cardLabel: (card: TeamCard) => string;
  onActivate: (cardId: string) => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>, cardId: string) => void;
  registerZone: (id: string, node: HTMLElement | null) => void;
  registerCardRef?: (cardId: string, node: HTMLButtonElement | null) => void;
}) {
  const sigil = ROW_SIGILS[rank % ROW_SIGILS.length];
  return (
    <div
      className="team-row"
      data-drop-state={dropState}
      data-filled={cards.length > 0 || undefined}
      data-has-power={rowPower !== undefined || undefined}
      data-lane={sigil}
      ref={(node) => registerZone(row.id, node)}
    >
      <span className="team-sr-only">
        {row.title}. {row.description}
      </span>
      <span className="team-row-count" aria-hidden>
        {rowPower !== undefined ? rowPower : countLabel}
      </span>
      <span className="team-row-sigil" aria-hidden>
        <SymbolIcon name={sigil} />
      </span>
      <div className="team-row-field">
        <ul className="team-row-track" aria-label={row.title}>
          {cards.length === 0 ? (
            <li className="team-sr-only">{emptyLabel}</li>
          ) : (
            cards.map((card, index) => {
              const score = powerByCardId?.[card.id];
              return (
                <li key={card.id} className="team-row-slot">
                  <TeamCardButton
                    card={card}
                    label={cardLabel(card)}
                    isSelected={selectedCardId === card.id}
                    isExpanded={expandedCardId === card.id}
                    isDragging={draggedCardId === card.id}
                    power={score?.total}
                    powerBonus={score?.bonus}
                    depth={index}
                    className="team-card-on-board"
                    onActivate={onActivate}
                    onPointerDown={onPointerDown}
                    registerRef={registerCardRef}
                  />
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

export function CardDialog({
  card,
  zone,
  rowId,
  allowedRows,
  rows,
  onClose,
  onPlay,
  onReturn,
  gameMode,
  canPlay,
  canReturn,
  isRowPlayable,
  abilityHint,
}: {
  card: TeamCard;
  zone: "hand" | "board";
  rowId: string | null;
  allowedRows: string[];
  rows: RowDef[];
  onClose: () => void;
  onPlay: (rowId: string) => void;
  onReturn: () => void;
  gameMode: boolean;
  canPlay: boolean;
  canReturn: boolean;
  isRowPlayable?: (rowId: string) => boolean;
  abilityHint?: string;
}) {
  const onBoard = zone === "board";
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="team-dialog-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`team-dialog-${card.id}`}
        className="team-dialog"
        style={{ "--card-accent": card.visual.accent } as CSSProperties}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="team-dialog-close" aria-label={TEAM_COPY.close} onClick={onClose}>
          ×
        </button>
        <div className="team-dialog-grid">
          <div className="team-dialog-art">
            <CardFace card={card} />
          </div>
          <div>
            <h3 id={`team-dialog-${card.id}`} className="team-dialog-name">
              {card.name}
            </h3>
            <p className="team-dialog-role">{card.role}</p>
            <p className="team-dialog-bio">{card.fullDescription}</p>
            {card.mock ? <p className="team-dialog-ability">{TEAM_COPY.mockHint}</p> : null}
            {abilityHint ? <p className="team-dialog-ability">{abilityHint}</p> : null}
            {canPlay || (gameMode && canReturn && onBoard) || (!gameMode && onBoard) ? (
              <div className="team-dialog-actions">
                {canPlay ? (
                  <>
                    <p className="team-dialog-block-title">{onBoard ? TEAM_COPY.moveCard : TEAM_COPY.chooseRow}</p>
                    <div className="team-dialog-rows" role="group">
                      {rows.map((row) => {
                        const current = rowId === row.id;
                        const allowed = allowedRows.includes(row.id);
                        const playable = isRowPlayable ? isRowPlayable(row.id) : allowed && !current;
                        return (
                          <button
                            key={row.id}
                            type="button"
                            className="team-dialog-row-button"
                            data-current={current || undefined}
                            disabled={current || !playable}
                            onClick={() => onPlay(row.id)}
                          >
                            <span className="team-dialog-row-name">{row.title}</span>
                            <span className="team-dialog-row-hint">
                              {current ? TEAM_COPY.currentRow : allowed ? row.description : TEAM_COPY.game.rowForbidden}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : gameMode ? (
                  <p className="team-dialog-block-title">{TEAM_COPY.game.cardLocked}</p>
                ) : null}
                {(canReturn && onBoard) || (!gameMode && onBoard) ? (
                  <Button variant="stroke" size="md" className="w-full" disabled={gameMode && !canReturn} onClick={onReturn}>
                    {TEAM_COPY.returnToHand}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModeSwitch({
  mode,
  onChange,
}: {
  mode: "explore" | "play";
  onChange: (mode: "explore" | "play") => void;
}) {
  return (
    <div className="team-mode-switch" role="group" aria-label={TEAM_COPY.modeExplore}>
      <button
        type="button"
        className="team-mode-switch-button"
        data-active={mode === "explore" || undefined}
        aria-pressed={mode === "explore"}
        onClick={() => onChange("explore")}
      >
        {TEAM_COPY.modeExplore}
      </button>
      <button
        type="button"
        className="team-mode-switch-button"
        data-active={mode === "play" || undefined}
        aria-pressed={mode === "play"}
        onClick={() => onChange("play")}
      >
        {TEAM_COPY.modePlay}
      </button>
    </div>
  );
}

export function DragOverlay({
  card,
  overlayRef,
}: {
  card: TeamCard;
  overlayRef: Ref<HTMLDivElement>;
}) {
  return (
    <div className="team-drag-overlay" ref={overlayRef}>
      <CardFace card={card} />
    </div>
  );
}
