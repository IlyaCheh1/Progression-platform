"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MosTalent, MosTalentTree } from "@/lib/talents-catalog";
import {
  activateTalentInState,
  applyStateToTrees,
  favoriteTalentsFromTrees,
  learnTalentInState,
  loadTalentsState,
  saveTalentsState,
  toggleFavoriteInState,
  type TalentsPersisted,
} from "@/lib/talents-state";

export function useTalents() {
  const [state, setState] = useState<TalentsPersisted>(() =>
    typeof window !== "undefined" ? loadTalentsState() : { points: 8, learned: {}, activated: [], favorites: [], cooldowns: {} },
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState({ favorite: false, activate: false, learn: false });

  useEffect(() => {
    setState(loadTalentsState());
  }, []);

  const trees = useMemo(() => applyStateToTrees(state), [state]);
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
