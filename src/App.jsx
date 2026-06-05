import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import Login from './pages/Login';
import OfflineScreen from './components/OfflineScreen';
import { useEffect, useState } from 'react';
import { cleanupOldConversations } from './db';

function AppRoutes() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    cleanupOldConversations();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) return <OfflineScreen />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
      <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/chat" />} />
      <Route path="/" element={<Navigate to="/chat" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;