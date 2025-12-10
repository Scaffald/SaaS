/**
 * Expo Router shim for web builds using Vite
 * The forsured-web app uses react-router-dom, not expo-router.
 * This shim provides no-op exports for any expo-router imports
 * that may be pulled in transitively from shared packages.
 */

// No-op components that accept any props
export const Link = ({ children, ...props }: any) => {
  const { href, ...rest } = props;
  return children;
};

export const Redirect = () => null;
export const Tabs = ({ children }: any) => children;
export const Stack = ({ children }: any) => children;
export const Slot = ({ children }: any) => children;

// Navigation hooks - return no-op values
export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  back: () => {},
  canGoBack: () => false,
  setParams: () => {},
});

export const useLocalSearchParams = () => ({});
export const useGlobalSearchParams = () => ({});
export const useSegments = () => [];
export const usePathname = () => '';
export const useNavigationContainerRef = () => ({ current: null });

// Re-export common patterns
export const router = {
  push: () => {},
  replace: () => {},
  back: () => {},
  canGoBack: () => false,
  setParams: () => {},
};

export default {
  Link,
  Redirect,
  Tabs,
  Stack,
  Slot,
  useRouter,
  useLocalSearchParams,
  useGlobalSearchParams,
  useSegments,
  usePathname,
  router,
};
