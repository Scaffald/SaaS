import { beforeEach, describe, expect, it, vi } from "vitest";

const extractPlainText = vi.fn();

"@scaffald/neue-ui", () => ({
  extractPlainText,
}));

const {
  filterEmployers,
  getAvailableIndustries,
  getSelectedIndustryCounts,
} = await import("../employerFilters");

const createEmployer = (
  overrides: Partial<import("../../components/EmployerCard").Employer>,
) => ({
  id: "emp-1",
  name: "Summit Electrical",
  slug: "summit-electrical",
  description: null,
  website_url: null,
  employee_count_range: null,
  annual_revenue_range: null,
  address: null,
  industries: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe("employerFilters utilities", () => {
  beforeEach(() => {
    extractPlainText.mockReset();
  });

  it("filters employers by search query across name, description, and industry", () => {
    extractPlainText.mockReturnValue(
      "Union Electricians installing commercial systems",
    );

    const employers = [
      createEmployer({
        id: "emp-1",
        name: "Summit Electrical",
        description: { type: "doc" } as import("@tiptap/core").JSONContent,
        industries: { id: "ind-1", name: "Construction" },
      }),
      createEmployer({
        id: "emp-2",
        name: "Northwind Plumbing",
        industries: { id: "ind-2", name: "Plumbing" },
        description: "Certified Union Plumbers",
      }),
    ];

    const filtered = filterEmployers(employers, {
      searchQuery: "union",
      selectedIndustries: [],
    });

    expect(filtered).toHaveLength(2);
    expect(extractPlainText).toHaveBeenCalledWith({ type: "doc" });
  });

  it("applies selected industry filters after the search query passes", () => {
    const employers = [
      createEmployer({
        id: "emp-1",
        name: "Summit Electrical",
        industries: { id: "ind-1", name: "Construction" },
        description: "Experienced union labor",
      }),
      createEmployer({
        id: "emp-2",
        name: "Skyline Roofing",
        industries: { id: "ind-2", name: "Roofing" },
        description: "Commercial roofing experts",
      }),
    ];

    const filtered = filterEmployers(employers, {
      searchQuery: "roofing",
      selectedIndustries: ["Roofing"],
    });

    expect(filtered).toEqual([
      expect.objectContaining({ id: "emp-2" }),
    ]);
  });

  it("returns all employers when no filters are applied", () => {
    const employers = [
      createEmployer({ id: "emp-1", name: "Summit Electrical" }),
      createEmployer({ id: "emp-2", name: "Skyline Roofing" }),
    ];

    const filtered = filterEmployers(employers, {
      searchQuery: "   ",
      selectedIndustries: [],
    });

    expect(filtered).toEqual(employers);
  });

  it("builds a sorted list of available industries", () => {
    const employers = [
      createEmployer({ industries: { id: "ind-1", name: "Construction" } }),
      createEmployer({ industries: { id: "ind-2", name: "Plumbing" } }),
      createEmployer({ industries: { id: "ind-3", name: "construction" } }),
      createEmployer({ industries: null }),
    ];

    const industries = getAvailableIndustries(employers);

    expect(industries).toEqual(["Construction", "construction", "Plumbing"]);
  });

  it("counts the number of employers per selected industry", () => {
    const employers = [
      createEmployer({ industries: { id: "ind-1", name: "Construction" } }),
      createEmployer({ industries: { id: "ind-2", name: "Construction" } }),
      createEmployer({ industries: { id: "ind-3", name: "Plumbing" } }),
      createEmployer({ industries: { id: "ind-4", name: "HVAC" } }),
    ];

    const counts = getSelectedIndustryCounts(employers, [
      "Construction",
      "Plumbing",
    ]);

    expect(counts).toEqual({
      Construction: 2,
      Plumbing: 1,
    });
  });
});
