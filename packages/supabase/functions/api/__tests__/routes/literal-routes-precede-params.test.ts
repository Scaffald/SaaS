/**
 * A literal route declared *after* a sibling /{param} route of the same method
 * is unreachable — this router matches in declaration order, so the param route
 * swallows the path and the caller gets a validation error about a parameter
 * they never sent.
 *
 * That is not a hypothetical. GET /v1/work-logs/public-feed was written, mounted
 * and served, and every request to it came back:
 *
 *   {"issues":[{"validation":"uuid","path":["workLogId"]}]}
 *
 * because GET /{workLogId} was declared above it. Nothing about that response
 * says "your route is in the wrong place", which is why it is worth a test
 * rather than a comment.
 *
 * This reads the route files as text instead of booting the app: the failure is
 * a property of declaration order in the source, and a request-level test would
 * only reproduce the confusing symptom, not point at the cause.
 */
import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

const ROUTE_FILES = [
  "work-logs.ts",
  "reviews.ts",
  "skill-analytics.ts",
  "profiles.ts",
];

interface Declaration {
  method: string;
  path: string;
  line: number;
}

/** Pull every `method:`/`path:` pair out of a route file, in source order. */
function declarationsIn(source: string): Declaration[] {
  const lines = source.split("\n");
  const found: Declaration[] = [];

  for (let i = 0; i < lines.length; i++) {
    const method = lines[i].match(/^\s*method:\s*"(\w+)",\s*$/);
    if (!method) continue;
    // createRoute() always writes path immediately after method; scan a couple
    // of lines anyway so a stray comment between them does not hide a route.
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const path = lines[j].match(/^\s*path:\s*"([^"]+)",\s*$/);
      if (path) {
        found.push({ method: method[1], path: path[1], line: i + 1 });
        break;
      }
    }
  }

  return found;
}

/**
 * The param route that would shadow `path`, if one is declared earlier.
 *
 * Only same-method, same-segment-count routes can collide: GET /{workLogId}
 * shadows GET /public-feed, but PATCH /{workLogId} cannot, and neither can
 * GET /{workLogId}/photos.
 */
function shadowedBy(
  decl: Declaration,
  earlier: readonly Declaration[],
): Declaration | null {
  const segments = decl.path.split("/").filter(Boolean);
  if (segments.some((s) => s.startsWith("{"))) return null; // not a literal

  for (const other of earlier) {
    if (other.method !== decl.method) continue;
    const otherSegments = other.path.split("/").filter(Boolean);
    if (otherSegments.length !== segments.length) continue;

    const shadows = otherSegments.every((seg, idx) =>
      seg.startsWith("{") || seg === segments[idx]
    );
    if (shadows && otherSegments.some((s) => s.startsWith("{"))) return other;
  }

  return null;
}

for (const file of ROUTE_FILES) {
  Deno.test(`${file}: no literal route is shadowed by an earlier param route`, async () => {
    const source = await Deno.readTextFile(
      new URL(`../../routes/${file}`, import.meta.url),
    );
    const declarations = declarationsIn(source);

    const unreachable = declarations
      .map((decl, idx) => ({ decl, by: shadowedBy(decl, declarations.slice(0, idx)) }))
      .filter((entry) => entry.by !== null)
      .map((entry) =>
        `${entry.decl.method.toUpperCase()} ${entry.decl.path} (line ${entry.decl.line}) ` +
        `is unreachable — ${entry.by!.method.toUpperCase()} ${entry.by!.path} ` +
        `(line ${entry.by!.line}) matches it first. Move it above that route.`
      );

    assertEquals(unreachable, []);
  });
}

// Guard the guard: the detector has to actually fire, or the assertions above
// pass for the wrong reason.
Deno.test("the detector catches a literal declared after a param route", () => {
  const decls = declarationsIn(`
    method: "get",
    path: "/{workLogId}",
    method: "get",
    path: "/public-feed",
  `);

  assertEquals(decls.length, 2);
  assertEquals(shadowedBy(decls[1], [decls[0]])?.path, "/{workLogId}");
});

Deno.test("a different method does not shadow", () => {
  const decls = declarationsIn(`
    method: "patch",
    path: "/{workLogId}",
    method: "get",
    path: "/public-feed",
  `);

  assertEquals(shadowedBy(decls[1], [decls[0]]), null);
});

Deno.test("a different segment count does not shadow", () => {
  const decls = declarationsIn(`
    method: "get",
    path: "/{workLogId}/photos",
    method: "get",
    path: "/public-feed",
  `);

  assertEquals(shadowedBy(decls[1], [decls[0]]), null);
});
