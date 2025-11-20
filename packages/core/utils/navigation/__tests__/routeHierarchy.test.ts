import { describe, expect, it } from "vitest";

import {
  ROUTES,
  buildPath,
} from "@app/core/constants/routes";

import {
  getChildRoutes,
  getRouteDepth,
  getRouteKeyForPath,
  getRoutesAtDepth,
  shouldShowInQuickLinks,
} from "../routeHierarchy";

describe("routeHierarchy utilities", () => {
  it("calculates depth across the office CMS tree", () => {
    expect(getRouteDepth(ROUTES.OFFICE.path)).toBe(1);
    expect(getRouteDepth(ROUTES.OFFICE.CMS.path)).toBe(2);
    expect(getRouteDepth(ROUTES.OFFICE.CMS.JOBS.path)).toBe(3);
    expect(
      getRouteDepth(
        buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: "123" }),
      ),
    ).toBe(4);
  });

  it("resolves route keys for static and dynamic paths", () => {
    const jobsKey = getRouteKeyForPath(ROUTES.OFFICE.CMS.JOBS.path);
    expect(jobsKey).toBeDefined();
    expect(
      getRouteKeyForPath(
        buildPath(ROUTES.OFFICE.CMS.TEAMS.DETAIL, { id: "team-1" }),
      ),
    ).toBeDefined();
  });

  it("returns immediate child routes", () => {
    const childPaths = getChildRoutes(ROUTES.OFFICE.CMS.path).map(
      (route) => route.path,
    );
    expect(childPaths).toEqual(
      expect.arrayContaining([
        ROUTES.OFFICE.CMS.WELCOME.path,
        ROUTES.OFFICE.CMS.WORKERS.path,
        ROUTES.OFFICE.CMS.JOBS.path,
        ROUTES.OFFICE.CMS.ORGANIZATIONS.path,
        ROUTES.OFFICE.CMS.TEAMS.path,
        ROUTES.OFFICE.CMS.UNIVERSITIES.path,
      ]),
    );
  });

  it("filters routes at a target depth within a subtree", () => {
    const tierThree = getRoutesAtDepth(ROUTES.OFFICE.CMS.path, 3).map(
      (route) => route.path,
    );
    expect(tierThree).toEqual(
      expect.arrayContaining([
        ROUTES.OFFICE.CMS.WELCOME.path,
        ROUTES.OFFICE.CMS.JOBS.path,
      ]),
    );

    const tierFour = getRoutesAtDepth(ROUTES.OFFICE.CMS.path, 4).map(
      (route) => route.path,
    );
    expect(tierFour).toEqual(
      expect.arrayContaining([
        ROUTES.OFFICE.CMS.JOBS.CREATE.path,
        ROUTES.OFFICE.CMS.JOBS.EDIT.path,
        ROUTES.OFFICE.CMS.ORGANIZATIONS.CREATE.path,
        ROUTES.OFFICE.CMS.ORGANIZATIONS.EDIT.path,
      ]),
    );
  });

  it("decides quick link visibility based on current path context", () => {
    const currentJobsPath = ROUTES.OFFICE.CMS.JOBS.path;
    expect(
      shouldShowInQuickLinks(currentJobsPath, currentJobsPath),
    ).toBe(true);
    expect(
      shouldShowInQuickLinks(ROUTES.OFFICE.CMS.JOBS.CREATE.path, currentJobsPath),
    ).toBe(true);
    expect(
      shouldShowInQuickLinks(
        buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: "abc" }),
        currentJobsPath,
      ),
    ).toBe(true);
    expect(
      shouldShowInQuickLinks(
        ROUTES.OFFICE.CMS.ORGANIZATIONS.path,
        currentJobsPath,
      ),
    ).toBe(false);

    const currentCmsPath = ROUTES.OFFICE.CMS.path;
    expect(
      shouldShowInQuickLinks(ROUTES.OFFICE.CMS.WELCOME.path, currentCmsPath),
    ).toBe(true);

    const currentOrgEditPath = buildPath(
      ROUTES.OFFICE.CMS.ORGANIZATIONS.EDIT,
      { id: "org-42" },
    );
    expect(
      shouldShowInQuickLinks(currentOrgEditPath, currentOrgEditPath),
    ).toBe(true);
    expect(
      shouldShowInQuickLinks(
        ROUTES.OFFICE.CMS.ORGANIZATIONS.path,
        currentOrgEditPath,
      ),
    ).toBe(true);
    expect(
      shouldShowInQuickLinks(
        ROUTES.OFFICE.CMS.JOBS.path,
        currentOrgEditPath,
      ),
    ).toBe(false);
  });
});


