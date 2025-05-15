import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from './Auth/LoginPage';
import RegisterPage from './Auth/RegisterPage';
import Dashboard from './Dashboard';
import App from '../App';

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{element}</> : <Navigate to="/login" />;
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/cv-editor" element={<ProtectedRoute element={<App />} />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter; 