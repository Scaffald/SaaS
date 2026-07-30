import {
  assertEquals,
  assert,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { calculateMilestones } from '../routers/profile/completion.router.ts';

Deno.test("calculateMilestones tracks newly earned thresholds", () => {
  const timestamp = new Date("2025-01-01T12:00:00Z").toISOString();
  const result = calculateMilestones(55, {}, timestamp);

  assert(result.milestonesUpdated, "Milestones should be marked as updated");
  assertEquals(result.milestones.length, 4);

  const firstMilestone = result.milestones.find((m) => m.threshold === 25);
  const secondMilestone = result.milestones.find((m) => m.threshold === 50);
  const thirdMilestone = result.milestones.find((m) => m.threshold === 75);

  assert(firstMilestone?.achieved, "25% milestone should be achieved");
  assert(secondMilestone?.achieved, "50% milestone should be achieved");
  assertEquals(
    secondMilestone?.reachedAt,
    timestamp,
    "50% milestone should record timestamp",
  );
  assertEquals(
    thirdMilestone?.achieved,
    false,
    "75% milestone should not yet be achieved",
  );

  assertEquals(result.updatedMilestones["50"], timestamp);
});

