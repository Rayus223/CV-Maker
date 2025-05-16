import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-brand-primary">CV Maker</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user?.name}</span>
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
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white overflow-hidden shadow rounded-lg p-6">
              <div className="flex flex-col items-center justify-center space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Welcome to CV Maker
                </h2>
                <p className="text-gray-600 text-center max-w-2xl">
                  Create and customize your professional CV. Our easy-to-use platform helps you build a standout resume that gets noticed by employers.
                </p>
                <div className="mt-6 flex space-x-4">
                  <Link
                    to="/cv-editor"
                    className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-primary hover:bg-brand-dark transition-colors duration-200"
                  >
                    Create New CV
                  </Link>
                  <Link
                    to="/templates"
                    className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-brand-primary bg-white border-brand-primary hover:bg-gray-50 transition-colors duration-200"
                  >
                    Browse Templates
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 