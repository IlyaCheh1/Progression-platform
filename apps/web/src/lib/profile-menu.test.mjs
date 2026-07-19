import test from "node:test";
import assert from "node:assert/strict";

function isUsableNickname(value) {
  const trimmed = value?.trim();
  return Boolean(trimmed && !trimmed.includes("@"));
}

function profileDisplayName(profile, user) {
  if (isUsableNickname(profile?.username)) return profile.username.trim();
  if (isUsableNickname(user?.login)) return user.login.trim();
  return "Ученик";
}

function getRoleCabinetMenuItems(roles) {
  const order = ["administrator", "coach", "guardian", "renter", "student"];
  const normalized = roles.length ? roles : ["student"];
  const available = order.filter((role) => normalized.includes(role));
  const items = [];

  for (const role of available) {
    if (role === "student") continue;
    if (role === "administrator") items.push({ label: "Админка", href: "/admin" });
    if (role === "coach") items.push({ label: "Кабинет тренера", href: "/coach" });
    if (role === "guardian") items.push({ label: "Кабинет опекуна", href: "/guardian" });
    if (role === "renter") items.push({ label: "Кабинет арендатора", href: "/renter" });
  }

  if (normalized.includes("administrator") || normalized.includes("platform_admin")) {
    items.push({ label: "Studio", href: "/studio" });
  }

  return items;
}

function getSettingsTabs(roles) {
  const tabs = [
    { id: "personal" },
    { id: "security" },
    { id: "privacy" },
    { id: "notifications" },
  ];
  if (roles.includes("administrator") || roles.includes("platform_admin")) tabs.push({ id: "admin" });
  if (roles.includes("coach")) tabs.push({ id: "coach" });
  if (roles.includes("guardian")) tabs.push({ id: "guardian" });
  if (roles.includes("renter")) tabs.push({ id: "renter" });
  return tabs;
}

test("profileDisplayName prefers platform username over session display name", () => {
  assert.equal(
    profileDisplayName(
      { username: "Admin" },
      { name: "Platform Administrator", login: "admin@school.local" },
    ),
    "Admin",
  );
});

test("profileDisplayName never uses session display name", () => {
  assert.equal(
    profileDisplayName(null, { name: "Platform Administrator", login: "admin" }),
    "admin",
  );
});

test("getRoleCabinetMenuItems exposes non-student cabinets", () => {
  const items = getRoleCabinetMenuItems(["student", "coach", "administrator"]);
  const labels = items.map((item) => item.label);
  assert.deepEqual(labels, ["Админка", "Кабинет тренера", "Studio"]);
});

test("getSettingsTabs adds role-specific sections", () => {
  const tabs = getSettingsTabs(["student", "coach", "administrator"]);
  const ids = tabs.map((tab) => tab.id);
  assert.ok(ids.includes("personal"));
  assert.ok(ids.includes("admin"));
  assert.ok(ids.includes("coach"));
  assert.equal(ids.includes("guardian"), false);
});
