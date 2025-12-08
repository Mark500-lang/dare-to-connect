import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Splash from './components/Splash';
import GameDetails from './components/GameDetails';
import GameLibrary from './components/GameLibrary';
import GameCard from './components/GameCard';
import MainPage from './components/MainPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        
        {/* Routes WITH sidebar */}
        <Route path="/main/*" element={<MainPage />}>
          {/* These pages will have sidebar */}
          <Route path="library" element={<GameLibrary />} />
          <Route path="subscription" element={<div>My Subscription Page</div>} />
          <Route path="account" element={<div>My Account Page</div>} />
          <Route path="help" element={<div>Need Help Page</div>} />
          <Route path="referral" element={<div>Tell a Friend Page</div>} />
          
          {/* Redirect /main to /main/library by default */}
          <Route index element={<Navigate to="library" replace />} />
        </Route>
        
        {/* Routes WITHOUT sidebar */}
        <Route path="/games/:gameId" element={<GameDetails />} />
        <Route path="/card/:cardId" element={<GameCard />} />
        
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;