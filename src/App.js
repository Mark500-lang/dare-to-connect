import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Splash from './components/Splash';
import GameDetails from './components/GameDetails';
import GameLibrary from './components/GameLibrary';
import GameCard from './components/GameCard';
import MainPage from './components/MainPage';

/* AUTH SCREENS */
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ResetPassword from './components/auth/ResetPassword';

function App() {
  return (
    <Router>
      <Routes>
        {/* Splash */}
        <Route path="/" element={<Splash />} />

        {/* AUTH ROUTES (NO SIDEBAR) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ROUTES WITH SIDEBAR */}
        <Route path="/main/*" element={<MainPage />}>
          <Route path="library" element={<GameLibrary />} />
          <Route path="subscription" element={<div>My Subscription Page</div>} />
          <Route path="account" element={<Login />} />
          <Route path="help" element={<div>Need Help Page</div>} />
          <Route path="referral" element={<div>Tell a Friend Page</div>} />

          {/* Default sidebar page */}
          <Route index element={<Navigate to="library" replace />} />
        </Route>

        {/* GAME PAGES (NO SIDEBAR) */}
        <Route path="/games/:gameId" element={<GameDetails />} />
        <Route path="/card/:gameId" element={<GameCard />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
