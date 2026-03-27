import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Session from './pages/Session';

function AppContent() {
  const location = useLocation();
  const isAppMode = location.pathname === '/session' || location.pathname === '/dashboard';

  return (
    <div className={`flex flex-col min-h-screen ${isAppMode ? 'bg-background-dark' : ''}`}>
      {!isAppMode && <Navbar />}
      <div className={`flex-1 w-full mx-auto ${isAppMode ? 'h-screen overflow-hidden' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/session" element={
            <ProtectedRoute><Session /></ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
