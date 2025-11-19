import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.218.0/assert/mod.ts";

// @ts-ignore - Deno requires file extension
import { extractTextFromPdf } from "../../_shared/pdf/extract-text.ts";

const fixturesBaseUrl = new URL("./fixtures/pdf/", import.meta.url);

async function loadFixture(name: string): Promise<Uint8Array> {
  const url = new URL(name, fixturesBaseUrl);
  return await Deno.readFile(url);
}

Deno.test("extractTextFromPdf returns structured text for standard PDFs", async () => {
  const bytes = await loadFixture("standard-text.pdf");
  const result = await extractTextFromPdf(bytes, { namespace: "test:standard" });

  assertEquals(result.source, "unpdf");
  assertEquals(result.totalPages, 3);
  assert(result.text.length > 0);
  assertStringIncludes(result.text, "Chapter 1");
});

Deno.test("extractTextFromPdf preserves short text from scanned-like PDFs", async () => {
  const bytes = await loadFixture("scanned-low-text.pdf");
  const result = await extractTextFromPdf(bytes, { namespace: "test:scanned" });

  assertEquals(result.source, "unpdf");
  assert(result.text.length > 0);
  assert(result.text.length < 50);
});

Deno.test("extractTextFromPdf falls back gracefully for corrupted PDFs", async () => {
  const bytes = await loadFixture("corrupted.pdf");
  const result = await extractTextFromPdf(bytes, { namespace: "test:corrupted" });

  assertEquals(result.source, "fallback");
  assert(result.text.length >= 0);
});

