import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from './Auth/LoginPage';
import RegisterPage from './Auth/RegisterPage';
import Dashboard from './Dashboard';
import App from '../App';
import TemplatePreview from './TemplatePreview';
import CanvaEditor from './CanvaEditor';


// OAuth Callback Handler
const OAuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    try {
      console.log('OAuth callback received with params:', location.search);
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const error = params.get('error');
      
      if (error) {
        console.error('OAuth error received:', error);
        navigate(`/login?error=${encodeURIComponent(error)}`);
        return;
      }
      
      if (!token) {
        console.error('No token received in OAuth callback');
        navigate('/login?error=No authentication token received');
        return;
      }
      
      console.log('Token received, storing and redirecting');
      
      // Store the token in localStorage with 'Bearer' prefix
      localStorage.setItem('token', `Bearer ${token}`);
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, '/dashboard');
      
      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error in OAuth callback handler:', err);
      navigate('/login?error=Authentication process failed');
    }
  }, [location, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">Completing authentication...</h2>
      <p className="text-gray-500 mt-2">Please wait while we set up your session.</p>
    </div>
  );
};

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
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/cv-editor" element={<ProtectedRoute element={<App />} />} />
        <Route path="/canva-editor" element={<ProtectedRoute element={<CanvaEditor />} />} />
        <Route path="/templates" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/templates/:id" element={<ProtectedRoute element={<TemplatePreview />} />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter; 