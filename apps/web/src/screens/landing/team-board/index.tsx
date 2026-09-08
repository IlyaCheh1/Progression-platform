"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from "react";
import { createPortal } from "react-dom";

import Button from "@/components/ui/button";
import { useMobileMedia } from "@/hooks/landing/useMobileMedia";
import { useRevealFade } from "@/hooks/landing/useRevealFade";

import { pickBotMove, randomSide } from "./bot.ts";
import { TEAM_COPY, outcomeLabel, rowCountLabel, sideShort, sideTitle } from "./copy.ts";
import { createExploreState, exploreReducer } from "./explore-reducer.ts";
import { canSelectPlayerCard, createSetupState, gameReducer } from "./game-reducer.ts";
import { BoardRow, CardDialog, DragOverlay, Hand, MobileSideSwitcher, ModeSwitch, SidePanel } from "./pieces.tsx";
import { TEAM_BOARD_CARDS, buildRows } from "./roster.ts";
import {
  canPlaceOnRow,
  cardsById,
  evaluateMatch,
  oppositeSide,
  rowPower,
  scoreCard,
} from "./scoring.ts";
import { basePowerOf } from "./symbols.ts";
import type { BoardMode, CardPlacement, RowDef, SideId, TeamCard } from "./types.ts";
import "./team-board.css";

const DRAG_START_THRESHOLD_PX = 6;

const ROWS: RowDef[] = buildRows().map((row) => ({
  ...row,
  title: TEAM_COPY.rows[row.key].title,
  description: TEAM_COPY.rows[row.key].description,
}));

function suppressNextClick() {
  const swallow = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  window.addEventListener("click", swallow, { capture: true, once: true });
  window.setTimeout(() => window.removeEventListener("click", swallow, true), 50);
}

function handCards(placements: Record<string, CardPlacement>, roster: Record<string, TeamCard>, side: SideId): TeamCard[] {
  return Object.entries(placements)
    .filter(([, card]) => card.zone === "hand" && card.side === side)
    .sort(([, a], [, b]) => a.handOrder - b.handOrder)
    .map(([id]) => roster[id])
    .filter((card): card is TeamCard => Boolean(card));
}

function rowCards(placements: Record<string, CardPlacement>, roster: Record<string, TeamCard>, rowId: string): TeamCard[] {
  return Object.entries(placements)
    .filter(([, card]) => card.zone === "board" && card.rowId === rowId)
    .sort(([, a], [, b]) => a.rowOrder - b.rowOrder)
    .map(([id]) => roster[id])
    .filter((card): card is TeamCard => Boolean(card));
}

function isFinePointer() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
}

export default function TeamBoard() {
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useMobileMedia();
  const [mode, setMode] = useState<BoardMode>("explore");
  const [showResult, setShowResult] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [seenSides, setSeenSides] = useState<SideId[] | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const zones = useRef<Record<string, HTMLElement | null>>({});
  const dragPoint = useRef<{ x: number; y: number } | null>(null);
  const [hoverZone, setHoverZone] = useState<string | null>(null);
  const botTimer = useRef<number | null>(null);

  const roster = useMemo(() => cardsById(TEAM_BOARD_CARDS), []);
  const [explore, dispatchExplore] = useReducer(exploreReducer, TEAM_BOARD_CARDS, (cards) => createExploreState(cards));
  const reduceGame = useCallback((state: ReturnType<typeof createSetupState>, action: Parameters<typeof gameReducer>[1]) => {
    return gameReducer(state, action, TEAM_BOARD_CARDS);
  }, []);
  const [play, dispatchPlay] = useReducer(reduceGame, undefined, () => createSetupState());
  const playRef = useRef(play);
  playRef.current = play;

  const playing = mode === "play";
  useRevealFade(sectionRef, 0.05, playing ? play.phase : mode);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !playing) return;
    section.querySelectorAll(".reveal-fade").forEach((el) => el.classList.add("visible"));
  }, [play.phase, playing]);

  const board = playing ? play : explore;
  const topSide: SideId = playing && play.playerSide ? play.playerSide : "sideA";
  const bottomSide = oppositeSide(topSide);
  const visibleSides: SideId[] = [topSide, bottomSide];

  useLayoutEffect(() => {
    if (isMobile && seenSides === null) setSeenSides([board.activeSide]);
  }, [board.activeSide, isMobile, seenSides]);

  useEffect(() => {
    if (!isMobile || seenSides === null || seenSides.includes(board.activeSide)) return;
    setSeenSides((current) => [...(current ?? []), board.activeSide]);
  }, [board.activeSide, isMobile, seenSides]);

  const sideVisible = useCallback(
    (side: SideId) => !isMobile || seenSides === null || seenSides.includes(side),
    [isMobile, seenSides],
  );

  const registerZone = useCallback((id: string, node: HTMLElement | null) => {
    zones.current[id] = node;
  }, []);

  const zoneAtPoint = useCallback((x: number, y: number) => {
    return Object.entries(zones.current).find(([, node]) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    })?.[0];
  }, []);

  const placeExplore = useCallback((cardId: string, rowId: string) => {
    const placement = explore.cards[cardId];
    if (!placement) return;
    dispatchExplore({ type: placement.zone === "board" ? "MOVE_CARD" : "PLAY_CARD", cardId, rowId });
    const row = ROWS.find((item) => item.id === rowId);
    const card = roster[cardId];
    if (card && row) setAnnouncement(TEAM_COPY.announce.played(card.name, row.title));
  }, [explore.cards, roster]);

  const returnExplore = useCallback((cardId: string) => {
    dispatchExplore({ type: "RETURN_CARD", cardId });
    const card = roster[cardId];
    if (card) setAnnouncement(TEAM_COPY.announce.returned(card.name));
  }, [roster]);

  const placePlay = useCallback((cardId: string, rowId: string) => {
    const placement = play.cards[cardId];
    if (!placement) return;
    dispatchPlay({ type: placement.zone === "board" ? "MOVE_CARD" : "PLAY_CARD", cardId, rowId });
  }, [play.cards]);

  const openCard = useCallback((cardId: string) => {
    if (playing) dispatchPlay({ type: "OPEN_CARD", cardId });
    else dispatchExplore({ type: "OPEN_CARD", cardId });
  }, [playing]);

  const closeCard = useCallback(() => {
    if (playing) dispatchPlay({ type: "CLOSE_CARD" });
    else dispatchExplore({ type: "CLOSE_CARD" });
  }, [playing]);

  const setActiveSide = useCallback((side: SideId) => {
    if (playing) dispatchPlay({ type: "SET_ACTIVE_SIDE", side });
    else dispatchExplore({ type: "SET_ACTIVE_SIDE", side });
  }, [playing]);

  const dropCard = useCallback((cardId: string, zoneId?: string) => {
    if (!zoneId) return;
    if (zoneId.startsWith("hand-")) {
      const side = zoneId === "hand-sideA" ? "sideA" : "sideB";
      if (roster[cardId]?.side === side) {
        if (playing) dispatchPlay({ type: "RETURN_CARD", cardId });
        else returnExplore(cardId);
      }
      return;
    }
    if (playing) placePlay(cardId, zoneId);
    else placeExplore(cardId, zoneId);
  }, [placeExplore, placePlay, playing, returnExplore, roster]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>, cardId: string) => {
    if (event.button !== 0 || event.pointerType === "touch" || !isFinePointer()) return;
    if (playing && !canSelectPlayerCard(play, cardId)) return;

    const pointerId = event.pointerId;
    const originX = event.clientX;
    const originY = event.clientY;
    let started = false;
    dragPoint.current = { x: originX, y: originY };

    const placeOverlay = (x: number, y: number) => {
      if (!overlayRef.current) return;
      overlayRef.current.style.left = `${x}px`;
      overlayRef.current.style.top = `${y}px`;
    };

    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      dragPoint.current = { x: moveEvent.clientX, y: moveEvent.clientY };
      if (!started) {
        if (Math.hypot(moveEvent.clientX - originX, moveEvent.clientY - originY) < DRAG_START_THRESHOLD_PX) return;
        started = true;
        if (playing) dispatchPlay({ type: "START_DRAG", cardId });
        else dispatchExplore({ type: "START_DRAG", cardId });
      }
      placeOverlay(moveEvent.clientX, moveEvent.clientY);
      setHoverZone(zoneAtPoint(moveEvent.clientX, moveEvent.clientY) ?? null);
      moveEvent.preventDefault();
    };

    const finish = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      setHoverZone(null);
      if (!started) return;
      const zone = zoneAtPoint(upEvent.clientX, upEvent.clientY);
      if (playing) dispatchPlay({ type: "END_DRAG" });
      else dispatchExplore({ type: "END_DRAG" });
      dropCard(cardId, zone);
      suppressNextClick();
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  }, [dropCard, play, playing, zoneAtPoint]);

  useLayoutEffect(() => {
    if (!board.dragging || !dragPoint.current || !overlayRef.current) return;
    overlayRef.current.style.left = `${dragPoint.current.x}px`;
    overlayRef.current.style.top = `${dragPoint.current.y}px`;
  }, [board.dragging]);

  useEffect(() => {
    if (!playing || play.phase !== "finished" || play.result || !play.playerSide) return;
    const result = evaluateMatch(play.cards, roster, play.playerSide);
    dispatchPlay({ type: "FINISH_MATCH", result });
    setShowResult(true);
    setAnnouncement(outcomeLabel(result.outcome));
  }, [play.cards, play.phase, play.playerSide, play.result, playing, roster]);

  useEffect(() => {
    if (!playing || play.phase !== "botTurn" || !play.playerSide) return;
    const playerSide = play.playerSide;
    const timer = window.setTimeout(() => {
      const current = playRef.current;
      const move = pickBotMove(current, roster, { random: Math.random });
      if (!move) {
        dispatchPlay({ type: "FINISH_MATCH", result: evaluateMatch(current.cards, roster, playerSide) });
        setShowResult(true);
        return;
      }
      dispatchPlay({ type: "BOT_PLAY", cardId: move.cardId, rowId: move.rowId });
      const card = roster[move.cardId];
      const row = ROWS.find((item) => item.id === move.rowId);
      if (card && row) setAnnouncement(TEAM_COPY.announce.botPlayed(card.name, row.title));
      botTimer.current = window.setTimeout(() => {
        dispatchPlay({ type: "SET_ACTIVE_SIDE", side: playerSide });
      }, 1400);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [play.phase, play.playerSide, play.turn, playing, roster]);

  useEffect(() => () => {
    if (botTimer.current) window.clearTimeout(botTimer.current);
  }, []);

  const onTouchStart = (event: ReactTouchEvent) => {
    if (event.touches.length !== 1) {
      swipeStart.current = null;
      return;
    }
    swipeStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };

  const onTouchEnd = (event: ReactTouchEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || !window.matchMedia("(max-width: 767px)").matches) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
    const index = visibleSides.indexOf(board.activeSide);
    const next = visibleSides[index + (dx < 0 ? 1 : -1)];
    if (next) setActiveSide(next);
  };

  const expandedCard = board.expandedCardId ? roster[board.expandedCardId] : undefined;
  const expandedPlacement = board.expandedCardId ? board.cards[board.expandedCardId] : undefined;
  const draggedCard = board.dragging ? roster[board.dragging.cardId] : undefined;
  const showBoard = !playing || play.phase !== "setup";

  const powerByCardId = useMemo(() => {
    if (!playing) return undefined;
    return Object.fromEntries(
      Object.keys(play.cards).map((id) => [id, scoreCard(play.cards, roster, id)]),
    );
  }, [play.cards, playing, roster]);

  const dropStateOf = useCallback((rowId: string) => {
    const dragging = board.dragging;
    if (!dragging) return "idle" as const;
    const allowed = playing
      ? canPlaceOnRow(play, dragging.cardId, rowId)
      : explore.cards[dragging.cardId]?.allowedRows.includes(rowId) ?? false;
    const over = hoverZone === rowId;
    if (over) return allowed ? "active" : "blocked";
    return allowed ? "allowed" : "blocked";
  }, [board.dragging, explore.cards, hoverZone, play, playing]);

  const renderSide = (side: SideId) => {
    if (!sideVisible(side)) return null;
    return (
      <SidePanel
        side={side}
        title={sideTitle(side)}
        badge={playing && play.playerSide ? (side === play.playerSide ? TEAM_COPY.game.youBadge : TEAM_COPY.game.botBadge) : undefined}
        isPlayerSide={playing && play.playerSide === side}
      />
    );
  };

  const renderHand = (side: SideId) => {
    if (!sideVisible(side)) return null;
    const cards = handCards(board.cards, roster, side);
    const dragging = board.dragging ? board.cards[board.dragging.cardId] : undefined;
    return (
      <Hand
        side={side}
        title={sideTitle(side)}
        cards={cards}
        emptyLabel={TEAM_COPY.handEmpty}
        isReturnTarget={Boolean(
          dragging &&
            dragging.side === side &&
            dragging.zone === "board" &&
            (!playing || play.pendingCardId === board.dragging?.cardId),
        )}
        selectedCardId={board.selectedCardId}
        expandedCardId={board.expandedCardId}
        draggedCardId={board.dragging?.cardId}
        basePowerByCardId={Object.fromEntries(TEAM_BOARD_CARDS.map((card) => [card.id, basePowerOf(card)]))}
        cardLabel={(card) => `${card.name} — ${card.role}`}
        onActivate={openCard}
        onPointerDown={onPointerDown}
        registerZone={registerZone}
      />
    );
  };

  const renderRows = (side: SideId) => (
    <div className="team-board-side" data-side={side} aria-label={sideTitle(side)}>
      {ROWS.filter((row) => row.side === side).map((row, rank) => (
        <BoardRow
          key={row.id}
          row={row}
          rank={rank}
          cards={rowCards(board.cards, roster, row.id)}
          emptyLabel={TEAM_COPY.rowEmpty}
          countLabel={rowCountLabel(rowCards(board.cards, roster, row.id).length)}
          dropState={dropStateOf(row.id)}
          rowPower={playing ? rowPower(play.cards, roster, side, row.key) : undefined}
          powerByCardId={powerByCardId}
          selectedCardId={board.selectedCardId}
          expandedCardId={board.expandedCardId}
          draggedCardId={board.dragging?.cardId}
          cardLabel={(card) => `${card.name} — ${card.role}`}
          onActivate={openCard}
          onPointerDown={onPointerDown}
          registerZone={registerZone}
        />
      ))}
    </div>
  );

  return (
    <section id="team" ref={sectionRef} className="team-board-section relative z-10 overflow-x-clip px-6 py-24" data-mode={mode}>
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="reveal-fade text-center">
          <span className="mb-3 block font-golos text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--mos-amber)" }}>
            {TEAM_COPY.eyebrow}
          </span>
          <h2 className="font-unbounded mb-4 text-[calc(2.25rem-2pt)] font-medium text-white md:text-6xl">{TEAM_COPY.title}</h2>
          <p className="mx-auto max-w-2xl font-golos text-[calc(1rem-2pt)] leading-relaxed text-white/40 md:text-base">
            {playing ? TEAM_COPY.gameSubtitle : TEAM_COPY.subtitle}
          </p>
          <ModeSwitch
            mode={mode}
            onChange={(next) => {
              setMode(next);
              setShowResult(false);
            }}
          />
        </div>

        {playing ? (
          <div className="team-game-status" data-phase={play.phase}>
            {play.phase === "setup" ? (
              <>
                <p className="team-game-status-title">{TEAM_COPY.game.setupTitle}</p>
                <p className="team-game-status-copy">{TEAM_COPY.game.setupCopy}</p>
                <div className="team-game-side-pick">
                  {(["sideA", "sideB"] as const).map((side) => (
                    <Button
                      key={side}
                      variant={side === "sideA" ? "primary" : "stroke"}
                      size="md"
                      onClick={() => {
                        const first = randomSide();
                        dispatchPlay({ type: "CHOOSE_SIDE", side, firstSide: first, matchId: crypto.randomUUID() });
                        setAnnouncement(first === side ? TEAM_COPY.announce.startedYouFirst : TEAM_COPY.announce.startedBotFirst);
                      }}
                    >
                      {sideTitle(side)}
                    </Button>
                  ))}
                </div>
                <div className="team-game-rules-badge">
                  <button type="button" className="team-game-rules-trigger">
                    {TEAM_COPY.game.rulesBadge}
                  </button>
                  <div className="team-game-rules-tooltip" role="tooltip">
                    <ul className="team-game-rules">
                      <li>{TEAM_COPY.game.ruleTurns}</li>
                      <li>{TEAM_COPY.game.ruleRows}</li>
                      <li>{TEAM_COPY.game.ruleFirst}</li>
                      <li>{TEAM_COPY.game.ruleWin}</li>
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="team-game-status-title">
                  Ход {play.turn} / 6 · {play.phase === "playerTurn" ? "Ваш ход" : play.phase === "botTurn" ? "Ход бота" : "Финиш"}
                </p>
                {play.pendingCardId ? <p className="team-game-status-copy">{TEAM_COPY.game.pendingHint}</p> : null}
                <div className="team-game-status-actions">
                  {play.phase === "playerTurn" && play.pendingCardId ? (
                    <Button variant="primary" size="md" onClick={() => dispatchPlay({ type: "CONFIRM_TURN" })}>
                      {TEAM_COPY.game.confirmTurn}
                    </Button>
                  ) : null}
                  {play.result ? (
                    <Button variant="stroke" size="md" onClick={() => setShowResult(true)}>
                      {TEAM_COPY.game.showResult}
                    </Button>
                  ) : null}
                  <Button
                    variant="stroke"
                    size="md"
                    onClick={() => {
                      setShowResult(false);
                      dispatchPlay({ type: "BACK_TO_SETUP" });
                    }}
                  >
                    {TEAM_COPY.game.changeSide}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="team-game-status-actions" style={{ marginTop: "1.25rem" }}>
            <Button
              variant="stroke"
              size="md"
              onClick={() => {
                dispatchExplore({ type: "RESET_BOARD" });
                setAnnouncement(TEAM_COPY.announce.reset);
              }}
            >
              {TEAM_COPY.resetBoard}
            </Button>
          </div>
        )}

        {showBoard ? (
          <>
            <MobileSideSwitcher
              sides={visibleSides}
              activeSide={board.activeSide}
              labelOf={isMobile ? sideShort : sideTitle}
              onChange={setActiveSide}
            />
            {playing ? <p className="team-board-swipe-hint">{TEAM_COPY.swipeBoardHint}</p> : null}
            <div
              className="team-board reveal-fade"
              data-active-side={board.activeSide}
              data-top-side={topSide}
              data-dragging={board.dragging ? true : undefined}
              data-game={playing || undefined}
              data-phase={playing ? play.phase : undefined}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onTouchCancel={() => {
                swipeStart.current = null;
              }}
            >
              {renderSide(topSide)}
              {renderHand(topSide)}
              {playing ? (
                <div className="team-board-field">
                  {sideVisible(topSide) ? renderRows(topSide) : null}
                  <div className="team-board-divider" aria-hidden />
                  {sideVisible(bottomSide) ? renderRows(bottomSide) : null}
                </div>
              ) : null}
              {renderSide(bottomSide)}
              {renderHand(bottomSide)}
            </div>
          </>
        ) : null}

        <p className="team-sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </div>

      {expandedCard && expandedPlacement ? (
        <CardDialog
          card={expandedCard}
          zone={expandedPlacement.zone}
          rowId={expandedPlacement.rowId}
          allowedRows={expandedPlacement.allowedRows}
          rows={ROWS.filter((row) => row.side === expandedCard.side)}
          gameMode={playing}
          canPlay={playing ? canSelectPlayerCard(play, expandedCard.id) : false}
          canReturn={playing ? play.phase === "playerTurn" && play.pendingCardId === expandedCard.id : true}
          isRowPlayable={playing ? (rowId) => canPlaceOnRow(play, expandedCard.id, rowId) : undefined}
          abilityHint={TEAM_COPY.symbols[expandedCard.visual.symbol]}
          onClose={closeCard}
          onPlay={(rowId) => {
            if (playing) placePlay(expandedCard.id, rowId);
            else placeExplore(expandedCard.id, rowId);
            closeCard();
          }}
          onReturn={() => {
            if (playing) dispatchPlay({ type: "RETURN_CARD", cardId: expandedCard.id });
            else returnExplore(expandedCard.id);
            closeCard();
          }}
        />
      ) : null}

      {showResult && play.result && play.playerSide ? (
        <div className="team-result-backdrop" onClick={() => setShowResult(false)}>
          <div className="team-result-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3 className="team-result-title">{outcomeLabel(play.result.outcome)}</h3>
            <p className="team-result-copy">
              Ряды {play.result.rowsWon[play.playerSide]} : {play.result.rowsWon[oppositeSide(play.playerSide)]} · сила{" "}
              {play.result.totalPower[play.playerSide]} : {play.result.totalPower[oppositeSide(play.playerSide)]}
            </p>
            <div className="team-game-status-actions">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setShowResult(false);
                  dispatchPlay({ type: "REMATCH", firstSide: randomSide(), matchId: crypto.randomUUID() });
                }}
              >
                {TEAM_COPY.game.rematch}
              </Button>
              <Button
                variant="stroke"
                size="md"
                onClick={() => {
                  setShowResult(false);
                  dispatchPlay({ type: "BACK_TO_SETUP" });
                }}
              >
                {TEAM_COPY.game.changeSide}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {draggedCard && typeof document !== "undefined"
        ? createPortal(<DragOverlay card={draggedCard} overlayRef={overlayRef} />, document.body)
        : null}
    </section>
  );
}
