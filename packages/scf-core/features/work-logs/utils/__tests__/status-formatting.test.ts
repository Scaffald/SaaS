import { describe, expect, it } from "vitest";
import { colors } from "@scaffald/ui/tokens";

import { getStatusColor, getStatusLabel } from "../status-formatting";

describe("getStatusLabel", () => {
  it("returns correct label for draft status", () => {
    expect(getStatusLabel("draft")).toBe("Draft");
  });

  it("returns correct label for pending_verification status", () => {
    expect(getStatusLabel("pending_verification")).toBe(
      "Awaiting Verification"
    );
  });

  it("returns correct label for verified status", () => {
    expect(getStatusLabel("verified")).toBe("Verified");
  });

  it("returns correct label for disputed status", () => {
    expect(getStatusLabel("disputed")).toBe("Disputed");
  });

  it("returns 'Unknown' for null status", () => {
    expect(getStatusLabel(null)).toBe("Unknown");
  });

  it("returns 'Unknown' for undefined status", () => {
    expect(getStatusLabel(undefined)).toBe("Unknown");
  });

  it("formats unknown status by replacing underscores", () => {
    expect(getStatusLabel("unknown_status")).toBe("unknown status");
  });
});

describe("getStatusColor", () => {
  it("returns correct color for draft status", () => {
    expect(getStatusColor("draft", "light")).toBe(colors.text.light.tertiary);
  });

  it("returns correct color for pending_verification status", () => {
    expect(getStatusColor("pending_verification", "light")).toBe(
      colors.fg.light.warning
    );
  });

  it("returns correct color for verified status", () => {
    expect(getStatusColor("verified", "light")).toBe(colors.fg.light.success);
  });

  it("returns correct color for disputed status", () => {
    expect(getStatusColor("disputed", "light")).toBe(colors.fg.light.error);
  });

  it("returns default secondary color for null status", () => {
    expect(getStatusColor(null, "light")).toBe(colors.text.light.secondary);
  });

  it("returns default secondary color for undefined status", () => {
    expect(getStatusColor(undefined, "light")).toBe(
      colors.text.light.secondary
    );
  });

  it("returns default tertiary color for unknown status", () => {
    expect(getStatusColor("unknown_status", "light")).toBe(
      colors.text.light.tertiary
    );
  });
});
