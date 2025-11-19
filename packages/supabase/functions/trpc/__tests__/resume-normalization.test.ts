import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.218.0/assert/mod.ts";

import { normalizeOpenAiResumePayload } from "../routers/resume.router.ts";

Deno.test("normalizeOpenAiResumePayload wraps single objects into arrays", () => {
  const normalized = normalizeOpenAiResumePayload({
    general: {
      firstName: "Jane",
      lastName: "Doe",
    },
    experience: {
      title: "Engineer",
      company: "Acme",
    },
  });

  assert(Array.isArray(normalized.general));
  assert(Array.isArray(normalized.experience));
  assertEquals(normalized.general?.[0]?.firstName, "Jane");
  assertEquals(normalized.experience?.[0]?.company, "Acme");
});

Deno.test("normalizeOpenAiResumePayload converts skill strings to name objects", () => {
  const normalized = normalizeOpenAiResumePayload({
    skills: ["JavaScript", "React", "TypeScript"],
  });

  assert(Array.isArray(normalized.skills));
  assertEquals(normalized.skills, [
    { name: "JavaScript" },
    { name: "React" },
    { name: "TypeScript" },
  ]);
});

Deno.test("normalizeOpenAiResumePayload drops non-object employment payloads", () => {
  const normalized = normalizeOpenAiResumePayload({
    employment:
      "Open to opportunities in software development, particularly in front-end or full-stack roles.",
  });

  assertEquals(normalized.employment, undefined);
});

Deno.test("normalizeOpenAiResumePayload converts nested nulls to undefined", () => {
  const normalized = normalizeOpenAiResumePayload({
    general: [{
      firstName: null,
      lastName: "Doe",
    }],
    skills: [{
      name: "JavaScript",
      confidence: null,
    }],
    employment: {
      hourlyRate: null,
      locations: ["Remote", null],
      openToTravel: null,
    },
  });

  assertEquals(normalized.general?.[0]?.firstName, undefined);
  assertEquals(normalized.skills?.[0]?.confidence, undefined);
  assertEquals(normalized.employment?.hourlyRate, undefined);
  assertEquals(normalized.employment?.locations, ["Remote"]);
});

