            {/* Mobile horizontal navigation - only shown when form view is active */}
            {mobileView === 'form' && (
              <div className="md:hidden w-full flex overflow-x-auto py-2 bg-white shadow-sm sticky top-0 z-10">
                <div 
                  className={`min-w-[80px] flex flex-col items-center justify-center py-2 px-4 text-xs cursor-pointer ${activeSection === 'about' ? 'text-brand-primary font-bold' : 'text-gray-600'}`}
                  onClick={() => setActiveSection('about')}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  About
                </div>
                
                <div 
                  className={`min-w-[80px] flex flex-col items-center justify-center py-2 px-4 text-xs cursor-pointer ${activeSection === 'education' ? 'text-brand-primary font-bold' : 'text-gray-600'}`}
                  onClick={() => setActiveSection('education')}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  Education
                </div>
                
                <div 
                  className={`min-w-[80px] flex flex-col items-center justify-center py-2 px-4 text-xs cursor-pointer ${activeSection === 'experience' ? 'text-brand-primary font-bold' : 'text-gray-600'}`}
                  onClick={() => setActiveSection('experience')}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Experience
                </div>
                
                <div 
                  className={`min-w-[80px] flex flex-col items-center justify-center py-2 px-4 text-xs cursor-pointer ${activeSection === 'projects' ? 'text-brand-primary font-bold' : 'text-gray-600'}`}
                  onClick={() => setActiveSection('projects')}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  Projects
                </div>
                
                <div 
                  className={`min-w-[80px] flex flex-col items-center justify-center py-2 px-4 text-xs cursor-pointer ${activeSection === 'skills' ? 'text-brand-primary font-bold' : 'text-gray-600'}`}
                  onClick={() => setActiveSection('skills')}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Skills
                </div>
              </div>
            )}

            {/* Middle Section - Form Fields */}
            <div className={`w-full md:w-1/4 bg-white p-4 md:p-6 overflow-y-auto border-r ${mobileView === 'preview' ? 'hidden' : 'block'} md:block`}> 