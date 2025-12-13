/**
 * Expo Linking shim for web builds using Vite
 * expo-linking is used for deep linking in React Native.
 * On web, we use standard browser APIs (window.open, window.location).
 */

// Open a URL in the browser
export const openURL = (url: string) => {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// Check if a URL can be opened (always true on web)
export const canOpenURL = async (_url: string) => true;

// Get the initial URL (current page URL on web)
export const getInitialURL = async () => {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return null;
};

// Parse a URL
export const parse = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      scheme: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      path: parsed.pathname,
      queryParams: Object.fromEntries(parsed.searchParams),
    };
  } catch {
    return { scheme: null, hostname: null, path: url, queryParams: {} };
  }
};

// Create a URL
export const createURL = (path: string, params?: Record<string, string>) => {
  if (typeof window !== 'undefined') {
    const url = new URL(path, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }
  return path;
};

// Add event listener for URL changes (uses popstate on web)
export const addEventListener = (
  _type: string,
  handler: (event: { url: string }) => void
) => {
  if (typeof window !== 'undefined') {
    const listener = () => handler({ url: window.location.href });
    window.addEventListener('popstate', listener);
    return { remove: () => window.removeEventListener('popstate', listener) };
  }
  return { remove: () => {} };
};

// Remove event listener
export const removeEventListener = () => {
  // No-op on web (handled by addEventListener return value)
};

// Default export for * as Linking import pattern
export default {
  openURL,
  canOpenURL,
  getInitialURL,
  parse,
  createURL,
  addEventListener,
  removeEventListener,
};
