/**
 * Evolved Application Route Configuration
 *
 * Features:
 * - Hierarchical nested route structure matching Expo app structure
 * - Inline parameter conversion functions
 * - Convenient methods (.map(), .filter(), etc.)
 * - Type-safe route generation
 * - Centralized route management
 * - Only auth and dashboard routes (all dashboard routes are protected)
 */

// Base types for route configuration
export type RouteParams = Record<string, string | number>;
export type RouteFunction = (params?: RouteParams) => string;

export interface RouteConfig {
  path: string;
  title?: string;
  description?: string;
  isAuth?: boolean;
  isProtected?: boolean;
  children?: Record<string, RouteConfig>;
  dynamic?: boolean;
  params?: string[];
}

export interface RouteNode extends RouteConfig {
  // Flattened path for easy access
  fullPath: string;
  // Parent reference for navigation
  parent?: RouteNode;
  // Children as an array for iteration
  childrenArray?: RouteNode[];
  // Methods for convenience
  map: <T>(fn: (route: RouteNode) => T) => T[];
  filter: (fn: (route: RouteNode) => boolean) => RouteNode[];
  find: (fn: (route: RouteNode) => boolean) => RouteNode | undefined;
  findByPath: (path: string) => RouteNode | undefined;
  getProtectedRoutes: () => RouteNode[];
  getAuthRoutes: () => RouteNode[];
  toPath: RouteFunction;
  isActive: (currentPath: string) => boolean;
  isParentOf: (path: string) => boolean;
}

// Dynamic route builder
const buildDynamicRoute = (
  template: string,
  params: RouteParams = {},
): string => {
  let result = template;

  // Replace parameter placeholders
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, String(value));
  }

  // Remove any remaining unused parameters
  result = result.replace(/\/:[^/]+/g, "");

  // Clean up double slashes and trailing slashes
  result = result.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

  return result;
};

// Route node factory
const createRouteNode = (
  config: RouteConfig,
  fullPath: string,
  parent?: RouteNode,
): RouteNode => {
  const node: RouteNode = {
    ...config,
    fullPath,
    parent,
    childrenArray: [],

    // Convenience methods
    map: <T>(fn: (route: RouteNode) => T): T[] => {
      const results: T[] = [fn(node)];
      for (const child of node.childrenArray || []) {
        results.push(...child.map(fn));
      }
      return results;
    },

    filter: (fn: (route: RouteNode) => boolean): RouteNode[] => {
      const results: RouteNode[] = [];
      if (fn(node)) results.push(node);
      for (const child of node.childrenArray || []) {
        results.push(...child.filter(fn));
      }
      return results;
    },

    find: (fn: (route: RouteNode) => boolean): RouteNode | undefined => {
      if (fn(node)) return node;
      for (const child of node.childrenArray || []) {
        const found = child.find(fn);
        if (found) return found;
      }
      return undefined;
    },

    findByPath: (path: string): RouteNode | undefined => {
      return node.find((route) => route.fullPath === path);
    },

    getProtectedRoutes: (): RouteNode[] => {
      return node.filter((route) => route.isProtected === true);
    },

    getAuthRoutes: (): RouteNode[] => {
      return node.filter((route) => route.isAuth === true);
    },

    toPath: (params?: RouteParams): string => {
      return buildDynamicRoute(fullPath, params);
    },

    isActive: (currentPath: string): boolean => {
      if (currentPath === fullPath) return true;
      return node.isParentOf(currentPath);
    },

    isParentOf: (path: string): boolean => {
      return path.startsWith(`${fullPath}/`);
    },
  };

  // Process children
  if (config.children) {
    node.childrenArray = Object.entries(config.children).map(
      ([_key, childConfig]) => {
        const childPath = childConfig.path.startsWith("/")
          ? childConfig.path
          : `${fullPath}/${childConfig.path}`;

        return createRouteNode(childConfig, childPath, node);
      },
    );
  }

  return node;
};

// Core route configuration - matches Expo app structure exactly
const routeConfig: Record<string, RouteConfig> = {
  // Root route
  home: {
    path: "/",
    title: "Home",
  },

  // Authentication routes
  auth: {
    path: "/auth",
    title: "Authentication",
    isAuth: true,
    children: {
      index: {
        path: "/auth",
        title: "Sign In",
      },
      confirm: {
        path: "/auth/confirm",
        title: "Confirm Account",
      },
    },
  },

  // Dashboard routes (all protected)
  dashboard: {
    path: "/dashboard",
    title: "Dashboard",
    isProtected: true,
    children: {
      index: {
        path: "/dashboard",
        title: "Dashboard Home",
      },

      // Dashboard Profile routes
      profile: {
        path: "/dashboard/profile",
        title: "Profile",
        children: {
          index: {
            path: "/dashboard/profile",
            title: "Profile Overview",
          },
          general: {
            path: "/dashboard/profile/general",
            title: "General",
          },
          employment: {
            path: "/dashboard/profile/employment",
            title: "Employment",
          },
          skills: {
            path: "/dashboard/profile/skills",
            title: "Skills",
          },
          certifications: {
            path: "/dashboard/profile/certifications",
            title: "Certifications",
          },
          education: {
            path: "/dashboard/profile/education",
            title: "Education",
          },
          experience: {
            path: "/dashboard/profile/experience",
            title: "Experience",
          },
        },
      },

      // Dashboard Settings routes
      settings: {
        path: "/dashboard/settings",
        title: "Settings",
        children: {
          index: {
            path: "/dashboard/settings",
            title: "Settings",
          },
          general: {
            path: "/dashboard/settings/general",
            title: "General Settings",
          },
          security: {
            path: "/dashboard/settings/security",
            title: "Security Settings",
          },
          authentication: {
            path: "/dashboard/settings/authentication",
            title: "Authentication Settings",
          },
        },
      },

      // Dashboard Discover routes
      discover: {
        path: "/dashboard/discover",
        title: "Discover",
        children: {
          map: {
            path: "/dashboard/discover/map",
            title: "Map",
          },
          workers: {
            path: "/dashboard/discover/workers",
            title: "Workers",
          },
          employers: {
            path: "/dashboard/discover/employers",
            title: "Employers",
          },
          jobs: {
            path: "/dashboard/discover/jobs",
            title: "Jobs",
          },
        },
      },
    },
  },

  // Office routes (admin only)
  office: {
    path: "/office",
    title: "Office",
    isProtected: true,
    children: {
      index: {
        path: "/office",
        title: "Office",
      },
      users: {
        path: "/office/users",
        title: "Manage Users",
      },
      jobs: {
        path: "/office/jobs",
        title: "Manage Jobs",
      },
    },
  },
};

// Create the route tree
export const ROUTES = Object.fromEntries(
  Object.entries(routeConfig).map((
    [key, config],
  ) => [key, createRouteNode(config, config.path)]),
) as Record<string, RouteNode>;

// Convenience accessors for common routes
export const AUTH_ROUTES = {
  INDEX: ROUTES.auth.childrenArray?.find((r) => r.path === "/auth"),
  CONFIRM: ROUTES.auth.childrenArray?.find((r) => r.path === "/auth/confirm"),
};

export const DASHBOARD_ROUTES = {
  INDEX: ROUTES.dashboard,
  PROFILE: ROUTES.dashboard.childrenArray?.find((r) =>
    r.path === "/dashboard/profile"
  ),
  SETTINGS: ROUTES.dashboard.childrenArray?.find((r) =>
    r.path === "/dashboard/settings"
  ),
  Discover: ROUTES.dashboard.childrenArray?.find((r) =>
    r.path === "/dashboard/discover"
  ),
};

export const OFFICE_ROUTES = {
  INDEX: ROUTES.office.childrenArray?.find((r) => r.path === "/office"),
  USERS: ROUTES.office.childrenArray?.find((r) => r.path === "/office/users"),
  JOBS: ROUTES.office.childrenArray?.find((r) => r.path === "/office/jobs"),
};

// Route type for TypeScript safety
export type AppRoute = RouteNode;

// Helper functions
export const buildRoute = (
  route: RouteNode | string,
  params?: RouteParams,
): string => {
  if (typeof route === "string") {
    return buildDynamicRoute(route, params);
  }
  return route.toPath(params);
};

export const findRouteByPath = (path: string): RouteNode | undefined => {
  return Object.values(ROUTES).find((route) => route.findByPath(path));
};

export const getProtectedRoutes = (): RouteNode[] => {
  return Object.values(ROUTES).flatMap((route) => route.getProtectedRoutes());
};

export const getAuthRoutes = (): RouteNode[] => {
  return Object.values(ROUTES).flatMap((route) => route.getAuthRoutes());
};

// Navigation helpers
export const isProtectedPath = (path: string): boolean => {
  return getProtectedRoutes().some((route) =>
    path === route.fullPath || route.isParentOf(path)
  );
};

export const isAuthPath = (path: string): boolean => {
  return getAuthRoutes().some((route) =>
    path === route.fullPath || route.isParentOf(path)
  );
};

// Export the main routes object for easy access
export { ROUTES as default };
