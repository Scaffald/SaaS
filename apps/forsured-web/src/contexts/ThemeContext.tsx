import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'earth';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const getUserId = (): string => {
  let userId = localStorage.getItem('theme_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('theme_user_id', userId);
  }
  return userId;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const localTheme = localStorage.getItem('theme') as Theme | null;

        if (localTheme && ['light', 'dark', 'earth'].includes(localTheme)) {
          setThemeState(localTheme);
          applyTheme(localTheme);
        } else {
          const systemTheme = getSystemTheme();
          setThemeState(systemTheme);
          applyTheme(systemTheme);
          localStorage.setItem('theme', systemTheme);
        }
      } catch (error) {
        console.error('Error initializing theme:', error);
        const fallbackTheme = getSystemTheme();
        setThemeState(fallbackTheme);
        applyTheme(fallbackTheme);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const storedTheme = localStorage.getItem('theme');
      if (!storedTheme) {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.classList.remove('light', 'dark', 'earth');
    document.documentElement.classList.add(newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};
