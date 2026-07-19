import { SCHOOL_API } from "@/lib/utils";
import { authHeaders, type SessionUser } from "@/lib/session";
import { getCharacterById, type OgCharacterId } from "@/lib/characters";
import {
  getBackgroundById,
  normalizeBackgroundId,
  type BackgroundId,
  type ProfileBackground,
} from "@/lib/backgrounds";

export type InventoryKind = "character" | "background";

export type InventoryHolding = {
  key: string;
  kind: InventoryKind;
  refId: string;
};

export type InventoryView = {
  items: InventoryHolding[];
  equippedCharacterId: OgCharacterId;
  equippedBackgroundKey: BackgroundId;
};

export type InventoryCharacterItem = {
  holding: InventoryHolding;
  characterId: OgCharacterId;
  name: string;
  description: string;
  imageSrc: string;
  equipped: boolean;
};

export type InventoryBackgroundItem = {
  holding: InventoryHolding;
  background: ProfileBackground;
  equipped: boolean;
};

function normalizeInventory(data: Record<string, unknown>): InventoryView {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: InventoryHolding[] = rawItems
    .map((raw) => {
      const row = raw as Record<string, unknown>;
      const kind = row.kind === "background" ? "background" : "character";
      return {
        key: String(row.key ?? ""),
        kind: kind as InventoryKind,
        refId: String(row.refId ?? ""),
      };
    })
    .filter((item) => item.key && item.refId);

  return {
    items,
    equippedCharacterId: String(data.equippedCharacterId ?? "3") as OgCharacterId,
    equippedBackgroundKey: normalizeBackgroundId(String(data.equippedBackgroundKey ?? "")),
  };
}

export async function fetchMyInventory(session: SessionUser): Promise<InventoryView | null> {
  const res = await fetch(`${SCHOOL_API}/v1/inventory/me`, { headers: authHeaders(session) });
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  return normalizeInventory(data);
}

export async function equipInventoryItem(
  session: SessionUser,
  kind: InventoryKind,
  refId: string,
): Promise<InventoryView> {
  const res = await fetch(`${SCHOOL_API}/v1/inventory/equip`, {
    method: "PUT",
    headers: authHeaders(session),
    body: JSON.stringify({ kind, refId }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "equip_failed");
  }
  const data = (await res.json()) as Record<string, unknown>;
  return normalizeInventory(data);
}

export async function purchaseInventoryItem(
  session: SessionUser,
  kind: InventoryKind,
  refId: string,
): Promise<InventoryView> {
  const res = await fetch(`${SCHOOL_API}/v1/store/purchase`, {
    method: "POST",
    headers: authHeaders(session),
    body: JSON.stringify({ kind, refId }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "purchase_failed");
  }
  const data = (await res.json()) as Record<string, unknown>;
  return normalizeInventory(data);
}

export function inventoryCharacters(view: InventoryView): InventoryCharacterItem[] {
  return view.items
    .filter((item) => item.kind === "character")
    .map((holding) => {
      const character = getCharacterById(holding.refId);
      return {
        holding,
        characterId: (character?.id ?? holding.refId) as OgCharacterId,
        name: character?.name ?? `Персонаж ${holding.refId}`,
        description: character?.description ?? "",
        imageSrc: character?.thumbnailSrc ?? character?.avatarSrc ?? "",
        equipped: view.equippedCharacterId === holding.refId,
      };
    })
    .filter((item) => Boolean(item.imageSrc));
}

export function inventoryBackgrounds(view: InventoryView): InventoryBackgroundItem[] {
  return view.items
    .filter((item) => item.kind === "background")
    .map((holding) => {
      const background = getBackgroundById(holding.refId);
      if (!background) return null;
      return {
        holding,
        background,
        equipped: view.equippedBackgroundKey === holding.refId,
      };
    })
    .filter((item): item is InventoryBackgroundItem => item != null);
}
