import React from 'react';
import AppRoutes from './router';
import ThemeSwitcher from './components/Common/ThemeSwitcher';

function App() {
  return (
    <>
      <AppRoutes />
      <ThemeSwitcher />
    </>
  );
}

export default App;
