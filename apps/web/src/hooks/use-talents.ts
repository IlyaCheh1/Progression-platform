"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildTalentTreesFromCatalog,
  type ContentTalent,
  type MosTalent,
  type MosTalentTree,
  type TalentCatalogResponse,
} from "@/lib/talents-catalog";
import { content } from "@/lib/content";
import {
  activateTalentInState,
  applyStateToTrees,
  favoriteTalentsFromTrees,
  learnTalentInState,
  loadTalentsState,
  mergeUnlockedKeys,
  saveTalentsState,
  toggleFavoriteInState,
  type TalentsPersisted,
} from "@/lib/talents-state";
import { fetchTalentCatalog, fetchUnlockedTalents, unlockTalent } from "@/lib/school-api";
import { loadSession } from "@/lib/session";

function fallbackCatalog(): TalentCatalogResponse {
  return {
    trees: (content.talentTrees ?? []) as TalentCatalogResponse["trees"],
    talents: content.talents as unknown as ContentTalent[],
  };
}

export type TalentsController = ReturnType<typeof useTalentsState>;

export function useTalentsState() {
  const [catalogTrees, setCatalogTrees] = useState<MosTalentTree[]>(() =>
    buildTalentTreesFromCatalog(fallbackCatalog()),
  );
  const [state, setState] = useState<TalentsPersisted>(() =>
    typeof window !== "undefined" ? loadTalentsState() : { points: 8, learned: {}, activated: [], favorites: [], cooldowns: {} },
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState({ favorite: false, activate: false, learn: false, catalog: true });

  useEffect(() => {
    setState(loadTalentsState());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchTalentCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setCatalogTrees(buildTalentTreesFromCatalog(catalog));
      })
      .catch(() => {
        if (cancelled) return;
        setCatalogTrees(buildTalentTreesFromCatalog(fallbackCatalog()));
      })
      .finally(() => {
        if (!cancelled) setLoading((l) => ({ ...l, catalog: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const user = loadSession();
    if (!user) return;
    let cancelled = false;
    fetchUnlockedTalents(user)
      .then((keys) => {
        if (cancelled) return;
        setState((prev) => {
          const next = mergeUnlockedKeys(prev, keys);
          saveTalentsState(next);
          return next;
        });
      })
      .catch(() => {
        /* локальное состояние остаётся источником при недоступном API */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const trees = useMemo(() => applyStateToTrees(catalogTrees, state), [catalogTrees, state]);
  const favoriteSkills = useMemo(
    () => favoriteTalentsFromTrees(trees, state.favorites),
    [trees, state.favorites],
  );

  const commit = useCallback((next: TalentsPersisted) => {
    setState(next);
    saveTalentsState(next);
  }, []);

  const onLearn = useCallback(
    async (talent: MosTalent) => {
      setLoading((l) => ({ ...l, learn: true }));
      setError(null);
      const result = learnTalentInState(state, talent);
      if ("error" in result) {
        setError(result.error);
        setLoading((l) => ({ ...l, learn: false }));
        return;
      }
      const user = loadSession();
      if (user) {
        try {
          await unlockTalent(user, talent.id);
        } catch {
          setError("Не удалось сохранить талант на сервере");
          setLoading((l) => ({ ...l, learn: false }));
          return;
        }
      }
      commit(result);
      setLoading((l) => ({ ...l, learn: false }));
    },
    [state, commit],
  );

  const handleActivate = useCallback(
    async (talent: MosTalent) => {
      setLoading((l) => ({ ...l, activate: true }));
      setError(null);
      const result = activateTalentInState(state, talent);
      if ("error" in result) {
        setError(result.error);
        setLoading((l) => ({ ...l, activate: false }));
        return;
      }
      commit(result);
      setLoading((l) => ({ ...l, activate: false }));
    },
    [state, commit],
  );

  const handleFavourite = useCallback(
    async (talent: MosTalent) => {
      setLoading((l) => ({ ...l, favorite: true }));
      setError(null);
      const result = toggleFavoriteInState(state, talent.id);
      if ("error" in result) {
        setError(result.error);
        setLoading((l) => ({ ...l, favorite: false }));
        return;
      }
      commit(result);
      setLoading((l) => ({ ...l, favorite: false }));
    },
    [state, commit],
  );

  return {
    trees: trees as MosTalentTree[],
    points: state.points,
    favoriteSkills,
    loading,
    error,
    onLearn,
    handleActivate,
    handleFavourite,
    clearError: () => setError(null),
  };
}
