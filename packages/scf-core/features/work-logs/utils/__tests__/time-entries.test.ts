import { describe, expect, it } from "vitest";

import { calculateTotalHours } from "../time-entries";

describe("calculateTotalHours", () => {
  it("computes hours for the default 08:00-16:30 entry", () => {
    expect(calculateTotalHours([{ start: "08:00", end: "16:30" }])).toBe(8.5);
  });

  it("sums multiple valid entries", () => {
    expect(
      calculateTotalHours([
        { start: "08:00", end: "12:00" },
        { start: "13:00", end: "16:30" },
      ])
    ).toBe(7.5);
  });

  it("returns 0 instead of NaN for empty time strings", () => {
    expect(calculateTotalHours([{ start: "", end: "" }])).toBe(0);
  });

  it("returns 0 instead of NaN for partially entered times", () => {
    expect(calculateTotalHours([{ start: "08", end: "" }])).toBe(0);
  });

  it("ignores an entry where end is before or equal to start", () => {
    expect(calculateTotalHours([{ start: "16:00", end: "08:00" }])).toBe(0);
  });
});
