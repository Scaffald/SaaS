import React from 'react';
import AppRoutes from './router';
import ThemeSwitcher from './components/Common/ThemeSwitcher';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ThemeSwitcher />
    </AuthProvider>
  );
}

export default App;
