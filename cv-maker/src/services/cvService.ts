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
      throw new Error('Authentication required to save CV. Please log in.');
    }

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
    console.error('Error saving CV:', error);
    throw error;
  }
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
      throw new Error('Authentication required to update CV. Please log in.');
    }

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
    console.error('Error updating CV:', error);
    throw error;
  }
};

/**
 * Get a list of all CV projects for the current user
 */
export const getUserCVs = async (): Promise<CVProject[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return []; // Return empty array if not authenticated
    }

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
    return projects;
  } catch (error) {
    console.error('Error fetching CVs:', error);
    return []; // Return empty array on error
  }
};

/**
 * Get a specific CV project by ID
 * @param id The project ID to fetch
 */
export const getCVById = async (id: string): Promise<CVProject> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required to get CV. Please log in.');
    }

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
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required to delete CV. Please log in.');
    }

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
  } catch (error) {
    console.error('Error deleting CV:', error);
    throw error;
  }
}; 