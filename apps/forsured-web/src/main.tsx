import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TamaguiProvider } from '@unicornlove/ui';
// Use web-specific tamagui config with CSS animations (avoids react-native-reanimated issues)
import { tamaguiWebConfig } from './config/tamagui-web.config';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { TRPCProvider } from './providers/TRPCProvider';
import { LexiconProvider } from './contexts/LexiconContext';
// Beyond UI provider for gradual migration from Tamagui
import { BeyondUIProvider } from './providers/BeyondUIProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Dual-provider pattern: TamaguiProvider + BeyondUIProvider coexist during migration */}
    <TamaguiProvider config={tamaguiWebConfig} defaultTheme="light">
      <BeyondUIProvider initialTheme="light">
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <TRPCProvider>
                <LexiconProvider>
                  <UserProvider>
                    <DatabaseProvider>
                      <App />
                    </DatabaseProvider>
                  </UserProvider>
                </LexiconProvider>
              </TRPCProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </BeyondUIProvider>
    </TamaguiProvider>
  </StrictMode>
);
