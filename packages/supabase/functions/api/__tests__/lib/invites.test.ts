/**
 * api/lib/invites.ts — the pure parts of /v1/invites (#1393).
 */
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  firstName,
  generateInviteCode,
  INVITE_CODE_LENGTH,
  inviteLink,
  isPlausibleCode,
  normalizeContacts,
  normalizeEmail,
  normalizePhone,
  renderInviteEmail,
  shareText,
  smsUrl,
  SOURCE_RE,
} from "../../lib/invites.ts";

Deno.test("phones: E.164 out, US default for 10 digits, null rather than a guess", () => {
  assertEquals(normalizePhone("(555) 555-0123"), "+15555550123");
  assertEquals(normalizePhone("1-555-555-0123"), "+15555550123");
  assertEquals(normalizePhone("+44 20 7946 0958"), "+442079460958");
  assertEquals(normalizePhone("0044 20 7946 0958"), "+442079460958");
  assertEquals(
    normalizePhone("555-0123"),
    null,
    "7 digits with no country is ambiguous",
  );
  assertEquals(
    normalizePhone("+0 123 456 789"),
    null,
    "country codes never start with 0",
  );
  assertEquals(normalizePhone(""), null);
  assertEquals(normalizePhone(undefined), null);
});

Deno.test("emails: trimmed, lower-cased, obviously broken ones dropped", () => {
  assertEquals(normalizeEmail("  Jodie@Example.TEST "), "jodie@example.test");
  assertEquals(normalizeEmail("not an email"), null);
  assertEquals(normalizeEmail("a@b"), null);
  assertEquals(normalizeEmail(null), null);
});

Deno.test("contacts: email wins over phone, duplicates and unusable rows are reported by index", () => {
  const { ok, skipped } = normalizeContacts([
    { name: " Sam ", email: "sam@example.test", phone: "5555550100" },
    { email: "SAM@example.test" },
    { phone: "555 555 0101" },
    { name: "nobody" },
    { phone: "+1 555 555 0101" },
  ]);
  assertEquals(ok, [
    { index: 0, name: "Sam", email: "sam@example.test", phone: null },
    { index: 2, name: null, email: null, phone: "+15555550101" },
  ]);
  assertEquals(skipped, [
    { index: 1, reason: "duplicate" },
    { index: 3, reason: "invalid" },
    { index: 4, reason: "duplicate" },
  ]);
});

Deno.test("codes: 12 characters from the unambiguous alphabet, and the plausibility check", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 500; i++) {
    const code = generateInviteCode();
    assertEquals(code.length, INVITE_CODE_LENGTH);
    assert(/^[a-hjkmnp-z2-9]+$/.test(code), code);
    seen.add(code);
  }
  assertEquals(seen.size, 500);
  assert(isPlausibleCode("abc234xyz"));
  assert(!isPlausibleCode("ab"));
  assert(!isPlausibleCode("has space"));
  assert(!isPlausibleCode("../etc"));
});

Deno.test("links and texts: the sms: link carries the encoded text; names fall back", () => {
  const link = inviteLink("https://dev.scaffald.com/", "abc234");
  assertEquals(link, "https://dev.scaffald.com/i/abc234");
  const text = shareText("Clay", link);
  assertStringIncludes(text, "Clay invited you to Scaffald");
  assertStringIncludes(text, link);
  assertStringIncludes(
    shareText("Clay", link, "Come work with us"),
    "Come work with us",
  );
  assertEquals(
    smsUrl("+15555550101", "a b&c"),
    "sms:+15555550101?&body=a%20b%26c",
  );
  assertEquals(firstName("Clay Bernier"), "Clay");
  assertEquals(firstName("  "), "A friend");
  assertEquals(firstName(null), "A friend");
});

Deno.test("email: subject names the inviter; the personal note and names are escaped", () => {
  const mail = renderInviteEmail({
    inviterName: "Clay <b>",
    inviteeName: "Sam Ortiz",
    link: "https://scaffald.com/i/abc234",
    message: 'Join us <script>alert("x")</script>',
  });
  assertEquals(mail.subject, "Clay <b> invited you to Scaffald");
  assertStringIncludes(mail.bodyHtml, "Hi Sam,");
  assertStringIncludes(mail.bodyHtml, "Clay &lt;b&gt;");
  assertStringIncludes(mail.bodyHtml, "&lt;script&gt;");
  assert(!mail.bodyHtml.includes("<script>"));
  assertStringIncludes(mail.bodyHtml, 'href="https://scaffald.com/i/abc234"');
  assertStringIncludes(mail.text, "Join here: https://scaffald.com/i/abc234");
});

Deno.test("source: app, onboarding, share, or script:<file>", () => {
  for (
    const ok of [
      "app",
      "onboarding",
      "share",
      "script:crew.csv",
      "script:list_2026-11",
    ]
  ) {
    assert(SOURCE_RE.test(ok), ok);
  }
  for (const bad of ["", "admin", "script:", "script:../x y", "app2"]) {
    assert(!SOURCE_RE.test(bad), bad);
  }
});

Deno.test("email: the reminder has its own subject and opener, same link and note", () => {
  const first = renderInviteEmail({
    inviterName: "Riley",
    inviteeName: "Sam",
    link: "https://scaffald.com/i/abc234",
    message: "Hi",
  });
  const reminder = renderInviteEmail({
    inviterName: "Riley",
    inviteeName: "Sam",
    link: "https://scaffald.com/i/abc234",
    message: "Hi",
    reminder: true,
  });
  assertEquals(reminder.subject, "Reminder: Riley invited you to Scaffald");
  assertStringIncludes(
    reminder.text,
    "Just a reminder: Riley invited you to Scaffald a few days ago",
  );
  assertStringIncludes(reminder.bodyHtml, "Just a reminder");
  assertStringIncludes(
    reminder.text,
    "Join here: https://scaffald.com/i/abc234",
  );
  assert(!first.text.includes("reminder"));
});
