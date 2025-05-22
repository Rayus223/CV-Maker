import { CVData } from '../types/types';

interface CVProject {
  id: string;
  name: string;
  description?: string;
  data: CVData;
  createdAt: string;
  updatedAt: string;
  thumbnail?: {
    url: string;
    publicId: string;
  };
}

// Base URL for API calls
const API_URL = 'http://localhost:5000/api';

// Helper functions for localStorage fallback
const getLocalProjects = (): CVProject[] => {
  try {
    const localProjects = localStorage.getItem('cv-projects');
    return localProjects ? JSON.parse(localProjects) : [];
  } catch (error) {
    console.error('Error reading local projects:', error);
    return [];
  }
};

const saveLocalProjects = (projects: CVProject[]) => {
  try {
    localStorage.setItem('cv-projects', JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving local projects:', error);
  }
};

const generateUniqueId = () => {
  return 'local-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
};

/**
 * Save a CV project to the user's account
 * @param cvData The CV data to save
 * @param name The name of the project
 * @param description Optional description of the project
 * @param thumbnail Optional thumbnail image
 */
export const saveCV = async (
  cvData: CVData,
  name: string,
  description?: string,
  thumbnail?: { url: string; publicId: string }
): Promise<CVProject> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      // No token, use localStorage fallback
      return saveToLocalStorage(cvData, name, description, thumbnail);
    }

    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
          'x-auth-token': token
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          description,
          data: cvData,
          thumbnail
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save CV: ${response.statusText}`);
      }

      const savedProject = await response.json();
      return savedProject;
    } catch (error) {
      console.error('Error saving CV to server, using localStorage fallback:', error);
      return saveToLocalStorage(cvData, name, description, thumbnail);
    }
  } catch (error) {
    console.error('Error saving CV:', error);
    throw error;
  }
};

/**
 * Save CV to localStorage as fallback
 */
const saveToLocalStorage = (
  cvData: CVData,
  name: string,
  description?: string,
  thumbnail?: { url: string; publicId: string }
): CVProject => {
  const now = new Date().toISOString();
  const id = generateUniqueId();
  
  const newProject: CVProject = {
    id,
    name,
    description,
    data: cvData,
    createdAt: now,
    updatedAt: now,
    thumbnail
  };
  
  const projects = getLocalProjects();
  projects.push(newProject);
  saveLocalProjects(projects);
  
  return newProject;
};

/**
 * Update an existing CV project
 * @param id Project ID to update
 * @param cvData Updated CV data
 * @param name Updated name (optional)
 * @param description Updated description (optional)
 * @param thumbnail Updated thumbnail (optional)
 */
export const updateCV = async (
  id: string,
  cvData: CVData,
  name?: string,
  description?: string,
  thumbnail?: { url: string; publicId: string }
): Promise<CVProject> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      // No token, use localStorage fallback
      return updateInLocalStorage(id, cvData, name, description, thumbnail);
    }

    try {
      const updateData: any = { data: cvData };
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (thumbnail) updateData.thumbnail = thumbnail;

      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
          'x-auth-token': token
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update CV: ${response.statusText}`);
      }

      const updatedProject = await response.json();
      return updatedProject;
    } catch (error) {
      console.error('Error updating CV on server, using localStorage fallback:', error);
      return updateInLocalStorage(id, cvData, name, description, thumbnail);
    }
  } catch (error) {
    console.error('Error updating CV:', error);
    throw error;
  }
};

/**
 * Update CV in localStorage as fallback
 */
const updateInLocalStorage = (
  id: string,
  cvData: CVData,
  name?: string,
  description?: string,
  thumbnail?: { url: string; publicId: string }
): CVProject => {
  const projects = getLocalProjects();
  const projectIndex = projects.findIndex(project => project.id === id);
  
  if (projectIndex >= 0) {
    // Update existing project
    const updatedProject = { ...projects[projectIndex] };
    updatedProject.data = cvData;
    updatedProject.updatedAt = new Date().toISOString();
    
    if (name) updatedProject.name = name;
    if (description !== undefined) updatedProject.description = description;
    if (thumbnail) updatedProject.thumbnail = thumbnail;
    
    projects[projectIndex] = updatedProject;
    saveLocalProjects(projects);
    
    return updatedProject;
  } else {
    // Project not found, create new one
    return saveToLocalStorage(cvData, name || 'Untitled CV', description, thumbnail);
  }
};

/**
 * Get a list of all CV projects for the current user
 */
export const getUserCVs = async (): Promise<CVProject[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      // No token, use localStorage fallback
      return getLocalProjects();
    }

    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'x-auth-token': token
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CVs: ${response.statusText}`);
      }

      const projects = await response.json();
      
      // Also get local projects and merge them
      const localProjects = getLocalProjects();
      const serverProjectIds = new Set(projects.map((p: CVProject) => p.id));
      const uniqueLocalProjects = localProjects.filter(p => !serverProjectIds.has(p.id));
      
      // Return both server and unique local projects
      return [...projects, ...uniqueLocalProjects];
    } catch (error) {
      console.error('Error fetching CVs from server, using localStorage fallback:', error);
      return getLocalProjects();
    }
  } catch (error) {
    console.error('Error fetching CVs:', error);
    throw error;
  }
};

/**
 * Get a specific CV project by ID
 * @param id The project ID to fetch
 */
export const getCVById = async (id: string): Promise<CVProject> => {
  try {
    // First check if this is a local-only project (starts with 'local-')
    if (id.startsWith('local-')) {
      const localProjects = getLocalProjects();
      const localProject = localProjects.find(p => p.id === id);
      if (localProject) {
        return localProject;
      }
      throw new Error(`Local project with ID ${id} not found`);
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      // No token, check localStorage
      const localProjects = getLocalProjects();
      const localProject = localProjects.find(p => p.id === id);
      if (localProject) {
        return localProject;
      }
      throw new Error('No authentication token found and project not in local storage');
    }

    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'x-auth-token': token
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CV: ${response.statusText}`);
      }

      const project = await response.json();
      return project;
    } catch (error) {
      console.error('Error fetching CV from server, checking localStorage:', error);
      // Try to find in localStorage as fallback
      const localProjects = getLocalProjects();
      const localProject = localProjects.find(p => p.id === id);
      if (localProject) {
        return localProject;
      }
      throw new Error(`Project with ID ${id} not found`);
    }
  } catch (error) {
    console.error('Error fetching CV:', error);
    throw error;
  }
};

/**
 * Delete a CV project
 * @param id The project ID to delete
 */
export const deleteCV = async (id: string): Promise<void> => {
  try {
    // If it's a local project, just remove from localStorage
    if (id.startsWith('local-')) {
      const localProjects = getLocalProjects();
      const filteredProjects = localProjects.filter(p => p.id !== id);
      saveLocalProjects(filteredProjects);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      // No token, use localStorage anyway
      const localProjects = getLocalProjects();
      const filteredProjects = localProjects.filter(p => p.id !== id);
      saveLocalProjects(filteredProjects);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token,
          'x-auth-token': token
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete CV: ${response.statusText}`);
      }
      
      // Also remove from localStorage if it exists there
      const localProjects = getLocalProjects();
      const filteredProjects = localProjects.filter(p => p.id !== id);
      saveLocalProjects(filteredProjects);
    } catch (error) {
      console.error('Error deleting CV from server, updating localStorage only:', error);
      // Remove from localStorage as fallback
      const localProjects = getLocalProjects();
      const filteredProjects = localProjects.filter(p => p.id !== id);
      saveLocalProjects(filteredProjects);
    }
  } catch (error) {
    console.error('Error deleting CV:', error);
    throw error;
  }
}; 