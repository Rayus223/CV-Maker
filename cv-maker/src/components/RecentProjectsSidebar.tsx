import React from 'react';
import { CVData } from '../types/types';

interface RecentProjectsSidebarProps {
  recentProjects: CVData['recentProjects'];
  onProjectClick: (index: number) => void;
}

const RecentProjectsSidebar: React.FC<RecentProjectsSidebarProps> = ({ recentProjects, onProjectClick }) => {
  if (!recentProjects || recentProjects.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Projects</h3>
        <p className="text-gray-500 text-sm">No recent projects to display.</p>
      </div>
    );
  }

  return (
    <aside className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-brand-primary text-white p-4">
        <h3 className="text-lg font-semibold">Recent Projects</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {recentProjects.map((project, index) => (
          <div 
            key={index} 
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

      <div className="p-4 bg-gray-50 text-center">
        <button 
          className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition"
        >
          Browse All Projects
        </button>
      </div>
    </aside>
  );
};

export default RecentProjectsSidebar; 