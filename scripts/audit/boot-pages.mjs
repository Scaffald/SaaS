/**
 * Does the exported web build actually boot, on every public page?
 *
 * The hydration audit (hydration-pages.mjs) only greps for React's hydration
 * messages. A build can pass it and still render nothing: with route
 * splitting enabled the SSR HTML emitted every chunk `async`, the entry chunk
 * won a race against the shared chunk it requires, and every page died with
 * `Requiring unknown module "1313"` before hydration ever started (#797).
 * That failure is size-dependent — a smaller shared chunk could let the race
 * resolve the other way — so it needs checking on each build, not once.
 *
 * Per page and device this asserts: no page error, no `Requiring unknown
 * module`, no minified React error, and real text inside `#root`. Then it
 * navigates home → /jobs client-side and confirms the document survived (no
 * full reload) — the route chunk for a split page loaded lazily.
 *
 * Usage:
 *   node scripts/audit/boot-pages.mjs [baseUrl] [path ...]
 *   node scripts/audit/boot-pages.mjs http://localhost:8093 / /jobs /privacy
 *
 * Exit code is the number of failing checks.
 */
import { chromium } from "playwright";

const [, , baseArg, ...pathArgs] = process.argv;
const base = baseArg || "http://localhost:8081";
const pages = pathArgs.length
  ? pathArgs
  : ["/", "/jobs", "/privacy", "/terms", "/contact", "/support"];

const FATAL =
  /Requiring unknown module|Minified React error|Hydration failed|did not match/i;

const devices = {
  "phone 390": {
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1",
  },
  "desktop 1440": { viewport: { width: 1440, height: 900 } },
};

const browser = await chromium.launch();
let failures = 0;
const report = (ok, label, detail) => {
  if (!ok) failures++;
  console.log(`  ${ok ? "✓" : "✗"} ${label.padEnd(28)} ${detail}`);
};

for (const [device, opts] of Object.entries(devices)) {
  const context = await browser.newContext(opts);
  console.log(device);
  for (const path of pages) {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error" && FATAL.test(m.text())) errors.push(m.text());
    });
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const text = (await page.locator("#root").innerText()).trim().length;
    const ok = text > 50 && errors.length === 0;
    report(
      ok,
      path,
      `text=${text} errors=${errors.length}${
        errors.length ? ` :: ${errors[0].slice(0, 140)}` : ""
      }`
    );
    await page.close();
  }

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__bootAuditMarker = true;
  });
  const link = page.locator('a[href="/jobs"]').first();
  if (await link.count()) {
    await link.click();
    await page.waitForURL("**/jobs", { timeout: 15000 });
    await page.waitForTimeout(1000);
    const sameDocument = await page.evaluate(
      () => window.__bootAuditMarker === true
    );
    const text = (await page.locator("#root").innerText()).trim().length;
    report(
      sameDocument && text > 50 && errors.length === 0,
      "client nav / → /jobs",
      `sameDocument=${sameDocument} text=${text} errors=${errors.length}${
        errors.length ? ` :: ${errors[0].slice(0, 140)}` : ""
      }`
    );
  } else {
    // The phone header collapses its links into a menu; the desktop pass
    // covers the lazy route-chunk load, so this is a skip, not a failure.
    console.log(
      '  – client nav / → /jobs         skipped: no <a href="/jobs"> at this width'
    );
  }
  await page.close();
  await context.close();
}

await browser.close();
console.log(failures ? `\n${failures} failing check(s)` : "\nevery page boots");
process.exit(failures);
