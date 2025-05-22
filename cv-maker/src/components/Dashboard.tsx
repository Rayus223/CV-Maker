import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import RecentProjectsSidebar from './RecentProjectsSidebar';
import ImageUploader from './ImageUploader';
import { CVData } from '../types/types';
import TemplateCard from './TemplateCard';
import { getFeaturedTemplates } from '../services/templateService';
import { getUserCVs } from '../services/cvService';
import WelcomePopup from './WelcomePopup';
import DashboardTour from './DashboardTour';

const Dashboard: React.FC = () => {
  const { user, logout, isAuthenticated, updateProfileImage, setUser } = useAuth();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(true);
  const [activeNav, setActiveNav] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [userProjects, setUserProjects] = useState<CVData['recentProjects']>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get featured templates
  const featuredTemplates = getFeaturedTemplates();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch user's projects when authenticated
  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoadingProjects(true);
        const projects = await getUserCVs();
        
        // Transform the projects to the format expected by RecentProjectsSidebar
        const transformedProjects = projects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
          image: project.thumbnail,
          updatedAt: project.updatedAt
        }));
        
        // Sort by updated date (newest first)
        transformedProjects.sort((a, b) => {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        
        setUserProjects(transformedProjects);
      } catch (error) {
        console.error('Failed to fetch user projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    
    fetchUserProjects();
  }, [isAuthenticated]);

  // Check if user has profile image
  useEffect(() => {
    if (user?.profileImage) {
      setShowImageUploader(false);
    } else {
      setShowImageUploader(true);
    }
  }, [user?.profileImage]);

  // Initialize name and email form when user changes
  useEffect(() => {
    if (user) {
      setNewName(user.name || '');
      setNewEmail(user.email || '');
    }
  }, [user]);

  // Check if user is new and show welcome popup
  useEffect(() => {
    if (user?.id) {
      const hasSeenWelcome = localStorage.getItem(`hasSeenWelcome_${user.id}`);
      if (!hasSeenWelcome) {
        setShowWelcome(true);
        localStorage.setItem(`hasSeenWelcome_${user.id}`, 'true');
      }
    }
  }, [user?.id]);

  const handleProjectClick = (index: number) => {
    // Navigate to project details page or open project in editor
    const projectId = userProjects[index]?.id;
    if (projectId) {
      navigate(`/canva-editor?project=${projectId}`);
    }
  };

  const handleImageUploaded = (imageData: { url: string; publicId: string }) => {
    console.log('Profile image uploaded:', imageData);
    // Update user profile with the new image
    updateProfileImage(imageData);
    // Hide image uploader
    setShowImageUploader(false);
  };

  const handleRemoveImage = async () => {
    try {
      // Remove the profile image by setting it to an empty object
      await updateProfileImage({ url: '', publicId: '' });
      
      // Show the image uploader again
      setShowImageUploader(true);
    } catch (error) {
      console.error('Error removing profile image:', error);
    }
  };

  const handleWelcomeClose = (startTour: boolean) => {
    setShowWelcome(false);
    if (startTour) {
      setShowTour(true);
    }
  };

  // Navigation handler
  const handleNavClick = (navItem: string) => {
    if (navItem === 'settings') {
      setShowSettings(true);
    } else {
      setActiveNav(navItem);
      setShowSettings(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found, cannot update profile');
        return;
      }
      
      // Send profile update to the backend
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
          'x-auth-token': token
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newName,
          email: newEmail
        })
      });
      
      if (!response.ok) {
        console.error('Failed to update profile:', await response.text());
        // You could add error handling here, like showing an error message
      } else {
        // Update the user data in the context/state
        const updatedUser = await response.json();
        setUser(updatedUser);
        setShowSettings(false);
        console.log('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // You could add error handling here, like showing an error message
    }
  };

  // Handle create CV button click to show the popup
  const handleCreateCVClick = () => {
    setShowCreateOptions(true);
  };

  // Handle option selection
  const handleCreateOptionSelect = (option: 'scratch' | 'template') => {
    setShowCreateOptions(false);
    
    if (option === 'scratch') {
      // Navigate to blank editor
      navigate('/canva-editor?blank=true');
    } else {
      // Navigate to templates page
      navigate('/templates');
    }
  };

  // Add this function to refresh projects
  const refreshProjects = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsRefreshing(true);
      setIsLoadingProjects(true);
      
      const projects = await getUserCVs();
      
      // Transform the projects to the format expected by RecentProjectsSidebar
      const transformedProjects = projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        image: project.thumbnail,
        updatedAt: project.updatedAt
      }));
      
      // Sort by updated date (newest first)
      transformedProjects.sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      setUserProjects(transformedProjects);
    } catch (error) {
      console.error('Failed to fetch user projects:', error);
    } finally {
      setIsLoadingProjects(false);
      setIsRefreshing(false);
    }
  };

  // Modify the existing useEffect to use the new refreshProjects function
  useEffect(() => {
    refreshProjects();
  }, [isAuthenticated]);

  // If not authenticated, show loading spinner instead of dashboard
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar Navigation */}
      <div className="bg-white shadow-md w-16 fixed h-full z-20 flex flex-col items-center py-6">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo/Brand Icon */}
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-primary" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>

          {/* Home Icon */}
          <button 
            onClick={() => handleNavClick('home')}
            className={`p-3 rounded-xl transition-all ${activeNav === 'home' ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          
          {/* Templates Icon */}
          <button 
            onClick={() => handleNavClick('templates')}
            className={`p-3 rounded-xl transition-all ${activeNav === 'templates' ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Templates"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </button>
          
          {/* Create New CV Icon */}
          <button 
            onClick={handleCreateCVClick}
            className="p-3 rounded-xl transition-all bg-gray-100 text-gray-800 hover:bg-gray-200"
            title="Create New CV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          {/* Projects Icon */}
          <button 
            onClick={() => handleNavClick('projects')}
            className={`p-3 rounded-xl transition-all ${activeNav === 'projects' ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="My Projects"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
          
          {/* Profile Icon */}
          <button 
            onClick={() => handleNavClick('profile')}
            className={`p-3 rounded-xl transition-all ${activeNav === 'profile' ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
        
        {/* Bottom Nav Items */}
        <div className="mt-auto flex flex-col items-center space-y-6">
          {/* Help Icon */}
          <button 
            onClick={() => handleNavClick('help')}
            className={`p-3 rounded-xl transition-all ${activeNav === 'help' ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Help & FAQ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {/* Settings Icon */}
          <button 
            onClick={() => handleNavClick('settings')}
            className={`p-3 rounded-xl transition-all ${showSettings ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 ml-16"> {/* Add margin to account for fixed sidebar */}
        {showWelcome && (
          <WelcomePopup
            onClose={handleWelcomeClose}
            userName={user?.name}
          />
        )}

        <DashboardTour 
          isOpen={showTour}
          onClose={() => setShowTour(false)}
        />
        
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">CV Maker</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {user?.profileImage?.url ? (
                  <div className="h-10 w-10 rounded-full overflow-hidden mr-3 ring-2 ring-gray-200">
                    <img 
                      src={user.profileImage.url} 
                      alt={user?.name || 'Profile'} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-600 text-white flex items-center justify-center mr-3">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-gray-700">Welcome, {user?.name || 'User'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Settings Panel */}
        {showSettings && (
          <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Settings</h2>
              
              <div className="space-y-8">
                {/* Profile Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-light focus:border-brand-light"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-light focus:border-brand-light"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Profile Image Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Profile Picture</h3>
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      {user?.profileImage?.url ? (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                          <img
                            src={user.profileImage.url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-600 text-white flex items-center justify-center text-2xl">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="mb-4">
                        <ImageUploader
                          currentImage={user?.profileImage || null}
                          onImageUploaded={handleImageUploaded}
                          className="w-full object-cover"
                        />
                      </div>
                      {user?.profileImage?.url && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-600 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                          Remove Profile Picture
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Account Actions Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Account</h3>
                  <div className="space-y-4">
                    <button
                      onClick={logout}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 border-t border-gray-200 pt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-dark focus:outline-none"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content (only show if settings not open) */}
        {!showSettings && (
          <main>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left sidebar - Recent Projects */}
                <div className="w-full md:w-1/3 lg:w-1/4">
                  <div className="recent-projects">
                    <RecentProjectsSidebar 
                      recentProjects={userProjects} 
                      onProjectClick={handleProjectClick}
                      createCV={handleCreateCVClick}
                      isLoading={isLoadingProjects}
                      onRefresh={refreshProjects}
                      isRefreshing={isRefreshing}
                    />
                  </div>
                  
                  <div className="mt-6 bg-white p-5 rounded-lg shadow-sm profile-section">
                    <h3 className="text-lg font-medium mb-3">Your Profile</h3>
                    {user?.profileImage?.url ? (
                      <div className="mb-4 relative rounded-lg overflow-hidden border border-gray-200 aspect-square">
                        <img 
                          src={user.profileImage.url} 
                          alt={user?.name || 'Profile'} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-50 transition-opacity">
                          <div className="space-x-2">
                            <button
                              type="button"
                              onClick={() => setShowImageUploader(true)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {showImageUploader && (
                          <div className="mb-4">
                            <ImageUploader
                              currentImage={user?.profileImage || null}
                              onImageUploaded={handleImageUploaded}
                              className="w-full aspect-square object-cover"
                            />
                          </div>
                        )}
                        <div className="mt-3 text-center">
                          <h4 className="font-medium">{user?.name || 'User'}</h4>
                          <p className="text-sm text-gray-500">{user?.email || ''}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Main content area */}
                <div className="w-full md:w-2/3 lg:w-3/4">
                  {/* Welcome card */}
                  <div className="bg-white overflow-hidden shadow-sm rounded-lg p-6 mb-6">
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <h2 className="text-2xl font-semibold text-gray-900">
                        Welcome to CV Maker
                      </h2>
                      <p className="text-gray-600 text-center max-w-2xl">
                        Create and customize your professional CV. Our easy-to-use platform helps you build a standout resume that gets noticed by employers.
                      </p>
                      <div className="mt-6 flex flex-wrap justify-center gap-4">
                        <button
                          onClick={handleCreateCVClick}
                          className="create-cv-button px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-primary hover:bg-brand-dark transition-colors duration-200 shadow-sm"
                        >
                          Create New CV
                        </button>
                        <Link
                          to="/templates"
                          className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-brand-primary bg-white border-brand-primary hover:bg-gray-50 transition-colors duration-200 shadow-sm"
                        >
                          Browse Templates
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Featured templates - E-commerce style */}
                  <div className="templates-section bg-white shadow-sm rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Templates</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {featuredTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          id={template.id}
                          name={template.name}
                          description={template.description}
                          thumbnail={template.thumbnail}
                          popular={template.popular}
                          isPremium={template.isPremium}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h3 className="text-gray-700 font-bold text-lg">CV Maker</h3>
                <p className="text-sm text-gray-500">Create professional CVs in minutes</p>
              </div>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-500 hover:text-gray-700">About</a>
                <a href="#" className="text-gray-500 hover:text-gray-700">Privacy</a>
                <a href="#" className="text-gray-500 hover:text-gray-700">Terms</a>
                <a href="#" className="text-gray-500 hover:text-gray-700">Contact</a>
              </div>
            </div>
          </div>
        </footer>

        {showCreateOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New CV</h3>
              <div className="space-y-4">
                <button
                  onClick={() => handleCreateOptionSelect('scratch')}
                  className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-3 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-medium">Start from scratch</div>
                      <p className="text-sm text-gray-500">Begin with a blank canvas</p>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <button
                  onClick={() => handleCreateOptionSelect('template')}
                  className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-3 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-medium">Use existing template</div>
                      <p className="text-sm text-gray-500">Choose from professional templates</p>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCreateOptions(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 