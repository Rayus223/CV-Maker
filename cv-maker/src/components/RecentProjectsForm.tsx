import React, { useState } from 'react';
import { CVData } from '../types/types';
import ImageUploader from './ImageUploader';

interface RecentProjectsFormProps {
  recentProjects: CVData['recentProjects'];
  onChange: (recentProjects: CVData['recentProjects']) => void;
}

const RecentProjectsForm: React.FC<RecentProjectsFormProps> = ({ 
  recentProjects = [], 
  onChange 
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  
  const [form, setForm] = useState<{
    name: string;
    description: string;
    link?: string;
    image?: {
      url: string;
      publicId: string;
    };
  }>({
    name: '',
    description: '',
    link: '',
    image: undefined
  });

  const openAddModal = () => {
    setEditingIndex(null);
    setForm({
      name: '',
      description: '',
      link: '',
      image: undefined
    });
    setShowModal(true);
  };

  const openEditModal = (index: number) => {
    const project = recentProjects[index];
    setEditingIndex(index);
    setForm({
      name: project.name,
      description: project.description,
      link: project.link || '',
      image: project.image
    });
    setShowModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUploaded = (imageData: { url: string; publicId: string }) => {
    setForm(prev => ({
      ...prev,
      image: imageData
    }));
  };

  const handleImageDeleted = () => {
    setForm(prev => ({
      ...prev,
      image: undefined
    }));
  };

  const saveProject = () => {
    if (!form.name || !form.description) {
      return; // Don't save if required fields are missing
    }

    const newProject = {
      name: form.name,
      description: form.description,
      link: form.link ? form.link : undefined,
      image: form.image
    };

    if (editingIndex !== null) {
      // Edit existing project
      const updatedProjects = [...recentProjects];
      updatedProjects[editingIndex] = newProject;
      onChange(updatedProjects);
    } else {
      // Add new project
      onChange([...recentProjects, newProject]);
    }

    setShowModal(false);
  };

  const deleteProject = (index: number) => {
    const updatedProjects = recentProjects.filter((_, i) => i !== index);
    onChange(updatedProjects);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium text-gray-900">Recent Projects</h3>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-dark transition"
        >
          Add Project
        </button>
      </div>

      {recentProjects.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No recent projects added yet.</p>
          <button
            onClick={openAddModal}
            className="mt-3 text-brand-primary hover:underline"
          >
            Add your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentProjects.map((project, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
              {project.image && (
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={project.image.url} 
                    alt={project.name}
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
              <div className="p-4">
                <h4 className="font-medium text-lg">{project.name}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                
                <div className="mt-4 flex justify-between items-center">
                  {project.link && (
                    <a 
                      href={project.link}
                      target="_blank" 
                      rel="noreferrer"
                      className="text-brand-primary text-sm hover:underline"
                    >
                      View Project
                    </a>
                  )}
                  <div className="ml-auto space-x-2">
                    <button
                      onClick={() => openEditModal(index)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProject(index)}
                      className="px-3 py-1 text-sm border border-red-300 text-red-500 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Project Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingIndex !== null ? 'Edit Project' : 'Add New Project'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Link
                </label>
                <input
                  type="url"
                  id="link"
                  name="link"
                  value={form.link || ''}
                  onChange={handleFormChange}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Image
                </label>
                <ImageUploader
                  currentImage={form.image}
                  onImageUploaded={handleImageUploaded}
                  onImageDeleted={handleImageDeleted}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveProject}
                className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark"
                disabled={!form.name || !form.description}
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentProjectsForm; 