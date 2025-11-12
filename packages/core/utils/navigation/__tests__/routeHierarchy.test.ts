import { describe, expect, it } from "vitest";

import {
  ROUTES,
  buildRoute,
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
    expect(getRouteDepth(ROUTES.OFFICE_CMS.path)).toBe(2);
    expect(getRouteDepth(ROUTES.OFFICE_CMS_JOBS.path)).toBe(3);
    expect(
      getRouteDepth(
        buildRoute(ROUTES.OFFICE_CMS_JOBS_EDIT, { id: "123" }),
      ),
    ).toBe(4);
  });

  it("resolves route keys for static and dynamic paths", () => {
    expect(getRouteKeyForPath(ROUTES.OFFICE_CMS_JOBS.path)).toBe(
      "OFFICE_CMS_JOBS",
    );
    expect(
      getRouteKeyForPath(
        buildRoute(ROUTES.OFFICE_CMS_TEAMS_DETAIL, { id: "team-1" }),
      ),
    ).toBe("OFFICE_CMS_TEAMS_DETAIL");
  });

  it("returns immediate child routes", () => {
    const childPaths = getChildRoutes(ROUTES.OFFICE_CMS.path).map(
      (route) => route.path,
    );
    expect(childPaths).toEqual(
      expect.arrayContaining([
        ROUTES.OFFICE_CMS_WELCOME.path,
        ROUTES.OFFICE_CMS_WORKERS.path,
        ROUTES.OFFICE_CMS_JOBS.path,
        ROUTES.OFFICE_CMS_ORGANIZATIONS.path,
        ROUTES.OFFICE_CMS_TEAMS.path,
        ROUTES.OFFICE_CMS_UNIVERSITIES.path,
      ]),
    );
  });

  it("filters routes at a target depth within a subtree", () => {
    const tierThree = getRoutesAtDepth(ROUTES.OFFICE_CMS.path, 3).map(
      (route) => route.path,
    );
    expect(tierThree).toEqual(
      expect.arrayContaining([
        ROUTES.OFFICE_CMS_WELCOME.path,
        ROUTES.OFFICE_CMS_JOBS.path,
      ]),
    );

    const tierFour = getRoutesAtDepth(ROUTES.OFFICE_CMS.path, 4).map(
      (route) => route.path,
    );
    expect(tierFour).toEqual(
      expect.arrayContaining([
        ROUTES.OFFICE_CMS_JOBS_CREATE.path,
        ROUTES.OFFICE_CMS_JOBS_EDIT.path,
        ROUTES.OFFICE_CMS_ORGANIZATIONS_CREATE.path,
        ROUTES.OFFICE_CMS_ORGANIZATIONS_EDIT.path,
      ]),
    );
  });

  it("decides quick link visibility based on current path context", () => {
    const currentJobsPath = ROUTES.OFFICE_CMS_JOBS.path;
    expect(
      shouldShowInQuickLinks(currentJobsPath, currentJobsPath),
    ).toBe(true);
    expect(
      shouldShowInQuickLinks(ROUTES.OFFICE_CMS_JOBS_CREATE.path, currentJobsPath),
    ).toBe(true);
    expect(
      shouldShowInQuickLinks(
        buildRoute(ROUTES.OFFICE_CMS_JOBS_EDIT, { id: "abc" }),
        currentJobsPath,
      ),
    ).toBe(true);
    expect(
      shouldShowInQuickLinks(
        ROUTES.OFFICE_CMS_ORGANIZATIONS.path,
        currentJobsPath,
      ),
    ).toBe(false);

    const currentCmsPath = ROUTES.OFFICE_CMS.path;
    expect(
      shouldShowInQuickLinks(ROUTES.OFFICE_CMS_WELCOME.path, currentCmsPath),
    ).toBe(true);

    const currentOrgEditPath = buildRoute(
      ROUTES.OFFICE_CMS_ORGANIZATIONS_EDIT,
      { id: "org-42" },
    );
    expect(
      shouldShowInQuickLinks(currentOrgEditPath, currentOrgEditPath),
    ).toBe(true);
    expect(
      shouldShowInQuickLinks(
        ROUTES.OFFICE_CMS_ORGANIZATIONS.path,
        currentOrgEditPath,
      ),
    ).toBe(true);
    expect(
      shouldShowInQuickLinks(
        ROUTES.OFFICE_CMS_JOBS.path,
        currentOrgEditPath,
      ),
    ).toBe(false);
  });
});


