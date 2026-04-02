import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import NetworkStatusMonitor from './components/NetworkStatusMonitor';
import useDeepLink from './hooks/useDeepLink';

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

/* ACCOUNT SCREENS */
import Account from './components/account/Account';
import EditProfile from './components/account/EditProfile';
import ChangePassword from './components/account/ChangePassword';
import DeleteAccount from './components/account/DeleteAccount';
import TellAFriend from './components/TellAFriend';
import Subscriptions from './components/Subscriptions';
import NeedHelp from './components/NeedHelp';

// Inner component — must be inside <Router> for useDeepLink's useNavigate to work
function AppRoutes() {
  useDeepLink(); // ← deep link handler, active on all routes

  return (
    <>
      <NetworkStatusMonitor />
      <Routes>
        <Route index element={<Splash />} />
        <Route path="/" element={<Layout />}>
          {/* AUTH ROUTES */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="reset-password" element={<ResetPassword />} />

          {/* MAIN APP ROUTES */}
          <Route path="library" element={<GameLibrary />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="account" element={<Account />} />
          <Route path="account/edit" element={<EditProfile />} />
          <Route path="account/password" element={<ChangePassword />} />
          <Route path="account/delete" element={<DeleteAccount />} />
          <Route path="help" element={<NeedHelp />} />

          {/* GAME PAGES */}
          <Route path="games/:gameId" element={<GameDetails />} />
          <Route path="card/:gameId" element={<GameCard />} />

          {/* FALLBACK */}
          <Route path="*" element={<Splash />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;