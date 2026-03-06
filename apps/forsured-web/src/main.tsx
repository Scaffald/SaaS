import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { TRPCProvider } from './providers/TRPCProvider';
import { LexiconProvider } from './contexts/LexiconContext';
import { BeyondUIProvider } from './providers/BeyondUIProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BeyondUIProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </BeyondUIProvider>
    </ThemeProvider>
  </StrictMode>
);
