import React, { useState } from 'react';

function App() {
  const [step, setStep] = useState<'welcome' | 'templates' | 'editor'>('welcome');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [cvData, setCvData] = useState({
    name: 'John Doe',
    pronouns: 'they/them',
    title: 'Demo Subject, Placeholder',
    dob: '01/01/1970',
    phone: '+1-234-871-555-9',
    email: 'john@example.com',
    address: '1600 Pennsylvania Ave, Washington DC',
    skills: ['C++, Python, JavaScript', 'HTML, CSS, LaTeX', 'MS Office, Adobe Acrobat'],
    experience: [],
    education: [],
    languages: []
  });

  // Colors that match Dear Sir Home Tuition branding
  const brandColors = {
    primary: 'bg-blue-700',
    secondary: 'bg-yellow-500',
    accent: 'text-blue-700',
  };

  const handleFieldEdit = (field: string, value: any) => {
    setCvData({ ...cvData, [field]: value });
    setEditingField(null);
  };

  const renderEditingInterface = () => {
    switch (editingField) {
      case 'name':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Edit Name</h3>
              <input 
                type="text" 
                className="w-full p-2 border rounded mb-4" 
                value={cvData.name}
                onChange={(e) => setCvData({...cvData, name: e.target.value})}
              />
              <div className="flex justify-end space-x-2">
                <button 
                  className="px-4 py-2 bg-gray-200 rounded"
                  onClick={() => setEditingField(null)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={() => setEditingField(null)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Edit Contact Information</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full p-2 border rounded" 
                  value={cvData.email}
                  onChange={(e) => setCvData({...cvData, email: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded" 
                  value={cvData.phone}
                  onChange={(e) => setCvData({...cvData, phone: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Address</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded" 
                  value={cvData.address}
                  onChange={(e) => setCvData({...cvData, address: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  className="px-4 py-2 bg-gray-200 rounded"
                  onClick={() => setEditingField(null)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={() => setEditingField(null)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        );
      case 'skills':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Edit Skills</h3>
              {cvData.skills.map((skill, index) => (
                <div key={index} className="mb-2">
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded" 
                    value={skill}
                    onChange={(e) => {
                      const newSkills = [...cvData.skills];
                      newSkills[index] = e.target.value;
                      setCvData({...cvData, skills: newSkills});
                    }}
                  />
                </div>
              ))}
              <button 
                className="mt-2 px-4 py-2 bg-gray-200 rounded w-full mb-4"
                onClick={() => setCvData({...cvData, skills: [...cvData.skills, '']})}
              >
                + Add Skill
              </button>
              <div className="flex justify-end space-x-2">
                <button 
                  className="px-4 py-2 bg-gray-200 rounded"
                  onClick={() => setEditingField(null)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={() => setEditingField(null)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - visible on all pages */}
      <nav className="bg-blue-700 text-white shadow-md">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-bold text-xl cursor-pointer" onClick={() => setStep('welcome')}>
              Dear Sir Home Tuition
            </span>
          </div>
          <div className="space-x-4">
            <button 
              className="hover:text-yellow-300 transition" 
              onClick={() => setStep('welcome')}
            >
              Home
            </button>
            <button 
              className="hover:text-yellow-300 transition" 
              onClick={() => setStep('templates')}
            >
              Templates
            </button>
            <button className="px-4 py-1 bg-yellow-500 text-blue-900 font-semibold rounded hover:bg-yellow-400 transition">
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <div className="container mx-auto px-6 py-8">
        {step === 'welcome' && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 py-12">
            <div className="md:w-1/2">
              <h1 className="text-4xl font-extrabold mb-6 text-blue-800 leading-tight">
                Create Your Professional CV <span className="text-yellow-500">in Minutes</span>
              </h1>
              <p className="text-lg mb-8 text-gray-600 leading-relaxed">
                Welcome to Dear Sir Home Tuition's professional CV maker. Craft a standout CV with our easy-to-use builder and professional templates!
              </p>
              <div className="space-x-4">
                <button
                  className="bg-blue-700 text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition font-semibold text-lg shadow-lg"
                  onClick={() => setStep('templates')}
                >
                  Get Started
                </button>
                <button className="border-2 border-blue-700 text-blue-700 px-8 py-3 rounded-lg hover:bg-blue-50 transition font-semibold text-lg">
                  Learn More
                </button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white p-8 rounded-lg shadow-2xl border-t-4 border-blue-700">
                <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center p-6">
                  <div className="w-full h-full bg-white rounded shadow p-4 flex flex-col justify-between">
                    <div>
                      <div className="h-6 w-32 bg-blue-200 rounded mb-2"></div>
                      <div className="h-4 w-48 bg-gray-200 rounded mb-4"></div>
                      <div className="flex space-x-2 mb-4">
                        <div className="h-3 w-3 bg-blue-700 rounded-full"></div>
                        <div className="h-3 w-20 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex space-x-2 mb-4">
                        <div className="h-3 w-3 bg-blue-700 rounded-full"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div>
                      <div className="h-5 w-full bg-blue-100 rounded mb-1"></div>
                      <div className="h-5 w-full bg-blue-100 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <span className="text-sm text-gray-500">Preview of our professional CV template</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'templates' && (
          <div className="py-8">
            <h2 className="text-3xl font-bold mb-2 text-blue-800">Choose a Template</h2>
            <p className="text-gray-600 mb-8">Select from our professionally designed templates to get started.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Template 1 - LaTeX Inspired */}
              <div 
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition border border-gray-200 cursor-pointer transform hover:-translate-y-1"
                onClick={() => setStep('editor')}
              >
                <div className="h-48 bg-gradient-to-r from-blue-100 to-blue-200 p-4 flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded shadow-inner p-3 flex">
                    <div className="w-1/3 bg-blue-700"></div>
                    <div className="w-2/3 p-1">
                      <div className="h-3 w-20 bg-gray-300 mb-2"></div>
                      <div className="h-2 w-24 bg-gray-200 mb-4"></div>
                      <div className="h-2 w-full bg-gray-100 mb-1"></div>
                      <div className="h-2 w-full bg-gray-100 mb-1"></div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-blue-800">Classic Professional</h3>
                  <p className="text-gray-600 text-sm">A clean, professional template inspired by LaTeX designs with two-column layout.</p>
                  <div className="mt-4">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Most Popular</span>
                  </div>
                </div>
              </div>

              {/* Template 2 */}
              <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition border border-gray-200 cursor-pointer transform hover:-translate-y-1">
                <div className="h-48 bg-gradient-to-r from-gray-100 to-gray-200 p-4 flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded shadow-inner p-3">
                    <div className="h-5 w-24 bg-gray-800 mb-3"></div>
                    <div className="h-3 w-20 bg-yellow-500 mb-3"></div>
                    <div className="h-2 w-full bg-gray-200 mb-1"></div>
                    <div className="h-2 w-full bg-gray-200 mb-1"></div>
                    <div className="h-2 w-full bg-gray-200 mb-1"></div>
                    <div className="h-3 w-32 bg-gray-800 mt-3 mb-2"></div>
                    <div className="h-2 w-full bg-gray-200 mb-1"></div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-blue-800">Modern Minimal</h3>
                  <p className="text-gray-600 text-sm">A contemporary, streamlined design focusing on readability and modern aesthetics.</p>
                  <div className="mt-4">
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">New</span>
                  </div>
                </div>
              </div>

              {/* Template 3 */}
              <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition border border-gray-200 cursor-pointer transform hover:-translate-y-1">
                <div className="h-48 bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded shadow-inner p-3">
                    <div className="flex justify-between mb-3">
                      <div className="h-5 w-32 bg-blue-600"></div>
                      <div className="h-5 w-5 rounded-full bg-yellow-500"></div>
                    </div>
                    <div className="h-2 w-full bg-gray-100 mb-1"></div>
                    <div className="h-2 w-full bg-gray-100 mb-1"></div>
                    <div className="h-4 w-24 bg-yellow-400 my-2"></div>
                    <div className="h-2 w-full bg-gray-100 mb-1"></div>
                    <div className="h-2 w-full bg-gray-100 mb-1"></div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-blue-800">Creative Highlight</h3>
                  <p className="text-gray-600 text-sm">Stand out with creative accents and bold design elements, perfect for creative fields.</p>
                  <div className="mt-4">
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Creative</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'editor' && (
          <div className="py-4">
            <div className="flex flex-col md:flex-row">
              {/* Left sidebar with template info */}
              <div className="w-full md:w-64 p-4">
                <h2 className="text-xl font-bold mb-4 text-blue-800">CV Template</h2>
                <p className="text-sm text-gray-500 mb-6">Tap on any section to edit it. Your changes will be saved automatically.</p>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Template Features</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Clean, professional design
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Two-column layout
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Easy to customize
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      ATS-friendly format
                    </li>
                  </ul>
                </div>
                
                <div>
                  <button className="w-full bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition mb-2">
                    Export PDF
                  </button>
                  <button className="w-full border border-blue-700 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition">
                    Save Progress
                  </button>
                </div>
              </div>

              {/* Main CV preview area */}
              <div className="flex-1 p-4">
                <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="flex flex-col md:flex-row h-[842px] border border-gray-300">
                    {/* Left column - sidebar from LaTeX template */}
                    <div className="w-full md:w-1/3 bg-blue-700 text-white p-6">
                      <div className="text-center mb-8">
                        <div 
                          className="cursor-pointer hover:bg-blue-600 p-2 rounded transition"
                          onClick={() => setEditingField('name')}
                        >
                          <h2 className="text-2xl font-bold mb-1">{cvData.name}</h2>
                          <p className="text-sm opacity-75">{cvData.pronouns}</p>
                          <p className="mt-2">{cvData.title}</p>
                        </div>
                      </div>
                      
                      <div className="w-32 h-32 rounded-full bg-white mx-auto mb-8 flex items-center justify-center text-blue-700 cursor-pointer hover:opacity-90 transition">
                        <span className="text-sm">Profile Photo</span>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 border-b border-white pb-1">Personal Info</h3>
                        <div 
                          className="space-y-2 text-sm cursor-pointer hover:bg-blue-600 p-2 rounded transition"
                          onClick={() => setEditingField('contact')}
                        >
                          <div className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{cvData.dob}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{cvData.phone}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{cvData.email}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{cvData.address}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 border-b border-white pb-1">Skills</h3>
                        <div 
                          className="space-y-2 text-sm cursor-pointer hover:bg-blue-600 p-2 rounded transition"
                          onClick={() => setEditingField('skills')}
                        >
                          {cvData.skills.map((skill, index) => (
                            <p key={index}>{skill}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right column - main content */}
                    <div className="w-full md:w-2/3 bg-white p-6">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold mb-4 text-blue-800 border-b border-gray-200 pb-2">Work Experience</h3>
                        <div className="text-center text-gray-500 py-6 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition">
                          <p>Tap to add work experience</p>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-xl font-bold mb-4 text-blue-800 border-b border-gray-200 pb-2">Education</h3>
                        <div className="text-center text-gray-500 py-6 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition">
                          <p>Tap to add education</p>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-xl font-bold mb-4 text-blue-800 border-b border-gray-200 pb-2">Projects</h3>
                        <div className="text-center text-gray-500 py-6 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition">
                          <p>Tap to add projects</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal for editing fields */}
            {renderEditingInterface()}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-600">&copy; 2025 Dear Sir Home Tuition. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-blue-700 hover:text-blue-900">Privacy Policy</a>
              <a href="#" className="text-blue-700 hover:text-blue-900">Terms of Service</a>
              <a href="#" className="text-blue-700 hover:text-blue-900">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
