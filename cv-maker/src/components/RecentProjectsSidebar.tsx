import React from 'react';
import { CVData } from '../types/types';

interface RecentProjectsSidebarProps {
  recentProjects: (CVData['recentProjects'][0] & { id?: string, updatedAt?: string })[];
  onProjectClick: (index: number) => void;
  createCV?: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const RecentProjectsSidebar: React.FC<RecentProjectsSidebarProps> = ({ 
  recentProjects, 
  onProjectClick, 
  createCV,
  isLoading = false,
  onRefresh,
  isRefreshing = false
}) => {
  const renderCreateCVButton = () => (
    <div className="p-4 bg-gray-50 text-center border-t border-gray-200">
      <button 
        className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition"
        onClick={createCV || (() => window.location.href = '/cv-editor')}
      >
        Create New CV
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium text-brand-primary">Recent Projects</h3>
          {onRefresh && (
            <button 
              onClick={onRefresh} 
              disabled={isRefreshing || isLoading}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
              title="Refresh projects"
            >
              <svg className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
        <div className="py-8 text-center">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
          <p className="mt-4 text-gray-500">Loading your projects...</p>
        </div>
        {renderCreateCVButton()}
      </div>
    );
  }

  if (!recentProjects || recentProjects.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium text-brand-primary">Recent Projects</h3>
          {onRefresh && (
            <button 
              onClick={onRefresh} 
              disabled={isRefreshing}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
              title="Refresh projects"
            >
              <svg className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
        <div className="py-8 text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </div>
          <h4 className="font-medium text-gray-800 mb-2">Your beautiful projects will land here</h4>
          <p className="text-gray-500 text-sm mb-4">Create your first CV to get started on your professional journey</p>
        </div>
        {renderCreateCVButton()}
      </div>
    );
  }

  return (
    <aside className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-brand-primary text-white p-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recent Projects</h3>
        {onRefresh && (
          <button 
            onClick={onRefresh} 
            disabled={isRefreshing}
            className="p-1.5 rounded-full hover:bg-brand-dark text-white disabled:opacity-50"
            title="Refresh projects"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {isRefreshing && (
          <div className="py-2 px-4 bg-blue-50 text-xs text-blue-600 flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
            Refreshing projects...
          </div>
        )}
        {recentProjects.map((project, index) => (
          <div 
            key={project.id || index} 
            className="p-4 hover:bg-gray-50 transition cursor-pointer"
            onClick={() => onProjectClick(index)}
          >
            {project.image && (
              <div className="mb-2 aspect-video overflow-hidden rounded">
                <img 
                  src={project.image.url} 
                  alt={project.name} 
                  className="w-full h-full object-cover transition transform hover:scale-105"
                />
              </div>
            )}
            <h4 className="font-medium text-gray-900">{project.name}</h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
            {project.updatedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Updated: {new Date(project.updatedAt).toLocaleDateString()}
              </p>
            )}
            {project.id && project.id.startsWith('local-') && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                Local
              </span>
            )}
            {project.link && (
              <a 
                href={project.link} 
                target="_blank" 
                rel="noreferrer" 
                className="text-brand-primary text-sm mt-2 inline-block hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View Project
              </a>
            )}
          </div>
        ))}
      </div>

      {renderCreateCVButton()}
    </aside>
  );
};

export default RecentProjectsSidebar; 