import React, { useMemo } from 'react';

interface CVData {
  firstName: string;
  lastName: string;
  pronouns: string;
  title: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  skills: string[];
  links: {
    label: string;
    url: string;
  }[];
  experience: {
    company: string;
    position: string;
    type: string;
    startDate: string;
    endDate: string;
    tasks: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    location: string;
    startDate: string;
    endDate: string;
    grade?: string;
    details?: string[];
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string;
    startDate: string;
    endDate: string;
    link?: string;
  }[];
}

interface CVTemplateProps {
  data: CVData;
}

// Define the maximum number of items per page to prevent overflow
const MAX_EXPERIENCES_PER_PAGE = 3;
const MAX_EDUCATIONS_PER_PAGE = 3;
const MAX_PROJECTS_PER_PAGE = 2;

// Define types for page data
interface PageData {
  experiences: CVData['experience'];
  education: CVData['education'];
  projects: CVData['projects'];
}

const CVTemplate: React.FC<CVTemplateProps> = ({ data }) => {
  // Split content into pages
  const { pages, totalPages } = useMemo(() => {
    // Setup page collection
    const pagesArray: PageData[] = [];
    let currentPage: PageData = {
      experiences: [],
      education: [],
      projects: []
    };
    
    // Add experiences to the first page
    const firstPageExperiences = data.experience.slice(0, MAX_EXPERIENCES_PER_PAGE);
    currentPage.experiences = firstPageExperiences;
    
    // Add projects to the first page
    // Make sure we don't split projects across pages
    const firstPageProjects = data.projects.slice(0, MAX_PROJECTS_PER_PAGE);
    
    // Only add projects if they fit entirely
    if (firstPageProjects.length > 0) {
      currentPage.projects = firstPageProjects;
    }
    
    // Special case for education entries
    // Ensure all education entries stay on a single page
    const educationEntries = [...data.education];
    
    // Process education entries one by one
    for (let i = 0; i < educationEntries.length; i++) {
      const entry = educationEntries[i];
      
      // Calculate this entry's complexity to determine if it might need more space
      const entryComplexity = (entry.details?.length || 0) + 
                             (entry.degree.length > 50 ? 1 : 0) + 
                             (entry.institution.length > 30 ? 1 : 0);
      
      // Education entries with long details or long degree/institution names
      // should be placed on their own page if they would make the current page too full
      const wouldExceedPageCapacity = currentPage.education.length >= MAX_EDUCATIONS_PER_PAGE || 
                                    (currentPage.education.length > 0 && entryComplexity > 3);
      
      // If this entry would push us over the page limit, start a new page
      if (wouldExceedPageCapacity) {
        // Add current page to pages array
        pagesArray.push(currentPage);
        
        // Start a new page with just this education entry
        currentPage = {
          experiences: [],
          education: [entry],
          projects: []
        };
      } else {
        // Add to current page
        currentPage.education.push(entry);
      }
    }
    
    // Add the last page if it has content
    if (currentPage.education.length > 0 || 
        currentPage.experiences.length > 0 || 
        currentPage.projects.length > 0) {
      pagesArray.push(currentPage);
    }
    
    // Handle any remaining experiences and projects
    const remainingExperiences = data.experience.slice(MAX_EXPERIENCES_PER_PAGE);
    const remainingProjects = data.projects.slice(MAX_PROJECTS_PER_PAGE);
    
    if (remainingExperiences.length > 0 || remainingProjects.length > 0) {
      // Create a final page for remaining content
      const finalPage: PageData = {
        experiences: remainingExperiences.length > 0 ? 
                    remainingExperiences.slice(0, MAX_EXPERIENCES_PER_PAGE) : [],
        education: [],
        projects: remainingProjects.length > 0 ? 
                 remainingProjects.slice(0, MAX_PROJECTS_PER_PAGE) : []
      };
      
      // Only add the page if it actually has content
      if (finalPage.experiences.length > 0 || finalPage.projects.length > 0) {
        pagesArray.push(finalPage);
      }
    }
    
    return {
      pages: pagesArray,
      totalPages: pagesArray.length
    };
  }, [data]);

  return (
    <div className="w-full">
      {pages.map((page, pageIndex) => (
        <div 
          key={pageIndex}
          className="w-full bg-white shadow-lg flex flex-col md:flex-row overflow-hidden print:break-after-page"
          style={{ 
            height: '297mm', // A4 height in mm
            width: '210mm',  // A4 width in mm
            pageBreakAfter: pageIndex < totalPages - 1 ? 'always' : 'auto',
            marginBottom: pageIndex < totalPages - 1 ? '30px' : '0',
            boxSizing: 'border-box'
          }}
          data-cv-page={`page-${pageIndex + 1}`}
        >
          {/* Left sidebar - only on first page */}
          {pageIndex === 0 && (
            <div className="w-full md:w-1/3 bg-[#1e4d92] text-white p-6 h-full">
              <div className="mb-6">
                <h1 className="text-3xl font-bold uppercase">{data.firstName}</h1>
                <h1 className="text-3xl font-bold uppercase mb-1">{data.lastName}</h1>
                {data.pronouns && <p className="text-sm opacity-80">{data.pronouns}</p>}
                <p className="mt-2">{data.title}</p>
              </div>

              {/* Profile Picture */}
              <div className="mb-6">
                <div className="w-32 h-32 rounded-full bg-white mx-auto overflow-hidden border-2 border-white">
                  {/* Use a placeholder or actual image if available */}
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[#1e4d92]">
                    <span className="text-sm">Photo</span>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold border-b border-white pb-1 mb-3 uppercase">Personal Info</h2>
                <ul className="space-y-2">
                  {data.dob && (
                    <li className="flex items-start">
                      <span className="mr-2">★</span>
                      <span>{data.dob}</span>
                    </li>
                  )}
                  {data.phone && (
                    <li className="flex items-start">
                      <span className="mr-2">☎</span>
                      <span>{data.phone}</span>
                    </li>
                  )}
                  {data.email && (
                    <li className="flex items-start">
                      <span className="mr-2">✉</span>
                      <span>{data.email}</span>
                    </li>
                  )}
                  {data.address && (
                    <li className="flex items-start">
                      <span className="mr-2">⌂</span>
                      <span>{data.address}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Links Section */}
              {data.links && data.links.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold border-b border-white pb-1 mb-3 uppercase">Links</h2>
                  <ul className="space-y-2">
                    {data.links.map((link, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">⚬</span>
                        <span>{link.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {data.skills && data.skills.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold border-b border-white pb-1 mb-3 uppercase">Skills</h2>
                  <ul className="space-y-2">
                    {data.skills.map((skill, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 font-mono">⚙</span>
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Footer note */}
              <div className="mt-auto pt-4 text-xs opacity-70">
                <p>Grade scale: (1) very good ≈91%-100%, (2) good ≈81%-90%, (3) satisfactory ≈66%-80%, (4) sufficient ≈50%-65%, (5) failed ≈0%-49%</p>
              </div>
            </div>
          )}

          {/* Right content area - always present */}
          <div className={`w-full ${pageIndex === 0 ? 'md:w-2/3' : ''} bg-[#f7f3e8] p-6 h-full overflow-hidden flex flex-col`}>
            {/* For pages after the first one, add a header */}
            {pageIndex > 0 && (
              <div className="mb-4 pb-2 border-b border-[#1e4d92]">
                <h1 className="text-xl font-bold text-[#1e4d92]">{data.firstName} {data.lastName}</h1>
              </div>
            )}

            {/* Work Experience */}
            {page.experiences.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl uppercase font-bold text-[#1e4d92] border-b border-[#1e4d92] pb-1 mb-4">
                  Work Experience
                </h2>
                
                {page.experiences.map((exp, index) => (
                  <div key={index} className="mb-6">
                    <h3 className="text-lg font-bold">{exp.company}</h3>
                    <p className="font-medium">{exp.type}, {exp.position}</p>
                    <p className="text-sm italic mb-2">{exp.startDate} - {exp.endDate}</p>
                    
                    <ul className="list-disc ml-5 space-y-1">
                      {exp.tasks.map((task, taskIndex) => (
                        <li key={taskIndex}>
                          {task.startsWith('- ') ? (
                            <ul className="list-none ml-4">
                              <li>{task.substring(2)}</li>
                            </ul>
                          ) : (
                            task
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            
            {/* Projects Section */}
            {page.projects && page.projects.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl uppercase font-bold text-[#1e4d92] border-b border-[#1e4d92] pb-1 mb-4">
                  Projects
                </h2>
                
                {page.projects.map((project, index) => (
                  <div key={index} className="mb-6">
                    <div className="flex justify-between">
                      <h3 className="text-lg font-bold">{project.name}</h3>
                      <p className="text-sm italic">{project.startDate} - {project.endDate}</p>
                    </div>
                    <p className="mb-1">{project.description}</p>
                    <p className="text-sm"><strong>Technologies:</strong> {project.technologies}</p>
                    {project.link && (
                      <p className="text-sm text-[#1e4d92]">
                        <a href={project.link} target="_blank" rel="noopener noreferrer">{project.link}</a>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Education */}
            {page.education && page.education.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl uppercase font-bold text-[#1e4d92] border-b border-[#1e4d92] pb-1 mb-4">
                  Education
                </h2>
                
                {page.education.map((edu, index) => (
                  <div key={index} className="mb-6">
                    <h3 className="text-lg font-bold break-words">{edu.degree}, {edu.institution}</h3>
                    <p className="text-sm italic mb-2">{edu.location} ⋅ {edu.startDate} - {edu.endDate}</p>
                    {edu.grade && <p className="mb-1">Grade: {edu.grade}</p>}
                    
                    {edu.details && edu.details.length > 0 && (
                      <ul className="list-none space-y-1 text-sm">
                        {edu.details.map((detail, detailIndex) => (
                          <li key={detailIndex}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Footer page info */}
            <div className="text-right text-xs text-gray-500 mt-auto pt-4">
              <p>Page {pageIndex + 1} of {totalPages}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CVTemplate; 