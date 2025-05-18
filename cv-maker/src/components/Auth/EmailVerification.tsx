import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface EmailVerificationProps {
  email: string;
  onComplete: (name: string, password: string) => void;
  onBack: () => void;
  initialCodeSent?: boolean; // New prop to track if code was already sent
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ 
  email, 
  onComplete, 
  onBack,
  initialCodeSent = false // Default to false
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [hasCodeBeenSent, setHasCodeBeenSent] = useState(initialCodeSent);
  const navigate = useNavigate();

  // Request verification code to be sent to email
  const handleSendVerificationCode = async () => {
    if (sendingCode) return; // Prevent multiple simultaneous requests
    
    try {
      setSendingCode(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/verify/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      setHasCodeBeenSent(true);
      // Success message could be shown here
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      console.error('Error sending code:', err);
    } finally {
      setSendingCode(false);
    }
  };

  // Send code automatically when the component mounts, only if it hasn't been sent yet
  React.useEffect(() => {
    if (!hasCodeBeenSent) {
      handleSendVerificationCode();
    }
  }, [hasCodeBeenSent]);

  // Verify the code and proceed to registration details if valid
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/verify/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email,
          code: verificationCode 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      // If code is verified, move to next step
      setIsVerifying(false);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Complete registration with name and password
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/verify/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email,
          code: verificationCode,
          name,
          password 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Registration complete, call the completion callback
      onComplete(name, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {isVerifying ? (
        // Code verification step
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800">Verify your email</h3>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a verification code to <span className="font-medium">{email}</span>
            </p>
          </div>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          <div>
            <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              id="verification-code"
              name="verification-code"
              type="text"
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-brand-light"
              placeholder="Enter 6-digit code"
            />
          </div>
          
          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : 'Verify Code'}
            </button>
            
            <button
              type="button"
              onClick={handleSendVerificationCode}
              disabled={sendingCode}
              className="text-sm text-brand-light hover:text-brand-primary"
            >
              {sendingCode ? 'Sending...' : 'Resend code'}
            </button>
            
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to registration
            </button>
          </div>
        </form>
      ) : (
        // Complete registration form
        <form onSubmit={handleCompleteRegistration} className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800">Complete your profile</h3>
            <p className="mt-2 text-sm text-gray-600">
              Email verified successfully! Please provide the following details to complete registration.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-brand-light"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-brand-light"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-brand-light"
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : 'Complete Registration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EmailVerification; 