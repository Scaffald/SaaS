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

