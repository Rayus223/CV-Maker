import React, { useState, useEffect, useRef } from 'react';
import { CVData, sampleData } from './types/types';
import CVTemplate from './components/CVTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useLocation, Routes, Route, BrowserRouter } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CanvaEditor from './components/CanvaEditor';

// Define a blank CV object
const blankCV: CVData = {
  firstName: '',
  lastName: '',
  pronouns: '',
  title: '',
  dob: '',
  phone: '',
  email: '',
  address: '',
  profileImage: undefined,
  skills: [],
  links: [],
  experience: [],
  education: [],
  projects: [],
  recentProjects: [],
  otherField: '',
};

function App() {
  const location = useLocation();
  // Check for blank param in URL
  const isBlank = new URLSearchParams(location.search).get('blank') === 'true';

  // Initialize with data from localStorage if available, otherwise use default
  const [step, setStep] = useState<'welcome' | 'editor'>(() => {
    const savedStep = localStorage.getItem('cvMakerStep');
    return savedStep === 'editor' ? 'editor' : 'welcome';
  });
  
  const [activeSection, setActiveSection] = useState<string>(() => {
    const savedSection = localStorage.getItem('cvMakerActiveSection');
    return savedSection || 'about';
  });
  
  // For mobile view toggle between edit form and preview
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');
  
  const [progress, setProgress] = useState<number>(20);
  
  // Initialize with blank CV if requested, otherwise use localStorage or sampleData
  const [cvData, setCvData] = useState<CVData>(() => {
    if (isBlank) return blankCV;
    const savedData = localStorage.getItem('cvMakerData');
    return savedData ? JSON.parse(savedData) : sampleData;
  });
  
  // For showing notifications
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });
  
  // Helper function to show notifications
  const showNotification = React.useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    const timer = setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Auto-save data to localStorage whenever relevant state changes
  useEffect(() => {
    localStorage.setItem('cvMakerData', JSON.stringify(cvData));
    
    // Don't show notification for the initial load
    if (Object.keys(cvData).length > 0) {
      showNotification('Auto-saving...');
    }
  }, [cvData, showNotification]);
  
  useEffect(() => {
    localStorage.setItem('cvMakerStep', step);
  }, [step]);
  
  useEffect(() => {
    localStorage.setItem('cvMakerActiveSection', activeSection);
  }, [activeSection]);
  
  // For editing education items
  const [editingEducation, setEditingEducation] = useState<number | null>(null);
  const [educationForm, setEducationForm] = useState<{
    institution: string;
    degree: string;
    location: string;
    startDate: string;
    endDate: string;
    grade?: string;
    details?: string[];
  }>({
    institution: '',
    degree: '',
    location: '',
    startDate: '',
    endDate: '',
    grade: '',
    details: ['']
  });
  
  // For adding/editing education detail items
  const [newDetail, setNewDetail] = useState<string>('');
  
  // For showing add/edit education modal
  const [showEducationModal, setShowEducationModal] = useState<boolean>(false);
  
  // For experience section
  const [editingExperience, setEditingExperience] = useState<number | null>(null);
  const [experienceForm, setExperienceForm] = useState<{
    company: string;
    position: string;
    type: string;
    startDate: string;
    endDate: string;
    tasks: string[];
  }>({
    company: '',
    position: '',
    type: '',
    startDate: '',
    endDate: '',
    tasks: ['']
  });
  
  const [newTask, setNewTask] = useState<string>('');
  const [showExperienceModal, setShowExperienceModal] = useState<boolean>(false);
  
  // For skills section
  const [editingSkill, setEditingSkill] = useState<number | null>(null);
  const [skillText, setSkillText] = useState<string>('');
  const [showSkillModal, setShowSkillModal] = useState<boolean>(false);
  
  // For projects section
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [projectForm, setProjectForm] = useState<{
    name: string;
    description: string;
    technologies: string;
    startDate: string;
    endDate: string;
    link?: string;
  }>({
    name: '',
    description: '',
    technologies: '',
    startDate: '',
    endDate: '',
    link: ''
  });
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);

  // Update progress based on filled fields
  useEffect(() => {
    let filledFields = 0;
    let totalFields = 0;
    
    // Count filled fields in basic info
    ['firstName', 'lastName', 'title', 'dob', 'phone', 'email', 'address'].forEach(field => {
      totalFields++;
      if (cvData[field as keyof typeof cvData] && String(cvData[field as keyof typeof cvData]).trim() !== '') {
        filledFields++;
      }
    });
    
    // Count arrays with content
    ['skills', 'links', 'experience', 'education'].forEach(field => {
      totalFields++;
      const array = cvData[field as keyof typeof cvData] as any[];
      if (array && array.length > 0) {
        filledFields++;
      }
    });
    
    const newProgress = Math.floor((filledFields / totalFields) * 100);
    setProgress(newProgress);
  }, [cvData]);

  const handleInputChange = (field: keyof CVData, value: any) => {
    setCvData({
      ...cvData,
      [field]: value
    });
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCvData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Education handlers
  const openAddEducationModal = () => {
    setEditingEducation(null);
    setEducationForm({
      institution: '',
      degree: '',
      location: '',
      startDate: '',
      endDate: '',
      grade: '',
      details: ['']
    });
    setShowEducationModal(true);
  };

  const openEditEducationModal = (index: number) => {
    const education = cvData.education[index];
    setEditingEducation(index);
    setEducationForm({
      institution: education.institution,
      degree: education.degree,
      location: education.location,
      startDate: education.startDate,
      endDate: education.endDate,
      grade: education.grade || '',
      details: education.details || ['']
    });
    setShowEducationModal(true);
  };

  const handleEducationFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEducationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addEducationDetail = () => {
    if (newDetail.trim()) {
      setEducationForm(prev => ({
        ...prev,
        details: [...(prev.details || []), newDetail.trim()]
      }));
      setNewDetail('');
    }
  };

  const removeEducationDetail = (index: number) => {
    setEducationForm(prev => ({
      ...prev,
      details: prev.details?.filter((_, i) => i !== index)
    }));
  };

  const saveEducation = () => {
    // Create a new education object
    const newEducation = {
      ...educationForm,
      details: educationForm.details?.filter(d => d.trim() !== '')
    };
    
    // Update the CV data
    const newEducationList = [...cvData.education];
    
    if (editingEducation !== null) {
      // Edit existing education
      newEducationList[editingEducation] = newEducation;
    } else {
      // Add new education
      newEducationList.push(newEducation);
    }
    
    setCvData(prev => ({
      ...prev,
      education: newEducationList
    }));
    
    // Close the modal
    setShowEducationModal(false);
  };

  const deleteEducation = (index: number) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Experience handlers
  const openAddExperienceModal = () => {
    setEditingExperience(null);
    setExperienceForm({
      company: '',
      position: '',
      type: '',
      startDate: '',
      endDate: '',
      tasks: ['']
    });
    setShowExperienceModal(true);
  };

  const openEditExperienceModal = (index: number) => {
    const experience = cvData.experience[index];
    setEditingExperience(index);
    setExperienceForm({
      company: experience.company,
      position: experience.position,
      type: experience.type,
      startDate: experience.startDate,
      endDate: experience.endDate,
      tasks: experience.tasks || ['']
    });
    setShowExperienceModal(true);
  };

  const handleExperienceFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExperienceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addExperienceTask = () => {
    if (newTask.trim()) {
      setExperienceForm(prev => ({
        ...prev,
        tasks: [...(prev.tasks || []), newTask.trim()]
      }));
      setNewTask('');
    }
  };

  const removeExperienceTask = (index: number) => {
    setExperienceForm(prev => ({
      ...prev,
      tasks: prev.tasks?.filter((_, i) => i !== index)
    }));
  };

  const saveExperience = () => {
    // Create a new experience object
    const newExperience = {
      ...experienceForm,
      tasks: experienceForm.tasks?.filter(t => t.trim() !== '')
    };
    
    // Update the CV data
    const newExperienceList = [...cvData.experience];
    
    if (editingExperience !== null) {
      // Edit existing experience
      newExperienceList[editingExperience] = newExperience;
    } else {
      // Add new experience
      newExperienceList.push(newExperience);
    }
    
    setCvData(prev => ({
      ...prev,
      experience: newExperienceList
    }));
    
    // Close the modal
    setShowExperienceModal(false);
  };

  const deleteExperience = (index: number) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  // Skills handlers
  const openAddSkillModal = () => {
    setEditingSkill(null);
    setSkillText('');
    setShowSkillModal(true);
  };

  const openEditSkillModal = (index: number) => {
    setEditingSkill(index);
    setSkillText(cvData.skills[index]);
    setShowSkillModal(true);
  };

  const saveSkill = () => {
    if (skillText.trim() === '') return;
    
    const newSkills = [...cvData.skills];
    
    if (editingSkill !== null) {
      // Edit existing skill
      newSkills[editingSkill] = skillText;
    } else {
      // Add new skill
      newSkills.push(skillText);
    }
    
    setCvData(prev => ({
      ...prev,
      skills: newSkills
    }));
    
    // Close the modal
    setShowSkillModal(false);
  };

  const deleteSkill = (index: number) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Projects handlers
  const openAddProjectModal = () => {
    setEditingProject(null);
    setProjectForm({
      name: '',
      description: '',
      technologies: '',
      startDate: '',
      endDate: '',
      link: ''
    });
    setShowProjectModal(true);
  };

  const openEditProjectModal = (index: number) => {
    const project = cvData.projects[index];
    setEditingProject(index);
    setProjectForm({
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      startDate: project.startDate,
      endDate: project.endDate,
      link: project.link || ''
    });
    setShowProjectModal(true);
  };

  const handleProjectFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProjectForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProject = () => {
    // Create a new project object
    const newProject = {
      ...projectForm,
      link: projectForm.link && projectForm.link.trim() !== '' ? projectForm.link : undefined
    };
    
    // Update the CV data
    const newProjectsList = [...cvData.projects];
    
    if (editingProject !== null) {
      // Edit existing project
      newProjectsList[editingProject] = newProject;
    } else {
      // Add new project
      newProjectsList.push(newProject);
    }
    
    setCvData(prev => ({
      ...prev,
      projects: newProjectsList
    }));
    
    // Close the modal
    setShowProjectModal(false);
  };

  const deleteProject = (index: number) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  // Data reset function
  const resetData = () => {
    if (window.confirm('Are you sure you want to reset all your CV data? This cannot be undone.')) {
      setCvData(sampleData);
    }
  };
  
  // Export CV data as JSON file
  const exportData = () => {
    const dataStr = JSON.stringify(cvData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.download = `cv-data-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.click();
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  };
  
  // Import CV data from JSON file
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Basic validation to ensure the imported data has the expected structure
        if (
          importedData &&
          typeof importedData === 'object' &&
          'firstName' in importedData &&
          'lastName' in importedData &&
          'education' in importedData &&
          'experience' in importedData
        ) {
          setCvData(importedData);
          alert('CV data imported successfully!');
        } else {
          alert('Invalid data format. Please import a valid CV data file.');
        }
      } catch (error) {
        alert('Error importing data. Please try again with a valid JSON file.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  // Ref for CV template component
  const cvTemplateRef = useRef<HTMLDivElement>(null);
  
  // Function to download CV as PDF
  const downloadCV = async () => {
    if (!cvTemplateRef.current) return;
    
    // Show a loading indicator
    showNotification('Generating PDF...', 'info');
    
    try {
      // Get all pages from the CV template
      const pages = cvTemplateRef.current.querySelectorAll('[data-cv-page]');
      
      if (pages.length === 0) {
        throw new Error('No pages found in CV template');
      }
      
      // Initialize PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Convert each page to canvas and add to PDF
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        // For pages after the first one, add a new page to the PDF
        if (i > 0) {
          pdf.addPage();
        }
        
        const canvas = await html2canvas(page, {
          useCORS: true,
          logging: false,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // A4 dimensions in mm
        const pdfWidth = 210;
        const pdfHeight = 297;
        
        // Add image to PDF, fitting to A4 page
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`${cvData.firstName}-${cvData.lastName}-CV.pdf`);
      showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('Error generating PDF. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {step === 'welcome' && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-gray-100">
          <div className="text-center max-w-2xl px-6 py-16">
            <h1 className="text-5xl font-bold mb-6 text-brand-primary">Dear Sir Home Tuition CV Maker</h1>
            <p className="text-xl mb-10 text-gray-600">Create a professional CV in minutes with our easy-to-use builder.</p>
            <button 
              className="bg-brand-primary hover:bg-brand-light text-white font-bold py-3 px-10 rounded-lg text-lg shadow-lg transition transform hover:scale-105"
              onClick={() => setStep('editor')}
            >
              Create My CV
            </button>
          </div>
        </div>
      )}

      {step === 'editor' && (
        <div className="flex flex-col h-screen">
          {/* Top Navbar */}
          <header className="bg-brand-primary text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <h1 className="font-bold text-xl">Dear Sir Home Tuition CV Maker</h1>
              <button 
                className="bg-white text-brand-primary px-4 py-1 rounded-lg font-medium hover:bg-gray-100 shadow-sm flex items-center"
                onClick={downloadCV}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CV
              </button>
            </div>
          </header>

          {/* Mobile View Toggle - Only visible on mobile */}
          <div className="md:hidden bg-gray-200 p-2 flex">
            <button
              onClick={() => setMobileView('form')}
              className={`flex-1 py-2 px-4 rounded-l-lg ${
                mobileView === 'form' ? 'bg-brand-primary text-white' : 'bg-gray-300'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMobileView('preview')}
              className={`flex-1 py-2 px-4 rounded-r-lg ${
                mobileView === 'preview' ? 'bg-brand-primary text-white' : 'bg-gray-300'
              }`}
            >
              Preview
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar Navigation - Combined for Desktop and Mobile */}
            <div className="flex-shrink-0 bg-white shadow-md">
              {/* Desktop vertical sidebar with text - only visible on desktop */}
              <div className="hidden md:flex md:flex-col md:w-20 items-center py-6">
                <div 
                  className={`w-16 h-16 rounded-full mb-6 flex flex-col items-center justify-center text-xs cursor-pointer ${activeSection === 'about' ? 'text-brand-primary font-bold' : 'text-gray-600'}`}
                  onClick={() => setActiveSection('about')}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  About
                </div>
                
                <div 
                  className={`w-16 h-16 rounded-full mb-6 flex flex-col items-center justify-center text-xs cursor-pointer ${activeSection === 'education' ? 'text-brand-primary font-bold' : 'text-gray-600'}`}
                  onClick={() => setActiveSection('education')}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  Education
                </div>
                
                <div 
                  className={`w-16 h-16 rounded-full mb-6 flex flex-col items-center justify-center text-xs cursor-pointer ${activeSection === 'experience' ? 'text-brand-primary font-bold' : 'text-gray-600'}`}
                  onClick={() => setActiveSection('experience')}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Experience
                </div>
                
                <div 
                  className={`w-16 h-16 rounded-full mb-6 flex flex-col items-center justify-center text-xs cursor-pointer ${activeSection === 'projects' ? 'text-brand-primary font-bold' : 'text-gray-600'}`}
                  onClick={() => setActiveSection('projects')}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  Projects
                </div>
                
                <div 
                  className={`w-16 h-16 rounded-full mb-6 flex flex-col items-center justify-center text-xs cursor-pointer ${activeSection === 'skills' ? 'text-brand-primary font-bold' : 'text-gray-600'}`}
                  onClick={() => setActiveSection('skills')}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Skills
                </div>
              </div>

              {/* Mobile vertical sidebar without text - only visible on mobile */}
              {mobileView === 'form' && (
                <div className="md:hidden flex flex-col w-12 border-r border-gray-200">
                  <div 
                    className={`p-3 cursor-pointer border-l-2 ${activeSection === 'about' ? 'text-brand-primary border-brand-primary bg-blue-50' : 'text-gray-500 border-transparent'}`}
                    onClick={() => setActiveSection('about')}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  <div 
                    className={`p-3 cursor-pointer border-l-2 ${activeSection === 'education' ? 'text-brand-primary border-brand-primary bg-blue-50' : 'text-gray-500 border-transparent'}`}
                    onClick={() => setActiveSection('education')}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                  
                  <div 
                    className={`p-3 cursor-pointer border-l-2 ${activeSection === 'experience' ? 'text-brand-primary border-brand-primary bg-blue-50' : 'text-gray-500 border-transparent'}`}
                    onClick={() => setActiveSection('experience')}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  <div 
                    className={`p-3 cursor-pointer border-l-2 ${activeSection === 'projects' ? 'text-brand-primary border-brand-primary bg-blue-50' : 'text-gray-500 border-transparent'}`}
                    onClick={() => setActiveSection('projects')}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  
                  <div 
                    className={`p-3 cursor-pointer border-l-2 ${activeSection === 'skills' ? 'text-brand-primary border-brand-primary bg-blue-50' : 'text-gray-500 border-transparent'}`}
                    onClick={() => setActiveSection('skills')}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Middle Section - Form Fields */}
            <div className={`flex-1 bg-white p-4 md:p-6 overflow-y-auto border-r ${mobileView === 'preview' ? 'hidden' : 'block'} md:block`}>
              {activeSection === 'about' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-primary">About yourself</h2>
                    <div className="text-xs text-gray-600">
                      Completeness - {progress}%
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Fill out your primary information.</p>
                  
                  {/* Photo Upload */}
                  <div className="mb-4 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-gray-100 mb-2 flex items-center justify-center overflow-hidden border">
                      {/* Add image preview here if available */}
                      <span className="text-gray-400">Photo</span>
                    </div>
                    <button className="text-brand-primary flex items-center text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                      </svg>
                      Upload Photo
                    </button>
                  </div>
                  
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input 
                        type="text" 
                        name="firstName"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                        value={cvData.firstName}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input 
                        type="text" 
                        name="lastName"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                        value={cvData.lastName}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>
                  
                  {/* Pronouns */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pronouns</label>
                    <input 
                      type="text" 
                      name="pronouns"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                      value={cvData.pronouns}
                      onChange={handleProfileChange}
                      placeholder="e.g., they/them, she/her, he/him"
                    />
                  </div>
                  
                  {/* Title/Position */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title/Position</label>
                    <input 
                      type="text" 
                      name="title"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                      value={cvData.title}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  {/* Date of Birth */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input 
                      type="text" 
                      name="dob"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                      value={cvData.dob}
                      onChange={handleProfileChange}
                      placeholder="MM/DD/YYYY"
                    />
                  </div>
                  
                  {/* Address */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input 
                      type="text" 
                      name="address"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                      value={cvData.address}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        type="email" 
                        name="email"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                        value={cvData.email}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input 
                        type="tel" 
                        name="phone"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                        value={cvData.phone}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'education' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-primary">Education</h2>
                    <button 
                      className="bg-brand-primary text-white rounded px-2 py-1 text-xs flex items-center"
                      onClick={openAddEducationModal}
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add
                    </button>
                  </div>
                  
                  {cvData.education.length > 0 ? (
                    <div className="space-y-6">
                      {cvData.education.map((edu, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold">{edu.degree}</h3>
                              <p className="text-gray-700">{edu.institution}</p>
                              <p className="text-sm text-gray-500">{edu.startDate} - {edu.endDate}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                className="p-1 text-gray-500 hover:text-brand-primary"
                                onClick={() => openEditEducationModal(index)}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button 
                                className="p-1 text-gray-500 hover:text-red-500"
                                onClick={() => deleteEducation(index)}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-gray-500">Add your education details</p>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'experience' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-primary">Experience</h2>
                    <button 
                      className="bg-brand-primary text-white rounded px-2 py-1 text-xs flex items-center"
                      onClick={openAddExperienceModal}
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add
                    </button>
                  </div>
                  
                  {cvData.experience.length > 0 ? (
                    <div className="space-y-6">
                      {cvData.experience.map((exp, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold">{exp.company}</h3>
                              <p className="text-gray-700">{exp.type}, {exp.position}</p>
                              <p className="text-sm text-gray-500">{exp.startDate} - {exp.endDate}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                className="p-1 text-gray-500 hover:text-brand-primary"
                                onClick={() => openEditExperienceModal(index)}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button 
                                className="p-1 text-gray-500 hover:text-red-500"
                                onClick={() => deleteExperience(index)}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-gray-500">Add your work experience</p>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'skills' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-primary">Skills</h2>
                    <button 
                      className="bg-brand-primary text-white rounded px-2 py-1 text-xs flex items-center"
                      onClick={openAddSkillModal}
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add
                    </button>
                  </div>
                  
                  {cvData.skills.length > 0 ? (
                    <div className="space-y-2">
                      {cvData.skills.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                          <span>{skill}</span>
                          <div className="flex space-x-2">
                            <button 
                              className="p-1 text-gray-500 hover:text-brand-primary"
                              onClick={() => openEditSkillModal(index)}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button 
                              className="p-1 text-gray-500 hover:text-red-500"
                              onClick={() => deleteSkill(index)}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-gray-500">Add your skills</p>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'projects' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-primary">Projects</h2>
                    <button 
                      className="bg-brand-primary text-white rounded px-2 py-1 text-xs flex items-center"
                      onClick={openAddProjectModal}
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add
                    </button>
                  </div>
                  
                  {cvData.projects.length > 0 ? (
                    <div className="space-y-6">
                      {cvData.projects.map((project, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold">{project.name}</h3>
                              <p className="text-sm text-gray-500">{project.startDate} - {project.endDate}</p>
                              <p className="mt-1 text-sm">{project.description}</p>
                              <p className="mt-1 text-xs text-gray-600">
                                <strong>Technologies:</strong> {project.technologies}
                              </p>
                              {project.link && (
                                <a 
                                  href={project.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-xs text-brand-primary hover:underline mt-1 inline-block"
                                >
                                  View Project
                                </a>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                className="p-1 text-gray-500 hover:text-brand-primary"
                                onClick={() => openEditProjectModal(index)}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button 
                                className="p-1 text-gray-500 hover:text-red-500"
                                onClick={() => deleteProject(index)}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-gray-500">Add your projects</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Section - CV Preview */}
            <div className={`w-full md:w-1/2 bg-gray-100 p-4 md:p-6 overflow-y-auto overflow-x-hidden ${mobileView === 'form' ? 'hidden' : 'block'} md:block`}>
              {/* Wrapper div to ensure centering */}
              <div className="flex justify-center items-start w-full">
                {/* Render the CV template with current data */}
                <div className="transform-gpu" 
                  style={mobileView === 'preview' ? { 
                    transform: 'scale(0.45)',
                    transformOrigin: 'top center',
                    width: '210mm',
                    padding: '0 20px'
                  } : {
                    maxWidth: '210mm',
                    margin: '0 auto'
                  }} 
                  ref={cvTemplateRef}>
                  <CVTemplate data={cvData} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Auto-save notification */}
      {notification.show && (
        <div 
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-md transition-opacity duration-300 flex items-center
            ${notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 
              notification.type === 'info' ? 'bg-blue-100 border border-blue-400 text-blue-700' :
              'bg-red-100 border border-red-400 text-red-700'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {notification.type === 'success' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : notification.type === 'info' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          {notification.message}
        </div>
      )}
      
      {/* Education Modal */}
      {showEducationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-brand-primary text-white p-4">
              <h2 className="text-xl font-semibold">{editingEducation !== null ? 'Edit Education' : 'Add Education'}</h2>
            </div>
            
            <div className="p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <input 
                  type="text" 
                  name="institution"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                  value={educationForm.institution}
                  onChange={handleEducationFormChange}
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                <input 
                  type="text" 
                  name="degree"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                  value={educationForm.degree}
                  onChange={handleEducationFormChange}
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input 
                  type="text" 
                  name="location"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                  value={educationForm.location}
                  onChange={handleEducationFormChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="text" 
                    name="startDate"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                    placeholder="e.g., Sep 2019"
                    value={educationForm.startDate}
                    onChange={handleEducationFormChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    type="text" 
                    name="endDate"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                    placeholder="e.g., Jun 2023 or Present"
                    value={educationForm.endDate}
                    onChange={handleEducationFormChange}
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade (Optional)</label>
                <input 
                  type="text" 
                  name="grade"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                  value={educationForm.grade}
                  onChange={handleEducationFormChange}
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                {educationForm.details?.map((detail, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input 
                      type="text" 
                      className="flex-1 p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary mr-2" 
                      value={detail}
                      onChange={(e) => {
                        const newDetails = [...(educationForm.details || [])];
                        newDetails[index] = e.target.value;
                        setEducationForm(prev => ({
                          ...prev,
                          details: newDetails
                        }));
                      }}
                    />
                    <button 
                      className="text-red-500"
                      onClick={() => removeEducationDetail(index)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center mt-2">
                  <input 
                    type="text" 
                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary mr-2" 
                    placeholder="Add a detail"
                    value={newDetail}
                    onChange={(e) => setNewDetail(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addEducationDetail();
                      }
                    }}
                  />
                  <button 
                    className="bg-green-500 text-white p-1 rounded"
                    onClick={addEducationDetail}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                onClick={() => setShowEducationModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-light"
                onClick={saveEducation}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Experience Modal */}
      {showExperienceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-brand-primary text-white p-4">
              <h2 className="text-xl font-semibold">{editingExperience !== null ? 'Edit Experience' : 'Add Experience'}</h2>
            </div>
            
            <div className="p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input 
                  type="text" 
                  name="company"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                  value={experienceForm.company}
                  onChange={handleExperienceFormChange}
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input 
                  type="text" 
                  name="position"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                  value={experienceForm.position}
                  onChange={handleExperienceFormChange}
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input 
                  type="text" 
                  name="type"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                  placeholder="e.g., Full-time, Part-time, Internship"
                  value={experienceForm.type}
                  onChange={handleExperienceFormChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="text" 
                    name="startDate"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                    placeholder="e.g., Jan 2019"
                    value={experienceForm.startDate}
                    onChange={handleExperienceFormChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    type="text" 
                    name="endDate"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                    placeholder="e.g., Dec 2021 or Present"
                    value={experienceForm.endDate}
                    onChange={handleExperienceFormChange}
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasks/Responsibilities</label>
                {experienceForm.tasks?.map((task, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input 
                      type="text" 
                      className="flex-1 p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary mr-2" 
                      value={task}
                      onChange={(e) => {
                        const newTasks = [...(experienceForm.tasks || [])];
                        newTasks[index] = e.target.value;
                        setExperienceForm(prev => ({
                          ...prev,
                          tasks: newTasks
                        }));
                      }}
                    />
                    <button 
                      className="text-red-500"
                      onClick={() => removeExperienceTask(index)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center mt-2">
                  <input 
                    type="text" 
                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary mr-2" 
                    placeholder="Add a task"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addExperienceTask();
                      }
                    }}
                  />
                  <button 
                    className="bg-green-500 text-white p-1 rounded"
                    onClick={addExperienceTask}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                onClick={() => setShowExperienceModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-light"
                onClick={saveExperience}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Skills Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-brand-primary text-white p-4">
              <h2 className="text-xl font-semibold">{editingSkill !== null ? 'Edit Skill' : 'Add Skill'}</h2>
            </div>
            
            <div className="p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                  value={skillText}
                  onChange={(e) => setSkillText(e.target.value)}
                  placeholder="e.g., JavaScript, C++, Python, Bash, PHP"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple skills with commas or list related skills together
                </p>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                onClick={() => setShowSkillModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-light"
                onClick={saveSkill}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Projects Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-brand-primary text-white p-4">
              <h2 className="text-xl font-semibold">{editingProject !== null ? 'Edit Project' : 'Add Project'}</h2>
            </div>
            
            <div className="p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input 
                  type="text" 
                  name="name"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                  value={projectForm.name}
                  onChange={handleProjectFormChange}
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  name="description"
                  rows={3}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                  value={projectForm.description}
                  onChange={handleProjectFormChange}
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Technologies Used</label>
                <input 
                  type="text" 
                  name="technologies"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                  placeholder="e.g., React, Node.js, Python, Django"
                  value={projectForm.technologies}
                  onChange={handleProjectFormChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="text" 
                    name="startDate"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                    placeholder="e.g., Jan 2022"
                    value={projectForm.startDate}
                    onChange={handleProjectFormChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    type="text" 
                    name="endDate"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                    placeholder="e.g., Mar 2022 or Present"
                    value={projectForm.endDate}
                    onChange={handleProjectFormChange}
                  />
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Link (Optional)</label>
                <input 
                  type="text" 
                  name="link"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary focus:border-brand-primary" 
                  placeholder="e.g., https://github.com/username/project"
                  value={projectForm.link}
                  onChange={handleProjectFormChange}
                />
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                onClick={() => setShowProjectModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-light"
                onClick={saveProject}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
