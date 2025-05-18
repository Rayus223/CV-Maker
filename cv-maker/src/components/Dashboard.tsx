import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import RecentProjectsSidebar from './RecentProjectsSidebar';
import OtherFieldForm from './OtherFieldForm';
import ImageUploader from './ImageUploader';
import { CVData, sampleData } from '../types/types';
import TemplateCard from './TemplateCard';
import { getFeaturedTemplates } from '../services/templateService';
import WelcomePopup from './WelcomePopup';
import DashboardTour from './DashboardTour';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [otherField, setOtherField] = useState<string>(sampleData.otherField || '');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  // Empty projects array for new users
  const recentProjects: CVData['recentProjects'] = [];

  // Get featured templates
  const featuredTemplates = getFeaturedTemplates();

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
    console.log(`Opening project ${index}`);
    navigate(`/cv-editor?project=${index}`);
  };

  const handleImageUploaded = (imageData: { url: string; publicId: string }) => {
    console.log('Profile image uploaded:', imageData);
    // In a real application, you would update user profile with this image
  };

  const handleWelcomeClose = (startTour: boolean) => {
    setShowWelcome(false);
    if (startTour) {
      setShowTour(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
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
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-brand-primary">CV Maker</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user?.name || 'GenX Sportz'}</span>
            <button
              onClick={logout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-dark transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left sidebar - Recent Projects */}
            <div className="w-full md:w-1/3 lg:w-1/4">
              <div className="recent-projects">
                <RecentProjectsSidebar 
                  recentProjects={recentProjects} 
                  onProjectClick={handleProjectClick} 
                />
              </div>
              
              <div className="mt-6 bg-white p-5 rounded-lg shadow-sm profile-section">
                <h3 className="text-lg font-medium mb-3">Your Profile</h3>
                <div className="mb-4">
                  <ImageUploader
                    currentImage={null}
                    onImageUploaded={handleImageUploaded}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="mt-3 text-center">
                  <h4 className="font-medium">{user?.name || 'GenX Sportz'}</h4>
                  <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="w-full md:w-2/3 lg:w-3/4">
              {/* Welcome card */}
              <div className="bg-white overflow-hidden shadow rounded-lg p-6 mb-6">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Welcome to CV Maker
                  </h2>
                  <p className="text-gray-600 text-center max-w-2xl">
                    Create and customize your professional CV. Our easy-to-use platform helps you build a standout resume that gets noticed by employers.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-4">
                    <Link
                      to="/cv-editor"
                      className="create-cv-button px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-primary hover:bg-brand-dark transition-colors duration-200 shadow-sm"
                    >
                      Create New CV
                    </Link>
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
              <div className="templates-section bg-white shadow rounded-lg p-6 mb-6">
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
              
              {/* Other Field Form */}
              <div className="mb-6">
                <OtherFieldForm 
                  value={otherField} 
                  onChange={setOtherField} 
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-brand-primary font-bold text-lg">CV Maker</h3>
              <p className="text-sm text-gray-500">Create professional CVs in minutes</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-brand-primary">About</a>
              <a href="#" className="text-gray-500 hover:text-brand-primary">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-brand-primary">Terms</a>
              <a href="#" className="text-gray-500 hover:text-brand-primary">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard; 