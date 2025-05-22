import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the User type
interface User {
  id: string;
  name: string;
  email: string;
  isVerified?: boolean;
  profileImage?: {
    url: string;
    publicId: string;
  };
}

// Define the AuthContext type
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  updateProfileImage: (imageData: { url: string; publicId: string }) => void;
  setUser: (user: User | null) => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  error: null,
  updateProfileImage: () => {},
  setUser: () => {},
});

// Auth Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Create the AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        // Get token from localStorage
        const storedToken = localStorage.getItem('token');
        
        if (!storedToken) {
          setLoading(false);
          return;
        }

        setToken(storedToken);
        
        // Fetch user data
        const response = await fetch('http://localhost:5000/api/users/current', {
          headers: {
            'Authorization': storedToken
          },
          credentials: 'include' // Important for cookies
        });

        if (response.ok) {
          const userData = await response.json();
          
          // If the user doesn't have a profile image in the backend,
          // check localStorage as a fallback
          if (!userData.profileImage || !userData.profileImage.url) {
            const savedProfileImage = localStorage.getItem('profileImage');
            if (savedProfileImage) {
              const parsedImage = JSON.parse(savedProfileImage);
              userData.profileImage = parsedImage;
              
              // Upload the localStorage image to the backend for future persistence
              try {
                const updateResponse = await fetch('http://localhost:5000/api/users/profile', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': storedToken,
                    'x-auth-token': storedToken
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    profileImage: parsedImage
                  })
                });
                
                if (!updateResponse.ok) {
                  console.error('Failed to sync profile image to server');
                }
              } catch (syncError) {
                console.error('Error syncing profile image:', syncError);
              }
            }
          }
          
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // If token is invalid, clear storage
          console.error('Invalid token or authentication error:', response.status);
          localStorage.removeItem('token');
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Authentication error:', err);
        // Clear invalid token on error
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Update profile image
  const updateProfileImage = async (imageData: { url: string; publicId: string }) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token || !user) {
        console.error('No token or user found, cannot update profile image');
        return;
      }
      
      // First update the local state for immediate UI feedback
      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          profileImage: imageData
        };
      });
      
      // Then send update to the backend
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
          'x-auth-token': token
        },
        credentials: 'include',
        body: JSON.stringify({
          profileImage: imageData
        })
      });
      
      if (!response.ok) {
        // If the backend update fails, we still keep the local update for UX
        console.error('Failed to update profile image on server:', await response.text());
      } else {
        console.log('Profile image updated on server successfully');
        
        // Store in localStorage as backup/cache
        localStorage.setItem('profileImage', JSON.stringify(imageData));
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token to localStorage
      localStorage.setItem('token', data.token);
      setToken(data.token);

      // Fetch user data
      const userResponse = await fetch('http://localhost:5000/api/users/current', {
        headers: {
          'Authorization': data.token
        },
        credentials: 'include'
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        // Only check local storage if the user doesn't have a profile image from backend
        if (!userData.profileImage || !userData.profileImage.url) {
          const savedProfileImage = localStorage.getItem('profileImage');
          if (savedProfileImage) {
            const parsedImage = JSON.parse(savedProfileImage);
            userData.profileImage = parsedImage;
            
            // Upload the profile image to backend for future use
            try {
              const updateResponse = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': data.token,
                  'x-auth-token': data.token
                },
                credentials: 'include',
                body: JSON.stringify({
                  profileImage: parsedImage
                })
              });
              
              if (!updateResponse.ok) {
                console.error('Failed to sync profile image to server during login');
              }
            } catch (syncError) {
              console.error('Error syncing profile image during login:', syncError);
            }
          }
        }
        
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      console.error('Login error:', err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Register user - updated to work with the email verification flow
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // With email verification, user should already exist in database with verified email
      // Just need to login now
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setError(null);
    
    // Call backend logout endpoint
    fetch('http://localhost:5000/api/auth/logout', {
      credentials: 'include'
    }).catch(err => {
      console.error('Logout error:', err);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        error,
        updateProfileImage,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 