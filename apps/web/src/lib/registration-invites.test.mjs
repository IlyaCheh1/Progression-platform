import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it, beforeEach } from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildIssuedRegistrationLink,
  clearRegistrationInvites,
  consumeRegistrationInvite,
  createRegistrationInvite,
  inviteAcceptsOnlyIdEmail,
  lookupRegistrationInvite,
  ONLYID_ERROR_MESSAGES,
  parseInviteDraft,
  readRegistrationInvite,
  registrationDelivery,
  schoolUsersReadAccess,
} from "./auth/registration-invites.ts";

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

describe("registration invites", () => {
  beforeEach(() => {
    clearRegistrationInvites();
  });

  it("returns a copyable link and never claims mail was sent", () => {
    const parsed = parseInviteDraft({ displayName: "Анна Смит", login: "anna@mastersword.ru" });
    assert.equal(parsed.ok, true);
    const invite = createRegistrationInvite(parsed.value, 1_700_000_000_000);
    const issued = buildIssuedRegistrationLink("http://localhost:3000/", invite);
    assert.equal(issued.mailed, false);
    assert.equal(registrationDelivery().mailed, false);
    assert.equal(issued.url, `http://localhost:3000/register/${invite.token}`);
    assert.equal(issued.displayName, "Анна Смит");
    assert.equal(readRegistrationInvite(invite.token, invite.createdAt)?.login, "anna@mastersword.ru");
  });

  it("accepts a link once and hides it after use or expiry", () => {
    const invite = createRegistrationInvite({ displayName: "Иван Петров", login: "ivan" }, 1000);
    assert.equal(lookupRegistrationInvite(invite.token, 1000).status, "active");
    assert.ok(consumeRegistrationInvite(invite.token, 1000));
    assert.equal(readRegistrationInvite(invite.token, 1000), null);
    assert.equal(lookupRegistrationInvite(invite.token, 1000).status, "used");
    assert.equal(consumeRegistrationInvite(invite.token, 1000), null);

    const fresh = createRegistrationInvite({ displayName: "Иван Петров", login: "ivan" }, 1000);
    assert.equal(lookupRegistrationInvite(fresh.token, fresh.expiresAt).status, "expired");
  });

  it("rejects a blank account and matches an email login to OnlyID", () => {
    assert.equal(parseInviteDraft({ displayName: "А", login: "a" }).ok, false);
    assert.equal(parseInviteDraft({ displayName: "Анна", login: "bad login" }).ok, false);
    assert.equal(inviteAcceptsOnlyIdEmail("Anna@Mastersword.ru", "anna@mastersword.ru"), true);
    assert.equal(inviteAcceptsOnlyIdEmail("anna@mastersword.ru", "other@mastersword.ru"), false);
    assert.equal(inviteAcceptsOnlyIdEmail("anna", "other@mastersword.ru"), true);
  });

  it("asks school-api for the users permission before a link can be minted", async () => {
    const calls = [];
    const ok = await schoolUsersReadAccess("Bearer school-token", async (url, init) => {
      calls.push({ url, authorization: init.headers.Authorization });
      return { ok: true, status: 200 };
    });
    assert.equal(ok, "ok");
    assert.match(calls[0].url, /\/v1\/admin\/students$/);
    assert.equal(calls[0].authorization, "Bearer school-token");
    assert.equal(await schoolUsersReadAccess(null, async () => ({ ok: true, status: 200 })), "forbidden");
    assert.equal(
      await schoolUsersReadAccess("Bearer x", async () => ({ ok: false, status: 403 })),
      "forbidden",
    );
    assert.equal(
      await schoolUsersReadAccess("Bearer x", async () => {
        throw new Error("down");
      }),
      "unavailable",
    );
  });

  it("keeps cabinet login and admin registration on different OnlyID screens", () => {
    const login = read("../app/login/page.tsx");
    const cabinet = read("../screens/auth/cabinet-login.tsx");
    const registerPage = read("../app/register/[token]/page.tsx");
    const registerScreen = read("../screens/auth/registration-screen.tsx");
    const admin = read("../app/admin/users/page.tsx");
    const loginRoute = read("../app/api/auth/login/route.ts");
    const adminRoute = read("../app/api/admin/registration-links/route.ts");
    const css = read("../screens/auth/auth-pages.css");

    assert.match(login, /CabinetLogin/);
    assert.match(cabinet, /Личный кабинет/);
    assert.match(cabinet, /href=\{onlyIdHref\}/);
    assert.match(cabinet, /\/api\/auth\/login/);
    assert.doesNotMatch(cabinet, /Регистрация/);
    assert.doesNotMatch(cabinet, /invite=/);
    assert.doesNotMatch(cabinet, /\/v1\/auth\/login/);
    assert.doesNotMatch(cabinet, /или логин школы/);

    assert.match(registerPage, /RegistrationScreen/);
    assert.match(registerScreen, /Регистрация/);
    assert.match(registerScreen, /\/api\/auth\/login\?invite=/);
    assert.match(registerScreen, /href="\/login"/);
    assert.doesNotMatch(registerScreen, /\/v1\/auth\/login/);
    assert.doesNotMatch(registerScreen, /Личный кабинет<\/h1>/);

    assert.match(admin, /\/api\/admin\/registration-links/);
    assert.match(admin, /Скопируйте ссылку/);
    const invites = read("../lib/auth/registration-invites.ts");
    assert.match(invites, /mailed: false/);
    assert.match(invites, /__mosRegistrationInvites/);
    assert.match(adminRoute, /schoolUsersReadAccess/);
    assert.match(adminRoute, /buildIssuedRegistrationLink/);
    assert.doesNotMatch(adminRoute, /smtp|nodemailer|SendMail/i);
    assert.match(loginRoute, /SSO_PATHS/);
    assert.doesNotMatch(loginRoute, /accounts\.google|oauth\.yandex|github\.com\/login/);
    assert.equal(ONLYID_ERROR_MESSAGES.sso_not_configured.includes("OnlyID"), true);
    assert.match(css, /border-radius:\s*1\.35rem/);
  });
});
