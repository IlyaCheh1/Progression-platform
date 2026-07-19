"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppearancePickerModal from "@/components/appearance/appearance-picker-modal";
import AvatarCropModal from "@/components/appearance/avatar-crop-modal";
import SettingsProfileHeader from "@/components/settings/profile-header";
import NotificationsTab from "@/components/settings/tabs/notifications";
import PersonalInfoTab from "@/components/settings/tabs/personal-info";
import PrivacyTab from "@/components/settings/tabs/privacy";
import RolePanel, { RoleLink } from "@/components/settings/tabs/role-panel";
import SecurityTab from "@/components/settings/tabs/security";
import SideBar from "@/components/side-bar";
import { useAvatarPresentation } from "@/components/character-avatar";
import { useAppearanceInventory } from "@/hooks/use-appearance-inventory";
import { usePlayerProfile } from "@/hooks/use-player-profile";
import { AvatarUploadError, uploadAvatarToS3, validateAvatarFile } from "@/lib/avatar-upload";
import {
  messageForProfileError,
  saveMyProfile,
  writeCachedProfile,
} from "@/lib/profile-api";
import {
  formatRoleBadges,
  getRoleCabinetMenuItems,
  getSettingsTabs,
  profileDisplayName,
} from "@/lib/profile-menu";
import { routes } from "@/lib/routes";
import {
  loadNotificationsLocal,
  loadPersonalLocal,
  loadPrivacyLocal,
  saveNotificationsLocal,
  savePersonalLocal,
  savePrivacyLocal,
  type NotificationsLocal,
  type PersonalLocal,
  type PrivacyLocal,
} from "@/lib/settings-local";
import { hasRole, isAdminPrincipal } from "@/lib/rbac";
import { clearSession, loadSession, patchSession, type SessionUser } from "@/lib/session";
import type { GenderId } from "@/lib/avatars";

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const { profile, setProfile } = usePlayerProfile(session);
  const presentation = useAvatarPresentation(profile ?? undefined);
  const appearance = useAppearanceInventory(session, { onProfileUpdated: setProfile });
  const [backgroundPickerOpen, setBackgroundPickerOpen] = useState(false);
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null);
  const [avatarCropName, setAvatarCropName] = useState("avatar.jpg");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const tabs = useMemo(() => getSettingsTabs(session?.roles ?? ["student"]), [session?.roles]);
  const roleLinks = useMemo(() => getRoleCabinetMenuItems(session?.roles ?? []), [session?.roles]);

  const [tab, setTab] = useState("personal");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState<GenderId>("MALE");
  const [personal, setPersonal] = useState<PersonalLocal>(loadPersonalLocal);
  const [privacy, setPrivacy] = useState<PrivacyLocal>(loadPrivacyLocal);
  const [notifications, setNotifications] = useState<NotificationsLocal>(loadNotificationsLocal);
  const [errors, setErrors] = useState<Partial<Record<"username" | "firstName" | "lastName" | "phone" | "about", string>>>({});
  const [notifyEmailError, setNotifyEmailError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string>();

  useEffect(() => {
    const loaded = loadSession();
    if (!loaded) {
      router.replace("/login");
      return;
    }
    setSession(loaded);
    setPersonal(loadPersonalLocal());
    setPrivacy(loadPrivacyLocal());
    setNotifications(loadNotificationsLocal());

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("tab");
    if (fromUrl) setTab(fromUrl);
  }, [router]);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username);
    setGender(profile.gender);
  }, [profile]);

  useEffect(() => {
    if (!tabs.some((item) => item.id === tab)) {
      setTab(tabs[0]?.id ?? "personal");
    }
  }, [tabs, tab]);

  const persistPrivacy = useCallback((patch: Partial<PrivacyLocal>) => {
    setPrivacy((prev) => {
      const next = { ...prev, ...patch };
      savePrivacyLocal(next);
      return next;
    });
  }, []);

  const persistNotifications = useCallback((patch: Partial<NotificationsLocal>) => {
    setNotifications((prev) => {
      const next = { ...prev, ...patch };
      if (patch.contactEmail !== undefined) {
        const ok = !next.contactEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.contactEmail);
        setNotifyEmailError(ok ? undefined : "Некорректный email");
      }
      saveNotificationsLocal(next);
      return next;
    });
  }, []);

  function validatePersonal(): boolean {
    const next: typeof errors = {};
    if (username.trim().length < 3) next.username = "Минимум 3 символа";
    else if (!/^[a-zA-Z0-9_\-а-яА-ЯёЁ]+$/.test(username.trim())) {
      next.username = "Только буквы, цифры, _ и -";
    }
    if (personal.firstName && personal.firstName.trim().length < 2) {
      next.firstName = "Минимум 2 символа";
    }
    if (personal.lastName && personal.lastName.trim().length < 2) {
      next.lastName = "Минимум 2 символа";
    }
    if (personal.phone && !/^\+?\d{7,15}$/.test(personal.phone.replace(/[\s()-]/g, ""))) {
      next.phone = "Формат: +79001234567";
    }
    if (personal.about.length > 300) next.about = "Максимум 300 символов";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function savePersonal() {
    if (!session || !profile) {
      throw new Error("profile_not_ready");
    }
    if (!validatePersonal()) {
      throw new Error("validation");
    }
    setSubmitting(true);
    try {
      savePersonalLocal(personal);
      const saved = await saveMyProfile(session, {
        username: username.trim(),
        selectedSkinId: profile.selectedSkinId,
        gender,
        backgroundKey: profile.backgroundKey,
        avatarUrl: profile.avatarUrl ?? "",
        profileComplete: true,
      });
      writeCachedProfile(saved);
      setProfile(saved);
      patchSession({ name: saved.username, profileComplete: saved.profileComplete });
      setSession((prev) => (prev ? { ...prev, name: saved.username, profileComplete: saved.profileComplete } : prev));
    } catch (error) {
      if (error instanceof Error && (error.message === "validation" || error.message === "profile_not_ready")) {
        throw error;
      }
      setErrors((prev) => ({ ...prev, username: messageForProfileError(error) }));
      throw error;
    } finally {
      setSubmitting(false);
    }
  }

  const clearAvatarCrop = useCallback(() => {
    setAvatarCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setAvatarCropName("avatar.jpg");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }, []);

  useEffect(() => () => {
    if (avatarCropSrc) URL.revokeObjectURL(avatarCropSrc);
  }, [avatarCropSrc]);

  function handleAvatarFile(file: File | undefined) {
    if (!file || !session || !profile) return;
    setAvatarError(undefined);
    try {
      validateAvatarFile(file);
    } catch (error) {
      setAvatarError(error instanceof AvatarUploadError ? error.message : messageForProfileError(error));
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }
    setAvatarCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setAvatarCropName(file.name || "avatar.jpg");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleAvatarCropConfirm(file: File) {
    if (!session || !profile) return;
    setAvatarBusy(true);
    setAvatarError(undefined);
    try {
      const saved = await uploadAvatarToS3(session, file);
      setProfile(saved);
      clearAvatarCrop();
    } catch (error) {
      const message =
        error instanceof AvatarUploadError ? error.message : messageForProfileError(error);
      setAvatarError(message);
      throw new AvatarUploadError(message);
    } finally {
      setAvatarBusy(false);
    }
  }

  if (!session) {
    return <main className="grid min-h-[50vh] place-items-center text-mos-muted">Загрузка…</main>;
  }

  const displayName = profileDisplayName(profile, session);

  async function handleSelectBackground(backgroundId: string) {
    const ok = await appearance.equipBackground(backgroundId);
    if (ok) setBackgroundPickerOpen(false);
  }

  return (
    <div className="relative flex min-h-[calc(100vh-72px)] flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/media/ui/settings-background.webp)" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/55" />

      <main className="relative z-10 mx-auto mb-20 mt-3 flex w-full max-w-[840px] flex-col items-center gap-3 px-3 md:mt-11 md:mb-40 md:gap-6 md:px-4">
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => void handleAvatarFile(event.target.files?.[0])}
        />

        <SettingsProfileHeader
          username={displayName}
          rolesLabel={formatRoleBadges(session.roles)}
          level={profile?.level ?? 1}
          currentXp={profile?.xp ?? 0}
          xpToNext={profile?.xpToNextLevel ?? 500}
          selectedSkinId={presentation.selectedSkinId}
          gender={presentation.gender}
          avatarUrl={profile?.avatarUrl}
          backgroundSrc={presentation.backgroundSrc}
          avatarBusy={avatarBusy}
          onEditAvatar={() => avatarInputRef.current?.click()}
          onEditBackground={() => setBackgroundPickerOpen(true)}
        />
        {avatarError ? <p className="w-full text-center text-sm text-red-400">{avatarError}</p> : null}

        <div className="flex w-full flex-col items-start gap-3 md:flex-row md:gap-6">
          <div className="flex w-full flex-col gap-6 md:w-auto md:gap-12">
            <SideBar
              items={tabs}
              activeId={tab}
              onChange={setTab}
              syncUrlParam="tab"
              footer={
                <button
                  type="button"
                  className="og-btn og-btn-secondary og-btn-sm w-full uppercase"
                  onClick={() => {
                    clearSession();
                    router.push("/");
                  }}
                >
                  Выйти
                </button>
              }
            />
          </div>

          <section className="bg-secondaryBg flex min-h-[320px] w-full flex-col gap-3 rounded-2xl p-4 backdrop-blur-[20px] md:gap-6 md:rounded-[32px] md:p-8">
            {tab === "personal" ? (
              <PersonalInfoTab
                username={username}
                email={session.login.includes("@") ? session.login : `${session.login}@demo.local`}
                gender={gender}
                local={personal}
                onUsernameChange={setUsername}
                onGenderChange={setGender}
                onLocalChange={(patch) => setPersonal((prev) => ({ ...prev, ...patch }))}
                onSubmit={savePersonal}
                isSubmitting={submitting}
                errors={errors}
              />
            ) : null}

            {tab === "security" ? (
              <SecurityTab
                email={session.login.includes("@") ? session.login : `${session.login}@demo.local`}
              />
            ) : null}

            {tab === "privacy" ? <PrivacyTab value={privacy} onChange={persistPrivacy} /> : null}

            {tab === "notifications" ? (
              <NotificationsTab
                value={notifications}
                onChange={persistNotifications}
                emailError={notifyEmailError}
              />
            ) : null}

            {tab === "admin" && isAdminPrincipal(session.roles) ? (
              <RolePanel title="Администрирование">
                <p>Управление платформой, пользователями и контентом школы.</p>
                <RoleLink href={routes.admin}>Войти в админ-панель</RoleLink>
                <div className="mt-4 flex flex-wrap gap-2">
                  {roleLinks
                    .filter((item) => item.href !== routes.admin)
                    .map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="inline-flex rounded-xl border border-mos-line/40 px-3 py-2 text-mos-text hover:border-mos-amber"
                      >
                        {item.label}
                      </Link>
                    ))}
                </div>
              </RolePanel>
            ) : null}

            {tab === "coach" && hasRole(session.roles, "coach") ? (
              <RolePanel title="Кабинет тренера">
                <p>Расписание, группы и подтверждение посещаемости.</p>
                <RoleLink href={routes.coach}>Открыть кабинет тренера</RoleLink>
              </RolePanel>
            ) : null}

            {tab === "guardian" && hasRole(session.roles, "guardian") ? (
              <RolePanel title="Кабинет опекуна">
                <p>Прогресс подопечных и уведомления школы.</p>
                <RoleLink href={routes.guardian}>Открыть кабинет опекуна</RoleLink>
              </RolePanel>
            ) : null}

            {tab === "renter" && hasRole(session.roles, "renter") ? (
              <RolePanel title="Кабинет арендатора">
                <p>Бронирование залов и управление арендой.</p>
                <RoleLink href={routes.renter}>Открыть кабинет арендатора</RoleLink>
              </RolePanel>
            ) : null}
          </section>
        </div>

        <AppearancePickerModal
          open={backgroundPickerOpen}
          mode="background"
          title="Выберите фон профиля"
          characters={appearance.characters}
          backgrounds={appearance.backgrounds}
          equippingId={appearance.equippingId}
          loading={appearance.loading}
          error={appearance.error}
          onClose={() => setBackgroundPickerOpen(false)}
          onSelectCharacter={() => undefined}
          onSelectBackground={(backgroundId) => void handleSelectBackground(backgroundId)}
        />

        <AvatarCropModal
          open={Boolean(avatarCropSrc)}
          imageSrc={avatarCropSrc}
          filename={avatarCropName}
          busy={avatarBusy}
          onCancel={clearAvatarCrop}
          onConfirm={handleAvatarCropConfirm}
        />
      </main>
    </div>
  );
}
