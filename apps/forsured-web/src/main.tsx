import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from '@unicornlove/ui';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { TRPCProvider } from './providers/TRPCProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <TRPCProvider>
              <UserProvider>
                <DatabaseProvider>
                  <App />
                </DatabaseProvider>
              </UserProvider>
            </TRPCProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TamaguiProvider>
  </StrictMode>
);
