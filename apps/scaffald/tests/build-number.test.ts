import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import appPackage from "../package.json";

/**
 * The native build number, and the pin that froze it.
 *
 * `APP_IOS_BUILD_NUMBER` was pinned in eas.json's production profile to respin
 * 1.12.0 as 11201. It then stayed pinned, so three more releases shipped as
 * 11201 as well (#513):
 *
 *   1.12.0  shipped 11201  derived 11200   <- the respin the pin was added for
 *   1.14.0  shipped 11201  derived 11400   <- frozen
 *   1.15.0  shipped 11201  derived 11500   <- frozen
 *   1.16.0  shipped 11201  derived 11600   <- frozen
 *
 * Apple scopes build-number uniqueness to the version string, so those did not
 * collide at submission. What they did was make a TestFlight build unmappable
 * back to a release, which is the thing RELEASE-PROCESS.md's one-tag-one-build
 * rule exists to guarantee.
 *
 * These tests import app.config.ts itself rather than re-implementing the
 * derivation, so the rule cannot drift from the file that decides it. (The
 * derivation has to stay inline in app.config.ts — Expo transpiles that file to
 * a single app.config.js and cannot resolve a relative import out of it.)
 */

const EAS_JSON = path.join(__dirname, "..", "eas.json");

const loadConfig = async () => {
  vi.resetModules();
  const mod = await import("../app.config");
  return (mod.default as { expo: Record<string, any> }).expo;
};

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  delete process.env.APP_IOS_BUILD_NUMBER;
  delete process.env.APP_ANDROID_VERSION_CODE;
  delete process.env.APP_VERSION;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("native build number", () => {
  it("derives from the app version when nothing overrides it", async () => {
    const expo = await loadConfig();
    const [major, minor, patch] = appPackage.version.split(".").map(Number);
    const expected = major * 10_000 + minor * 100 + patch;

    expect(expo.ios.buildNumber).toBe(String(expected));
    expect(expo.android.versionCode).toBe(expected);
  });

  it("moves when the version moves", async () => {
    process.env.APP_VERSION = "1.18.3";
    const expo = await loadConfig();

    expect(expo.ios.buildNumber).toBe("11803");
    expect(expo.android.versionCode).toBe(11803);
  });

  it("is strictly greater than every build number already shipped", async () => {
    // The highest CFBundleVersion on EAS at the time of the fix. iOS rejects a
    // build number that does not increase within a version train, and going
    // backwards is the one way this change could break a submission.
    const HIGHEST_SHIPPED = 11203;
    const expo = await loadConfig();

    expect(Number(expo.ios.buildNumber)).toBeGreaterThan(HIGHEST_SHIPPED);
  });

  it("refuses a version the scheme cannot encode", async () => {
    // Two digits each for minor and patch: 1.100.0 and 2.0.0 would both give
    // 20000. Failing the build beats emitting a duplicate that is only caught
    // at submission, after the build has been paid for.
    process.env.APP_VERSION = "1.100.0";

    await expect(loadConfig()).rejects.toThrow(/cannot be encoded as a build number/);
  });
});

describe("the respin override", () => {
  it("still wins when explicitly set", async () => {
    process.env.APP_IOS_BUILD_NUMBER = "11701";
    const expo = await loadConfig();

    expect(expo.ios.buildNumber).toBe("11701");
  });

  it("is not pinned by any eas.json profile", async () => {
    // The #513 regression itself. An override that lives in a build profile is
    // not an override — it applies to every release after it, silently, and
    // nothing fails until someone reads the build list.
    const easJson = JSON.parse(readFileSync(EAS_JSON, "utf8"));
    const offenders = Object.entries(easJson.build ?? {})
      .filter(([, profile]: [string, any]) => profile?.env?.APP_IOS_BUILD_NUMBER != null)
      .map(([name]) => name);

    expect(offenders).toEqual([]);
  });

  it("is not pinned for Android either", async () => {
    const easJson = JSON.parse(readFileSync(EAS_JSON, "utf8"));
    const offenders = Object.entries(easJson.build ?? {})
      .filter(([, profile]: [string, any]) => profile?.env?.APP_ANDROID_VERSION_CODE != null)
      .map(([name]) => name);

    expect(offenders).toEqual([]);
  });
});
