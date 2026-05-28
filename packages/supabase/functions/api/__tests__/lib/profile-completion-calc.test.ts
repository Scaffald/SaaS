import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  completionPercentage,
  getSectionStatuses,
  type CompletionInputs,
  milestoneBadges,
  nextMilestone,
} from "../../lib/profile-completion-calc.ts";

const EMPTY: CompletionInputs = {
  profile: null,
  headline: null,
  skillsCount: 0,
  certificationsCount: 0,
  educationCount: 0,
  experience: [],
};

const FULL: CompletionInputs = {
  profile: {
    first_name: "Clay",
    last_name: "Unicorn",
    address: "123 Main St",
    preferred_work_locations: ["Remote"],
    education_level: "Bachelor's",
  },
  headline: "Founder",
  skillsCount: 5,
  certificationsCount: 2,
  educationCount: 1,
  experience: [{ job_title: "CEO", company_name: "Unicorn" }],
};

Deno.test("empty profile scores 0% with every section incomplete", () => {
  const sections = getSectionStatuses(EMPTY);
  assertEquals(completionPercentage(sections), 0);
  assertEquals(sections.every((s) => !s.completed), true);
});

Deno.test("fully-seeded profile scores 100%", () => {
  const sections = getSectionStatuses(FULL);
  assertEquals(completionPercentage(sections), 100);
  assertEquals(sections.every((s) => s.completed), true);
});

Deno.test("general-only profile scores 20% (general weight)", () => {
  const sections = getSectionStatuses({
    ...EMPTY,
    profile: { first_name: "Clay", last_name: "Unicorn" },
    headline: "Founder",
  });
  const general = sections.find((s) => s.id === "general");
  assertEquals(general?.completed, true);
  // Only general complete → 20%.
  assertEquals(completionPercentage(sections), 20);
});

Deno.test("general is incomplete when headline missing, and reports it", () => {
  const sections = getSectionStatuses({ ...FULL, headline: "  " });
  const general = sections.find((s) => s.id === "general");
  assertEquals(general?.completed, false);
  assertEquals(general?.missingFields, ["headline"]);
});

Deno.test("skills need >= 3 entries", () => {
  const two = getSectionStatuses({ ...EMPTY, skillsCount: 2 });
  assertEquals(two.find((s) => s.id === "skills")?.completed, false);
  const three = getSectionStatuses({ ...EMPTY, skillsCount: 3 });
  assertEquals(three.find((s) => s.id === "skills")?.completed, true);
});

Deno.test("experience needs a job_title AND company_name on one entry", () => {
  const partial = getSectionStatuses({
    ...EMPTY,
    experience: [{ job_title: "CEO", company_name: "" }],
  });
  assertEquals(partial.find((s) => s.id === "experience")?.completed, false);
  const full = getSectionStatuses({
    ...EMPTY,
    experience: [{ job_title: "CEO", company_name: "Unicorn" }],
  });
  assertEquals(full.find((s) => s.id === "experience")?.completed, true);
});

Deno.test("preferences complete via address OR preferred locations", () => {
  const byAddress = getSectionStatuses({ ...EMPTY, profile: { address: "x" } });
  assertEquals(byAddress.find((s) => s.id === "preferences")?.completed, true);
  const byLocations = getSectionStatuses({
    ...EMPTY,
    profile: { preferred_work_locations: ["Remote"] },
  });
  assertEquals(byLocations.find((s) => s.id === "preferences")?.completed, true);
});

Deno.test("milestones + nextMilestone track the percentage", () => {
  assertEquals(milestoneBadges(55).map((m) => m.achieved), [true, true, false, false]);
  assertEquals(nextMilestone(55), 75);
  assertEquals(nextMilestone(100), null);
});
