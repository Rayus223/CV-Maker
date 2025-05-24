import { CVData } from '../types/types';

export interface CVProject {
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

    // Log size of data being saved
    const requestData = {
      name,
      description,
      data: cvData,
      thumbnail
    };
    const dataSize = JSON.stringify(requestData).length;
    console.log(`Saving new CV "${name}" - data size: ${dataSize} bytes`);
    
    if (cvData.customTextElements) {
      console.log(`CV contains ${Object.keys(cvData.customTextElements).length} custom text elements`);
    }
    
    if (cvData.elementStyles) {
      console.log(`CV contains ${cvData.elementStyles.length} element styles`);
    }

    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'x-auth-token': token
      },
      credentials: 'include',
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to save CV: Status ${response.status}, Response:`, errorText);
      throw new Error(`Failed to save CV: ${response.statusText} - ${errorText}`);
    }

    const savedProject = await response.json();
    console.log("New CV saved successfully, ID:", savedProject.id);
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
    // Check if the ID is valid
    if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
      console.log('Invalid project ID provided to updateCV. Creating new project instead.');
      return saveCV(cvData, name || 'Untitled Project', description, thumbnail);
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required to update CV. Please log in.');
    }

    const updateData: any = { data: cvData };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (thumbnail) updateData.thumbnail = thumbnail;

    // Log size of data being saved
    const dataSize = JSON.stringify(updateData).length;
    console.log(`Updating CV ${id} - data size: ${dataSize} bytes`);
    
    if (cvData.customTextElements) {
      console.log(`CV contains ${Object.keys(cvData.customTextElements).length} custom text elements`);
    }
    
    if (cvData.elementStyles) {
      console.log(`CV contains ${cvData.elementStyles ? cvData.elementStyles.length : 0} element styles`);
    }

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
      const errorText = await response.text();
      console.error(`Failed to update CV: Status ${response.status}, Response:`, errorText);
      
      // If project not found, create a new one
      if (response.status === 404 || response.status === 400) {
        console.log('Project not found or invalid ID. Creating new project instead.');
        return saveCV(cvData, name || 'Untitled Project', description, thumbnail);
      }
      
      throw new Error(`Failed to update CV: ${response.statusText} - ${errorText}`);
    }

    const updatedProject = await response.json();
    console.log("CV updated successfully:", id);
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
      console.log("No token found, returning mock data");
      // Return mock data with proper IDs for testing
      return [
        {
          id: `mock-${Date.now()}-1`,
          name: "hello",
          description: "",
          data: {} as CVData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          thumbnail: { url: "", publicId: "" }
        },
        {
          id: `mock-${Date.now()}-2`,
          name: "Ho is this",
          description: "Sample CV",
          data: {} as CVData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          thumbnail: { url: "", publicId: "" }
        }
      ];
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
    
    // Ensure all projects have IDs
    return projects.map((project: any) => ({
      ...project,
      id: project.id || `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
  } catch (error) {
    console.error('Error fetching CVs:', error);
    // Return mock data with proper IDs if there's an error
    return [
      {
        id: `error-mock-${Date.now()}-1`,
        name: "Error Fallback CV",
        description: "Created when API failed",
        data: {} as CVData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thumbnail: { url: "", publicId: "" }
      }
    ];
  }
};

/**
 * Get a specific CV project by ID
 * @param id The project ID to fetch
 */
export const getCVById = async (id: string): Promise<CVProject> => {
  try {
    console.log(`Fetching CV with ID: ${id}`);
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
      const errorText = await response.text();
      console.error(`Failed to fetch CV: Status ${response.status}, Response:`, errorText);
      throw new Error(`Failed to fetch CV: ${response.statusText} - ${errorText}`);
    }

    const project = await response.json();
    
    // Log what we're getting back
    console.log(`CV "${project.name}" fetched successfully`);
    console.log(`Data contains ${Object.keys(project.data).length} keys`);
    
    if (project.data.customTextElements) {
      console.log(`CV contains ${Object.keys(project.data.customTextElements).length} custom text elements`);
    } else {
      console.log(`CV contains NO custom text elements`);
    }
    
    if (project.data.elementStyles) {
      console.log(`CV contains ${project.data.elementStyles.length} element styles`);
    } else {
      console.log(`CV contains NO element styles`);
    }
    
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