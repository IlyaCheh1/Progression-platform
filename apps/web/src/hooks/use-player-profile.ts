"use client";

import { useEffect, useState } from "react";
import {
  fetchMyProfile,
  migrateLocalProfileToBackend,
  readCachedProfile,
  type PlayerProfile,
} from "@/lib/profile-api";
import { patchSession, type SessionUser } from "@/lib/session";

export function usePlayerProfile(user: SessionUser | null) {
  const [profile, setProfile] = useState<PlayerProfile | null>(() => readCachedProfile());
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      const activeUser = user;
      if (!activeUser) {
        setLoading(false);
        return;
      }
      try {
        await migrateLocalProfileToBackend(activeUser);
        const remote = await fetchMyProfile(activeUser);
        if (cancelled) return;
        if (remote) {
          setProfile(remote);
          patchSession({ profileComplete: remote.profileComplete });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function refresh() {
    if (!user) return null;
    const remote = await fetchMyProfile(user);
    if (remote) {
      setProfile(remote);
      patchSession({ profileComplete: remote.profileComplete });
    }
    return remote;
  }

  return {
    profile,
    loading,
    profileReady: Boolean(profile?.profileComplete),
    refresh,
    setProfile,
  };
}
