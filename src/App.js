import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import NetworkStatusMonitor from './components/NetworkStatusMonitor';
import './App.css';
import Layout from './components/Layout';
import Splash from './components/Splash';
import GameDetails from './components/GameDetails';
import GameLibrary from './components/GameLibrary';
import GameCard from './components/GameCard';

/* AUTH SCREENS */
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ResetPassword from './components/auth/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Network status monitor for all pages */}
        <NetworkStatusMonitor />
        
        {/* Layout wraps EVERYTHING - sidebar available on all pages */}
        <Routes>
          <Route index element={<Splash />} />
          <Route path="/" element={<Layout />}>
            {/* All routes are children of Layout */}
            
            {/* AUTH ROUTES */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="reset-password" element={<ResetPassword />} />
            
            {/* MAIN APP ROUTES */}
            <Route path="library" element={<GameLibrary />} />
            <Route path="subscription" element={<div>My Subscription Page</div>} />
            <Route path="account" element={<div>My Account Page</div>} />
            <Route path="help" element={<div>Need Help Page</div>} />
            <Route path="referral" element={<div>Tell a Friend Page</div>} />
            
            {/* GAME PAGES */}
            <Route path="games/:gameId" element={<GameDetails />} />
            <Route path="card/:gameId" element={<GameCard />} />
            
            {/* FALLBACK */}
            <Route path="*" element={<Splash />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;