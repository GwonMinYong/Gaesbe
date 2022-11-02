import React from 'react';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import './App.css';
import IntroPage from './features/Intro/pages/IntroPage';
import LoginPage from './features/auth/pages/LoginPage';
import SetNicknamePage from './features/auth/pages/SetNicknamePage';
import CombinePage from './features/unity/pages/CombinePage';
import RedirectPage from './features/auth/pages/RedirectPage';
import Background from './components/Layout/Background';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="" element={<IntroPage />} />
        <Route path="oauth2/redirect" element={<RedirectPage />} />
        <Route path="" element={<Background />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="nickname" element={<SetNicknamePage />} />
        </Route>
        <Route path="meta/*" element={<CombinePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;