import {
  assertArrayIncludes,
  assertEquals,
  assert,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { heuristicParseResume } from "../routers/profile/import.router.ts";

Deno.test("heuristicParseResume extracts baseline sections", () => {
  const sampleResume = `
  John Doe
  Senior Electrician

  EXPERIENCE
  Lead Electrician at BrightSpark Services (2018-2024)
  Apprentice Electrician at City Power (2015-2018)

  SKILLS: Electrical Wiring, Panel Installation, OSHA Safety

  EDUCATION
  Diploma, Technical Trade School

  CERTIFICATIONS
  Licensed Journeyman Electrician
  `;

  const result = heuristicParseResume(sampleResume);

  assertEquals(result.general.length, 1);
  assertEquals(result.general[0].first_name, "John");
  assertEquals(result.general[0].last_name, "Doe");

  assert(result.experience.length >= 1, "Experience entries should be detected");
  assertArrayIncludes(
    result.skills.map((skill) => skill.name.toLowerCase()),
    ["electrical wiring", "panel installation", "osha safety"],
  );
  assertEquals(result.education.length, 1);
  assertEquals(result.certifications.length, 1);
});

Deno.test("heuristicParseResume handles empty resume text", () => {
  const result = heuristicParseResume("");

  assertEquals(result.general.length, 0);
  assertEquals(result.experience.length, 0);
  assertEquals(result.skills.length, 0);
  assertEquals(result.education.length, 0);
  assertEquals(result.certifications.length, 0);
});

Deno.test("heuristicParseResume extracts multiple experience entries", () => {
  const sampleResume = `
  Jane Smith
  Electrician

  WORK EXPERIENCE
  Senior Electrician at ABC Corp (2020-2024)
  Electrician at XYZ Inc (2015-2020)
  Apprentice at DEF Company (2012-2015)
  `;

  const result = heuristicParseResume(sampleResume);

  assert(result.experience.length >= 2, "Should detect multiple experience entries");
});

Deno.test("heuristicParseResume handles various skill formats", () => {
  const sampleResume = `
  John Doe
  Electrician

  SKILLS: Electrical Wiring, Panel Installation
  TECHNICAL SKILLS: OSHA Safety, Code Compliance
  `;

  const result = heuristicParseResume(sampleResume);

  assert(result.skills.length >= 2, "Should detect skills from multiple formats");
  assertArrayIncludes(
    result.skills.map((skill) => skill.name.toLowerCase()),
    ["electrical wiring", "panel installation"],
  );
});

Deno.test("heuristicParseResume sanitizes XSS attempts", () => {
  const maliciousResume = `
  <script>alert('xss')</script>John Doe
  <img src=x onerror=alert(1)>Electrician
  `;

  const result = heuristicParseResume(maliciousResume);

  // Should extract name but sanitize script tags
  if (result.general.length > 0) {
    const general = result.general[0];
    assert(!general.first_name?.includes("<script"), "Should remove script tags");
    assert(!general.first_name?.includes("alert"), "Should sanitize malicious content");
  }
});

