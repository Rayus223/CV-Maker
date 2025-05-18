import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import EmailVerification from './EmailVerification';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [initialCodeSent, setInitialCodeSent] = useState(false);
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();

  // Step 1: Email input and send initial verification code
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      try {
        const response = await fetch('http://localhost:5000/api/verify/send-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });

        if (response.ok) {
          setInitialCodeSent(true);
          setShowVerification(true);
        } else {
          const data = await response.json();
          throw new Error(data.message || 'Failed to send verification code');
        }
      } catch (err: any) {
        console.error('Error sending verification code:', err);
        // You might want to show this error to the user
      }
    }
  };

  // Step 2: After email verification is complete
  const handleVerificationComplete = async (name: string, password: string) => {
    await register(name, email, password);
    if (!error) {
      navigate('/dashboard');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-brand-primary">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-brand-light hover:text-brand-primary transition-colors duration-200">
              sign in to your account
            </Link>
          </p>
        </div>
        
        {error && !showVerification && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {showVerification ? (
          <EmailVerification 
            email={email} 
            onComplete={handleVerificationComplete}
            onBack={() => {
              setShowVerification(false);
              setInitialCodeSent(false);
            }}
            initialCodeSent={initialCodeSent}
          />
        ) : (
          <>
            <form className="space-y-6" onSubmit={handleInitialSubmit}>
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-brand-light transition-colors duration-200 ease-in-out"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light transition-all duration-200 transform hover:translate-y-[-1px]"
                >
                  Continue with Email
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light transition-all duration-200 transform hover:translate-y-[-1px]"
                >
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09c1.97 3.92 6.02 6.62 10.71 6.62z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29v-3.09h-3.98c-.8 1.61-1.26 3.43-1.26 5.38s.46 3.77 1.26 5.38l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12.255 5.04c1.77 0 3.35.61 4.6 1.8l3.42-3.42c-2.08-1.95-4.81-3.15-8.02-3.15-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.94 6.73-4.94z"
                    />
                  </svg>
                  Sign up with Google
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;