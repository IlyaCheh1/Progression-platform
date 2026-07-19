"use client";

import { useEffect, useState } from "react";
import {
  fetchMyProfile,
  migrateLocalProfileToBackend,
  PROFILE_CHANGED_EVENT,
  readCachedProfile,
  type PlayerProfile,
} from "@/lib/profile-api";
import { patchSession, type SessionUser } from "@/lib/session";

export function usePlayerProfile(user: SessionUser | null) {
  const [profile, setProfile] = useState<PlayerProfile | null>(() => readCachedProfile());
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user?.studentId || !user.accessToken) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const activeUser = user;

    async function load() {
      setLoading(true);
      try {
        await migrateLocalProfileToBackend(activeUser);
        const remote = await fetchMyProfile(activeUser);
        if (cancelled) return;
        if (remote) {
          setProfile(remote);
          patchSession({
            profileComplete: remote.profileComplete,
            name: remote.username || activeUser.name,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // Intentionally keyed by identity fields so session name patches do not refetch.
  }, [user?.studentId, user?.accessToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function syncFromCache() {
      const cached = readCachedProfile();
      if (cached) setProfile(cached);
    }

    window.addEventListener(PROFILE_CHANGED_EVENT, syncFromCache);
    return () => window.removeEventListener(PROFILE_CHANGED_EVENT, syncFromCache);
  }, []);

  async function refresh() {
    if (!user) return null;
    const remote = await fetchMyProfile(user);
    if (remote) {
      setProfile(remote);
      patchSession({
        profileComplete: remote.profileComplete,
        name: remote.username || user.name,
      });
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
