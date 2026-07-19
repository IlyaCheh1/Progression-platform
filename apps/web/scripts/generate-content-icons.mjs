#!/usr/bin/env node
/**
 * Generates SVG medallion icons for quests & achievements (Witcher visual system).
 * Output: public/media/content-icons/{quests,achievements}/{key}.svg
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outQuests = join(root, "public/media/content-icons/quests");
const outAch = join(root, "public/media/content-icons/achievements");

const BG = "#1a1a1d";
const STONE = "#2b2824";
const AMBER = "#c9a227";
const SILVER = "#b8b0a4";
const MUTED = "#6b6560";

/** Symbol id -> SVG inner markup (centered ~64x64 in 128 viewBox) */
const SYMBOLS = {
  scroll: `<path d="M44 36h40v56H44V36zm6 6v44h28V42H50zm-4-8h48v8H46v-8z" fill="${SILVER}"/><path d="M52 48h24v4H52zm0 10h20v4H52zm0 10h16v4H52z" fill="${MUTED}"/>`,
  safety: `<path d="M28 52 L64 28 L100 52 L100 88 L64 108 L28 88 Z" fill="none" stroke="${AMBER}" stroke-width="3"/><path d="M48 56h32v8H48zm0 16h24v8H48z" fill="${SILVER}"/>`,
  hall_door: `<rect x="40" y="32" width="48" height="64" rx="4" fill="${STONE}" stroke="${AMBER}" stroke-width="2"/><path d="M52 48h24v32H52z" fill="${MUTED}"/><circle cx="70" cy="64" r="3" fill="${AMBER}"/>`,
  salute: `<path d="M64 24v40" stroke="${SILVER}" stroke-width="4"/><path d="M64 64 L88 88" stroke="${AMBER}" stroke-width="5" stroke-linecap="round"/><ellipse cx="64" cy="96" rx="20" ry="6" fill="${MUTED}"/>`,
  chronicle: `<rect x="36" y="36" width="56" height="56" rx="4" fill="${STONE}" stroke="${AMBER}" stroke-width="2"/><path d="M44 48h40M44 60h32M44 72h36M44 84h24" stroke="${SILVER}" stroke-width="2"/>`,
  fork_paths: `<path d="M64 28 L64 72 M64 72 L40 96 M64 72 L88 96" stroke="${AMBER}" stroke-width="4" fill="none"/><circle cx="40" cy="96" r="8" fill="${SILVER}"/><circle cx="88" cy="96" r="8" fill="${SILVER}"/>`,
  die_d8: `<polygon points="64,28 92,44 92,76 64,92 36,76 36,44" fill="${STONE}" stroke="${AMBER}" stroke-width="2"/><text x="64" y="68" text-anchor="middle" fill="${AMBER}" font-size="22" font-family="serif">8</text>`,
  arsenal: `<rect x="32" y="48" width="64" height="40" rx="4" fill="${STONE}" stroke="${AMBER}" stroke-width="2"/><path d="M40 44h48v8H40z" fill="${AMBER}"/><path d="M48 56h8v24h-8zm16 0h8v24h-8zm16 0h8v24h-8z" fill="${SILVER}"/>`,
  herald: `<path d="M64 28 L88 40 V72 L64 96 L40 72 V40 Z" fill="${STONE}" stroke="${AMBER}" stroke-width="2"/><path d="M64 40 L72 56 H56 Z" fill="${AMBER}"/>`,
  torch_path: `<path d="M60 32h8v16c0 8-12 8-12 16 0 6 4 10 4 10s4-4 4-10c0-8-12-8-12-16V32z" fill="${AMBER}"/><path d="M32 88h64" stroke="${SILVER}" stroke-width="3"/>`,
  ready: `<circle cx="64" cy="52" r="24" fill="none" stroke="${AMBER}" stroke-width="3"/><path d="M52 52h24M64 40v24" stroke="${SILVER}" stroke-width="3"/>`,
  focus: `<circle cx="64" cy="56" r="28" fill="none" stroke="${AMBER}" stroke-width="2"/><circle cx="64" cy="56" r="8" fill="${AMBER}"/><path d="M64 28v12M64 80v12M36 56h12M84 56h12" stroke="${MUTED}" stroke-width="2"/>`,
  balance: `<path d="M32 72h64" stroke="${SILVER}" stroke-width="3"/><path d="M64 32v40" stroke="${AMBER}" stroke-width="4"/><circle cx="48" cy="72" r="10" fill="${STONE}" stroke="${AMBER}"/><circle cx="80" cy="72" r="10" fill="${STONE}" stroke="${AMBER}"/>`,
  partner: `<circle cx="48" cy="56" r="12" fill="${STONE}" stroke="${SILVER}"/><circle cx="80" cy="56" r="12" fill="${STONE}" stroke="${SILVER}"/><path d="M48 68 L64 88 L80 68" stroke="${AMBER}" stroke-width="3" fill="none"/>`,
  reflection: `<rect x="40" y="36" width="48" height="56" rx="3" fill="${STONE}"/><path d="M48 48h32M48 60h24M48 72h28" stroke="${SILVER}" stroke-width="2"/><path d="M88 44l8 8-16 16-8-8z" fill="${AMBER}"/>`,
  rhythm2: `<path d="M40 80 L52 48 L64 80 L76 48 L88 80" stroke="${AMBER}" stroke-width="3" fill="none"/><text x="64" y="100" text-anchor="middle" fill="${SILVER}" font-size="14">2</text>`,
  rhythm3: `<path d="M36 80 L48 44 L64 72 L80 44 L92 80" stroke="${AMBER}" stroke-width="3" fill="none"/><text x="64" y="100" text-anchor="middle" fill="${SILVER}" font-size="14">3</text>`,
  two_paths: `<path d="M40 88 L64 32 L88 88" stroke="${AMBER}" stroke-width="3" fill="none"/><path d="M52 88 L64 56 L76 88" stroke="${SILVER}" stroke-width="2" fill="none"/>`,
  master_lesson: `<circle cx="64" cy="40" r="12" fill="${STONE}" stroke="${AMBER}"/><path d="M40 88 Q64 60 88 88" stroke="${SILVER}" stroke-width="3" fill="none"/><path d="M56 72h16v16H56z" fill="${AMBER}"/>`,
  manuscript: `<rect x="36" y="32" width="56" height="64" fill="${STONE}" stroke="${AMBER}"/><path d="M44 44h40M44 56h32M44 68h36" stroke="${MUTED}" stroke-width="2"/><text x="64" y="92" text-anchor="middle" fill="${AMBER}" font-size="10">1536</text>`,
  community: `<path d="M44 56c0-8 8-12 8-12s8 4 8 12v32H44V56zm32 0c0-8 8-12 8-12s8 4 8 12v32H76V56z" fill="${STONE}" stroke="${SILVER}"/><path d="M56 72h16" stroke="${AMBER}" stroke-width="3"/>`,
  event_banner: `<path d="M48 32h32v8H48z" fill="${AMBER}"/><path d="M52 40v48l12-8 12 8V40" fill="${STONE}" stroke="${SILVER}"/>`,
  calendar8: `<rect x="36" y="36" width="56" height="52" rx="4" fill="${STONE}" stroke="${AMBER}"/><text x="64" y="58" text-anchor="middle" fill="${SILVER}" font-size="12">MONTH</text><text x="64" y="78" text-anchor="middle" fill="${AMBER}" font-size="20">8</text>`,
  new_blade: `<path d="M64 28 L68 72 L64 80 L60 72 Z" fill="${SILVER}"/><path d="M58 80h12v12H58z" fill="${AMBER}"/><circle cx="64" cy="96" r="4" fill="${MUTED}"/>`,
  chain: `<path d="M40 56h8v16h-8zm16 0h8v16h-8zm16 0h8v16h-8zm16 0h8v16h-8z" fill="none" stroke="${AMBER}" stroke-width="4"/>`,
  school_life: `<circle cx="64" cy="56" r="28" fill="none" stroke="${AMBER}"/><circle cx="52" cy="52" r="6" fill="${SILVER}"/><circle cx="76" cy="52" r="6" fill="${SILVER}"/><circle cx="64" cy="68" r="6" fill="${SILVER}"/>`,
  eight_paths: `<circle cx="64" cy="64" r="32" fill="none" stroke="${AMBER}" stroke-width="2"/><path d="M64 32v64M32 64h64M44 44l40 40M84 44L44 84" stroke="${MUTED}" stroke-width="2"/>`,
  medal: `<circle cx="64" cy="56" r="24" fill="${STONE}" stroke="${AMBER}" stroke-width="3"/><path d="M52 80 L64 96 L76 80" fill="${AMBER}"/>`,
  trophy: `<path d="M48 36h32v24c0 12-32 12-32 0V36z" fill="${AMBER}"/><rect x="56" y="60" width="16" height="12" fill="${SILVER}"/><rect x="48" y="72" width="32" height="8" fill="${STONE}" stroke="${AMBER}"/>`,
  hero_enter: `<path d="M64 28 L72 48 H88 L76 60 L80 80 L64 68 L48 80 L52 60 L40 48 H56 Z" fill="${AMBER}"/>`,
  star_rank: `<polygon points="64,28 72,52 96,52 76,66 84,92 64,76 44,92 52,66 32,52 56,52" fill="none" stroke="${AMBER}" stroke-width="2"/>`,
  four_paths: `<circle cx="64" cy="64" r="28" fill="none" stroke="${AMBER}"/><path d="M64 36v56M36 64h56" stroke="${MUTED}"/>`,
  universal: `<circle cx="64" cy="64" r="20" fill="${STONE}" stroke="${AMBER}"/><path d="M64 44v40M44 64h40" stroke="${SILVER}"/>`,
  weapon_master: `<path d="M64 24 L68 68 L64 76 L60 68 Z" fill="${SILVER}"/><circle cx="64" cy="64" r="28" fill="none" stroke="${AMBER}" stroke-width="2"/>`,
  master_sword: `<path d="M64 20 L66 72 L64 88 L62 72 Z" fill="${SILVER}"/><path d="M48 88h32" stroke="${AMBER}" stroke-width="4"/><circle cx="64" cy="64" r="30" fill="none" stroke="${AMBER}" stroke-width="2"/>`,
  weapon_sword1: `<path d="M64 28 L66 72 L64 80 L62 72 Z" fill="${SILVER}"/>`,
  weapon_dual: `<path d="M52 28 L54 72 L52 80 L50 72 Z M76 28 L78 72 L76 80 L74 72 Z" fill="${SILVER}"/>`,
  weapon_shield: `<path d="M64 28 L66 60 L64 72 L62 60 Z" fill="${SILVER}"/><path d="M48 48 L64 36 L80 48 V72 L64 88 L48 72 Z" fill="none" stroke="${AMBER}" stroke-width="2"/>`,
  weapon_greatsword: `<path d="M64 24 L68 76 L64 84 L60 76 Z" fill="${SILVER}" stroke="${AMBER}"/>`,
  weapon_spadone: `<path d="M64 20 L70 80 L64 92 L58 80 Z" fill="${SILVER}"/><path d="M56 80h16" stroke="${AMBER}" stroke-width="3"/>`,
  weapon_poleaxe: `<path d="M64 24v56" stroke="${SILVER}" stroke-width="4"/><path d="M48 36h32v8H48z" fill="${AMBER}"/>`,
  weapon_spear: `<path d="M64 24v64" stroke="${SILVER}" stroke-width="3"/><path d="M56 28h16v6H56z" fill="${AMBER}"/>`,
  weapon_spear_shield: `<path d="M64 28v56" stroke="${SILVER}" stroke-width="3"/><path d="M44 44h20v40H44z" fill="none" stroke="${AMBER}"/>`,
  curriculum: `<rect x="40" y="36" width="48" height="56" fill="${STONE}" stroke="${AMBER}"/><path d="M48 48h32M48 60h28M48 72h32M48 84h20" stroke="${SILVER}"/>`,
  marozzo: `<text x="64" y="58" text-anchor="middle" fill="${AMBER}" font-size="16" font-family="serif">M</text><rect x="40" y="36" width="48" height="56" fill="none" stroke="${AMBER}"/>`,
  events: `<rect x="36" y="40" width="56" height="40" rx="4" fill="${STONE}" stroke="${AMBER}"/><path d="M44 52h40M44 64h28" stroke="${SILVER}"/>`,
  mentor: `<circle cx="48" cy="52" r="10" fill="${STONE}" stroke="${SILVER}"/><circle cx="80" cy="52" r="10" fill="${STONE}" stroke="${SILVER}"/><path d="M48 62 Q64 78 80 62" stroke="${AMBER}" fill="none"/>`,
  tournament: `<path d="M56 36h16v20c0 8-16 8-16 0V36z" fill="${AMBER}"/><rect x="48" y="72" width="32" height="8" fill="${STONE}" stroke="${SILVER}"/><path d="M40 80h48" stroke="${AMBER}"/>`,
  masterclass: `<rect x="44" y="44" width="40" height="32" fill="${STONE}"/><circle cx="64" cy="36" r="8" fill="${AMBER}"/><path d="M52 56h24" stroke="${SILVER}"/>`,
  return: `<path d="M48 56 L64 40 L80 56" stroke="${AMBER}" fill="none" stroke-width="3"/><path d="M64 40v48" stroke="${SILVER}" stroke-width="3"/>`,
  years: `<text x="64" y="68" text-anchor="middle" fill="${AMBER}" font-size="28" font-family="serif">∞</text><circle cx="64" cy="64" r="32" fill="none" stroke="${MUTED}"/>`,
};

const QUEST_SYMBOL = {
  "path.profile": "scroll",
  "path.safety": "safety",
  "path.first_trial": "hall_door",
  "path.first_training": "salute",
  "path.first_record": "chronicle",
  "path.choose_weapon": "fork_paths",
  "path.monthly_roll": "die_d8",
  "path.open_inventory": "arsenal",
  "path.choose_cosmetic": "herald",
  "path.complete": "torch_path",
  "training.ready": "ready",
  "training.focus": "focus",
  "training.balance": "balance",
  "training.partner": "partner",
  "training.reflection": "reflection",
  "weekly.rhythm.2": "rhythm2",
  "weekly.rhythm.3": "rhythm3",
  "weekly.two_paths": "two_paths",
  "weekly.curriculum": "master_lesson",
  "weekly.history": "manuscript",
  "weekly.community": "community",
  "weekly.event_prep": "event_banner",
  "monthly.roll": "die_d8",
  "monthly.sessions.8": "calendar8",
  "monthly.new_path": "new_blade",
  "monthly.consistency": "chain",
  "monthly.event": "school_life",
  "season.eight_paths": "eight_paths",
};

const ACH_SYMBOL = {
  "start.first_salute": "salute",
  "start.safety": "safety",
  "start.character": "hero_enter",
  "start.inventory": "trophy",
  "start.quest": "medal",
  "start.event": "school_life",
  "practice.sessions": "medal",
  "practice.weeks": "rhythm2",
  "practice.years": "years",
  "practice.return": "return",
  "mastery.first_rank": "star_rank",
  "mastery.four_paths": "four_paths",
  "mastery.eight_paths": "eight_paths",
  "mastery.two_rank_five": "two_paths",
  "mastery.one_rank_ten": "weapon_master",
  "mastery.all_rank_ten": "master_sword",
  "mastery.spada_a_uno_mano.rank": "weapon_sword1",
  "mastery.due_spade.rank": "weapon_dual",
  "mastery.spada_e_scudo.rank": "weapon_shield",
  "mastery.spada_a_due_mani.rank": "weapon_greatsword",
  "mastery.spadone.rank": "weapon_spadone",
  "mastery.ascia_e_alabarda.rank": "weapon_poleaxe",
  "mastery.spiedo_e_partesana.rank": "weapon_spear",
  "mastery.spiedo_e_scudo.rank": "weapon_spear_shield",
  "curriculum.objectives": "curriculum",
  "curriculum.marozzo": "marozzo",
  "community.events": "events",
  "community.mentor": "mentor",
  "community.tournament": "tournament",
  "community.masterclass": "masterclass",
};

function medallion(symbolId) {
  const inner = SYMBOLS[symbolId] ?? SYMBOLS.medal;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img">
  <defs>
    <radialGradient id="v" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3a3632"/>
      <stop offset="100%" stop-color="${BG}"/>
    </radialGradient>
  </defs>
  <rect width="128" height="128" rx="64" fill="url(#v)"/>
  <circle cx="64" cy="64" r="58" fill="none" stroke="${AMBER}" stroke-width="2" opacity="0.85"/>
  <circle cx="64" cy="64" r="52" fill="${STONE}" opacity="0.6"/>
  ${inner}
</svg>`;
}

function writeIcons(map, dir) {
  mkdirSync(dir, { recursive: true });
  for (const [key, sym] of Object.entries(map)) {
    writeFileSync(join(dir, `${key}.svg`), medallion(sym));
  }
}

writeIcons(QUEST_SYMBOL, outQuests);
writeIcons(ACH_SYMBOL, outAch);
console.log(`Generated ${Object.keys(QUEST_SYMBOL).length} quest + ${Object.keys(ACH_SYMBOL).length} achievement icons`);
