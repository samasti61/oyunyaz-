import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import CreateReviewPage from './pages/CreateReviewPage';
import ReviewDetailPage from './pages/ReviewDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import '@/App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/create" element={
        <ProtectedRoute>
          <CreateReviewPage />
        </ProtectedRoute>
      } />
      <Route path="/review/:id" element={<ReviewDetailPage />} />
      <Route path="/edit/:id" element={
        <ProtectedRoute>
          <CreateReviewPage />
        </ProtectedRoute>
      } />
      <Route path="/profile/:userId" element={<UserProfilePage />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="App">
            <AppRoutes />
            <Toaster position="top-center" />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;