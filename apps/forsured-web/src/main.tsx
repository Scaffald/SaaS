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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TamaguiProvider config={tamaguiWebConfig} defaultTheme="light">
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
    </TamaguiProvider>
  </StrictMode>
);
