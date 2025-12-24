import React from 'react';
import { Toaster } from 'sonner';
import AppRoutes from './router';
import ThemeSwitcher from './components/Common/ThemeSwitcher';

function App() {
  return (
    <>
      <AppRoutes />
      <ThemeSwitcher />
      <Toaster position="top-right" />
    </>
  );
}

export default App;
