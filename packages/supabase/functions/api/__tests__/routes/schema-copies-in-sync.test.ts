/**
 * The Deno copies of the shared schemas must not drift from the package.
 *
 * `functions/_shared/*-schemas.ts` are hand-maintained copies of
 * `packages/scf-schemas/src/**`, and the edge runtime imports the *copies*.
 * So editing the package alone changes nothing at runtime.
 *
 * That is not hypothetical. Closing the applicant self-promotion hole in #530
 * — an applicant could PATCH their own application to `hired` — first landed
 * as an edit to the package copy only. Everything typechecked, and the exploit
 * still worked, because the edge function was reading the other file. It was
 * caught by re-running the exploit rather than by any test.
 *
 * ─── Why the copies still exist ───────────────────────────────────────────
 *
 * Deduplicating them is blocked, not merely unfinished. The API routes call
 * `.openapi()` on these schemas to build the OpenAPI document, and that method
 * is patched onto the zod bundled inside `@hono/zod-openapi` (npm). The
 * package's schemas are built with the zod that `api/deno.json` maps to
 * deno.land. Verified by probe: a schema imported straight from
 * `scf-schemas/src/applications/application.schema.ts` has
 * `typeof schema.openapi === "undefined"`, so the routes cannot consume it.
 *
 * Importing the package index is separately blocked — it pulls
 * `awesome-phonenumber` and friends, which are not in the edge import map.
 *
 * Until the zod instances are unified (#545), this test is the guard: the two
 * definitions must agree on their field names, so a change to one that is not
 * mirrored fails here rather than silently at runtime.
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import * as shared from "../../../_shared/application-schemas.ts";
import * as pkg from "../../../../../scf-schemas/src/applications/application.schema.ts";

/**
 * Field names of a schema, unwrapping `.refine()`.
 *
 * A refined schema is a ZodEffects with no `.shape` of its own, so comparing
 * naively reports every field as missing rather than reporting the real
 * difference.
 */
// deno-lint-ignore no-explicit-any
function fieldsOf(schema: any): string[] {
  let current = schema;
  while (current?._def?.schema) current = current._def.schema;
  return Object.keys(current?.shape ?? {}).sort();
}

/** Whether a schema carries `.refine()` validation on top of its fields. */
// deno-lint-ignore no-explicit-any
function isRefined(schema: any): boolean {
  return !!schema?._def?.schema;
}

/**
 * Schemas present in both files. `applicationFormDefaults` is package-only (a
 * form default, not a schema) and is deliberately not compared.
 */
const SHARED_SCHEMAS = [
  "applicationCreateSchema",
  "applicationUpdateSchema",
  "applicationStepUpdateSchema",
  "applicationSubmitSchema",
  "applicationFilterSchema",
  "screeningAnswersSchema",
  "customQuestionAnswerSchema",
  "attachmentMetadataSchema",
  "attachmentsSchema",
  "fileUploadSchema",
] as const;

for (const name of SHARED_SCHEMAS) {
  Deno.test(`${name} has the same fields in both copies`, () => {
    // deno-lint-ignore no-explicit-any
    const a = (shared as any)[name];
    // deno-lint-ignore no-explicit-any
    const b = (pkg as any)[name];

    assertEquals(
      typeof a,
      "object",
      `${name} is missing from functions/_shared/application-schemas.ts`,
    );
    assertEquals(
      typeof b,
      "object",
      `${name} is missing from packages/scf-schemas`,
    );

    assertEquals(
      fieldsOf(a),
      fieldsOf(b),
      `${name} has drifted between the Deno copy and the package. ` +
        `The edge runtime reads the _shared copy, so whichever you edited, ` +
        `mirror it in the other.`,
    );
  });

  Deno.test(`${name} is refined in both copies or neither`, () => {
    // deno-lint-ignore no-explicit-any
    const a = (shared as any)[name];
    // deno-lint-ignore no-explicit-any
    const b = (pkg as any)[name];

    assertEquals(
      isRefined(a),
      isRefined(b),
      `${name}: one copy has cross-field .refine() validation and the other ` +
        `does not, so the two disagree about what is valid even though their ` +
        `fields match.`,
    );
  });
}

Deno.test("neither copy of the applicant update schema accepts status", () => {
  // The specific regression. Belt-and-braces with
  // applicant-cannot-set-status.test.ts, which only covers the runtime copy.
  assertEquals(
    fieldsOf(shared.applicationUpdateSchema).includes("status"),
    false,
  );
  assertEquals(fieldsOf(pkg.applicationUpdateSchema).includes("status"), false);
});
