import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isSafeReturnPath,
  resolvePostLoginPath,
  resolveSsoApiBase,
  resolveSsoIssuer,
  ssoEndpoint,
  SSO_PATHS,
} from "./paths.ts";

describe("isSafeReturnPath", () => {
  it("allows normal app paths", () => {
    assert.equal(isSafeReturnPath("/"), true);
    assert.equal(isSafeReturnPath("/cabinet"), true);
    assert.equal(isSafeReturnPath("/settings?tab=personal"), true);
    assert.equal(isSafeReturnPath("/profile"), true);
  });

  it("blocks open redirects", () => {
    assert.equal(isSafeReturnPath("//evil.com"), false);
    assert.equal(isSafeReturnPath("/\\evil.com"), false);
    assert.equal(isSafeReturnPath("https://evil.com"), false);
    assert.equal(isSafeReturnPath("/foo@evil.com"), false);
  });
});

describe("resolvePostLoginPath", () => {
  it("sends marketing landing and callback to profile", () => {
    assert.equal(resolvePostLoginPath("/"), "/profile");
    assert.equal(resolvePostLoginPath("/auth/callback"), "/profile");
    assert.equal(resolvePostLoginPath(null), "/profile");
    assert.equal(resolvePostLoginPath("//evil.com"), "/profile");
  });

  it("keeps safe cabinet paths", () => {
    assert.equal(resolvePostLoginPath("/coach"), "/coach");
    assert.equal(resolvePostLoginPath("/settings?tab=personal"), "/settings?tab=personal");
  });
});

describe("resolveSsoApiBase", () => {
  it("maps public onlyid.ru to the API host from OIDC discovery", () => {
    assert.equal(resolveSsoApiBase({ ssoBaseUrl: "https://onlyid.ru" }), "https://api.onlyid.ru");
    assert.equal(resolveSsoApiBase({ ssoBaseUrl: "https://www.onlyid.ru/" }), "https://api.onlyid.ru");
  });

  it("keeps an explicit API base", () => {
    assert.equal(
      resolveSsoApiBase({ ssoBaseUrl: "https://api.onlyid.ru" }),
      "https://api.onlyid.ru",
    );
  });

  it("falls back to issuer origin when base is empty", () => {
    assert.equal(
      resolveSsoApiBase({ ssoIssuer: "https://api.onlyid.ru/api/v1/user" }),
      "https://api.onlyid.ru",
    );
  });

  it("builds token/userinfo/logout/jwks on the API origin", () => {
    const env = { ssoBaseUrl: "https://onlyid.ru", ssoIssuer: "https://api.onlyid.ru/api/v1/user" };
    assert.equal(ssoEndpoint(SSO_PATHS.authorize, env), "https://api.onlyid.ru/api/v1/user/oauth/authorize");
    assert.equal(ssoEndpoint(SSO_PATHS.token, env), "https://api.onlyid.ru/api/v1/user/oauth/token");
    assert.equal(ssoEndpoint(SSO_PATHS.userinfo, env), "https://api.onlyid.ru/api/v1/user/oauth/userinfo");
    assert.equal(ssoEndpoint(SSO_PATHS.logout, env), "https://api.onlyid.ru/api/v1/user/oauth/logout");
    assert.equal(ssoEndpoint(SSO_PATHS.jwks, env), "https://api.onlyid.ru/api/v1/user/.well-known/jwks.json");
    assert.equal(resolveSsoIssuer(env), "https://api.onlyid.ru/api/v1/user");
  });
});
