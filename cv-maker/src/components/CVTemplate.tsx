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

const CVTemplate: React.FC<CVTemplateProps> = ({ data }) => {
  // Split content into pages
  const { pages, totalPages } = useMemo(() => {
    // Calculate how to distribute content across pages
    const totalExperiences = data.experience.length;
    const totalEducations = data.education.length;
    const totalProjects = data.projects.length;
    
    // Initialize first page
    const firstPageExperiences = Math.min(totalExperiences, MAX_EXPERIENCES_PER_PAGE);
    const firstPageEducations = Math.min(totalEducations, MAX_EDUCATIONS_PER_PAGE);
    const firstPageProjects = Math.min(totalProjects, MAX_PROJECTS_PER_PAGE);

    const pagesArray = [
      {
        experiences: data.experience.slice(0, firstPageExperiences),
        education: data.education.slice(0, firstPageEducations),
        projects: data.projects.slice(0, firstPageProjects)
      }
    ];
    
    // Calculate remaining content
    let remainingExperiences = totalExperiences - firstPageExperiences;
    let remainingEducations = totalEducations - firstPageEducations;
    let remainingProjects = totalProjects - firstPageProjects;
    
    // Add additional pages as needed
    while (remainingExperiences > 0 || remainingEducations > 0 || remainingProjects > 0) {
      // Create a new page
      const newPage: any = {
        experiences: [],
        education: [],
        projects: []
      };
      
      // Priority for remaining education entries - always add these first to continuation pages
      if (remainingEducations > 0) {
        const pageEducations = Math.min(remainingEducations, MAX_EDUCATIONS_PER_PAGE);
        const startEducation = totalEducations - remainingEducations;
        
        newPage.education = data.education.slice(startEducation, startEducation + pageEducations);
        remainingEducations -= pageEducations;
      }
      
      // Only add experiences on continuation pages if we have room after education
      // This prevents experiences from appearing on education continuation pages
      if (remainingExperiences > 0 && newPage.education.length < MAX_EDUCATIONS_PER_PAGE) {
        const availableSlots = MAX_EDUCATIONS_PER_PAGE - newPage.education.length;
        const pageExperiences = Math.min(remainingExperiences, availableSlots);
        
        if (pageExperiences > 0) {
          const startExperience = totalExperiences - remainingExperiences;
          newPage.experiences = data.experience.slice(startExperience, startExperience + pageExperiences);
          remainingExperiences -= pageExperiences;
        }
      }
      
      // Only add projects if we've completed all education entries
      // This keeps projects from appearing on education continuation pages
      if (remainingProjects > 0 && remainingEducations === 0) {
        const pageProjects = Math.min(remainingProjects, MAX_PROJECTS_PER_PAGE);
        const startProject = totalProjects - remainingProjects;
        
        newPage.projects = data.projects.slice(startProject, startProject + pageProjects);
        remainingProjects -= pageProjects;
      }
      
      // Add the new page if it has any content
      if (newPage.education.length > 0 || newPage.experiences.length > 0 || newPage.projects.length > 0) {
        pagesArray.push(newPage);
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
          <div className={`w-full ${pageIndex === 0 ? 'md:w-2/3' : ''} bg-[#f7f3e8] p-6 h-full overflow-hidden`}>
            {/* For pages after the first one, add a header */}
            {pageIndex > 0 && (
              <div className="mb-4 pb-2 border-b border-[#1e4d92]">
                <h1 className="text-xl font-bold text-[#1e4d92]">{data.firstName} {data.lastName} - Continued</h1>
              </div>
            )}

            {/* Work Experience */}
            {page.experiences.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl uppercase font-bold text-[#1e4d92] border-b border-[#1e4d92] pb-1 mb-4">
                  {pageIndex > 0 && page.experiences.length > 0 ? 'Work Experience (Continued)' : 'Work Experience'}
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
                  {pageIndex > 0 && page.projects.length > 0 ? 'Projects (Continued)' : 'Projects'}
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
                  {pageIndex > 0 && page.education.length > 0 ? 'Education (Continued)' : 'Education'}
                </h2>
                
                {page.education.map((edu, index) => (
                  <div key={index} className="mb-6">
                    <h3 className="text-lg font-bold">{edu.degree}, {edu.institution}</h3>
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