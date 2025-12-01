import { beforeEach, describe, expect, it, vi } from "vitest";

const extractPlainText = vi.fn();

"@unicornlove/ui", () => ({
  extractPlainText,
}));

const { filterEmployers, getSelectedIndustryCounts } = await import(
  "../employerFilters"
);

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

describe("employerFilters Integration - OR Logic", () => {
  beforeEach(() => {
    extractPlainText.mockReset();
  });

  it("filters employers with OR logic for multiple industry selections", () => {
    const employers = [
      createEmployer({
        id: "emp-1",
        name: "Summit Electrical",
        industries: { id: "ind-1", name: "Construction" },
      }),
      createEmployer({
        id: "emp-2",
        name: "Northwind Plumbing",
        industries: { id: "ind-2", name: "Plumbing" },
      }),
      createEmployer({
        id: "emp-3",
        name: "Skyline Roofing",
        industries: { id: "ind-3", name: "Roofing" },
      }),
      createEmployer({
        id: "emp-4",
        name: "Tech Solutions",
        industries: { id: "ind-4", name: "Technology" },
      }),
    ];

    // Select multiple industries - should return employers matching ANY selected industry
    const filtered = filterEmployers(employers, {
      searchQuery: "",
      selectedIndustries: ["Construction", "Plumbing"],
    });

    // Should return 2 employers (one Construction, one Plumbing)
    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.id)).toEqual(["emp-1", "emp-2"]);
  });

  it("returns all matching employers when multiple industries selected", () => {
    const employers = [
      createEmployer({
        id: "emp-1",
        name: "Summit Electrical",
        industries: { id: "ind-1", name: "Construction" },
      }),
      createEmployer({
        id: "emp-2",
        name: "Another Construction",
        industries: { id: "ind-1", name: "Construction" },
      }),
      createEmployer({
        id: "emp-3",
        name: "Plumbing Co",
        industries: { id: "ind-2", name: "Plumbing" },
      }),
    ];

    const filtered = filterEmployers(employers, {
      searchQuery: "",
      selectedIndustries: ["Construction", "Plumbing"],
    });

    // Should return all 3 employers (2 Construction + 1 Plumbing)
    expect(filtered).toHaveLength(3);
  });

  it("returns empty array when no employers match selected industries", () => {
    const employers = [
      createEmployer({
        id: "emp-1",
        name: "Summit Electrical",
        industries: { id: "ind-1", name: "Construction" },
      }),
      createEmployer({
        id: "emp-2",
        name: "Plumbing Co",
        industries: { id: "ind-2", name: "Plumbing" },
      }),
    ];

    const filtered = filterEmployers(employers, {
      searchQuery: "",
      selectedIndustries: ["Technology", "Healthcare"],
    });

    expect(filtered).toHaveLength(0);
  });

  it("combines search query with industry filter (AND logic between query and industries)", () => {
    extractPlainText.mockReturnValue("Commercial electrical installations");

    const employers = [
      createEmployer({
        id: "emp-1",
        name: "Summit Electrical",
        industries: { id: "ind-1", name: "Construction" },
        description: { type: "doc" } as import("@tiptap/core").JSONContent,
      }),
      createEmployer({
        id: "emp-2",
        name: "Commercial Builders",
        industries: { id: "ind-1", name: "Construction" },
        description: "Residential construction",
      }),
      createEmployer({
        id: "emp-3",
        name: "Electrical Services",
        industries: { id: "ind-2", name: "Plumbing" },
        description: "Commercial electrical",
      }),
    ];

    // Search for "commercial" AND filter by "Construction" industry
    const filtered = filterEmployers(employers, {
      searchQuery: "commercial",
      selectedIndustries: ["Construction"],
    });

    // Should return only employers matching BOTH search query AND Construction industry
    // emp-1: matches search (description) and Construction
    // emp-2: matches search (name "Commercial Builders") and Construction
    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.id)).toEqual(["emp-1", "emp-2"]);
  });
});

describe("employerFilters Integration - Count Calculation Edge Cases", () => {
  beforeEach(() => {
    extractPlainText.mockReset();
  });

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

  it("returns 0 for selected industry with no matching employers", () => {
    const employers = [
      createEmployer({
        id: "emp-1",
        name: "Summit Electrical",
        industries: { id: "ind-1", name: "Construction" },
      }),
      createEmployer({
        id: "emp-2",
        name: "Plumbing Co",
        industries: { id: "ind-2", name: "Plumbing" },
      }),
    ];

    const counts = getSelectedIndustryCounts(employers, [
      "Technology",
      "Healthcare",
    ]);

    expect(counts).toEqual({
      Technology: 0,
      Healthcare: 0,
    });
  });

  it("handles selected industry not in employer list", () => {
    const employers = [
      createEmployer({
        id: "emp-1",
        name: "Summit Electrical",
        industries: { id: "ind-1", name: "Construction" },
      }),
    ];

    const counts = getSelectedIndustryCounts(employers, [
      "Construction",
      "UnknownIndustry",
    ]);

    expect(counts).toEqual({
      Construction: 1,
      UnknownIndustry: 0,
    });
  });

  it("correctly counts when employers filtered by search query", () => {
    extractPlainText.mockReturnValue("Commercial electrical installations");

    const employers = [
      createEmployer({
        id: "emp-1",
        name: "Summit Electrical",
        industries: { id: "ind-1", name: "Construction" },
        description: { type: "doc" } as import("@tiptap/core").JSONContent,
      }),
      createEmployer({
        id: "emp-2",
        name: "Commercial Builders",
        industries: { id: "ind-1", name: "Construction" },
        description: "Residential construction",
      }),
      createEmployer({
        id: "emp-3",
        name: "Electrical Services",
        industries: { id: "ind-2", name: "Plumbing" },
        description: "Commercial electrical",
      }),
    ];

    // Simulate filtered results (after search query "commercial")
    const filteredEmployers = employers.filter((emp) => {
      const name = emp.name.toLowerCase();
      const desc = typeof emp.description === "string"
        ? emp.description.toLowerCase()
        : "commercial electrical installations";
      return name.includes("commercial") || desc.includes("commercial");
    });

    const counts = getSelectedIndustryCounts(filteredEmployers, [
      "Construction",
      "Plumbing",
    ]);

    // After filtering by "commercial", we have 2 Construction and 1 Plumbing
    expect(counts).toEqual({
      Construction: 2,
      Plumbing: 1,
    });
  });

  it("count updates correctly when filters change", () => {
    const employers = [
      createEmployer({
        id: "emp-1",
        name: "Summit Electrical",
        industries: { id: "ind-1", name: "Construction" },
      }),
      createEmployer({
        id: "emp-2",
        name: "Another Construction",
        industries: { id: "ind-1", name: "Construction" },
      }),
      createEmployer({
        id: "emp-3",
        name: "Plumbing Co",
        industries: { id: "ind-2", name: "Plumbing" },
      }),
    ];

    // Initial selection: Construction only
    let counts = getSelectedIndustryCounts(employers, ["Construction"]);
    expect(counts).toEqual({ Construction: 2 });

    // Add Plumbing to selection
    counts = getSelectedIndustryCounts(employers, ["Construction", "Plumbing"]);
    expect(counts).toEqual({
      Construction: 2,
      Plumbing: 1,
    });

    // Remove Construction, keep only Plumbing
    counts = getSelectedIndustryCounts(employers, ["Plumbing"]);
    expect(counts).toEqual({ Plumbing: 1 });

    // Select industry with no matches
    counts = getSelectedIndustryCounts(employers, ["Technology"]);
    expect(counts).toEqual({ Technology: 0 });
  });
});
