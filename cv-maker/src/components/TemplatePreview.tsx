import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTemplate } from '../services/templateService';
import { sampleData } from '../types/types';

const TemplatePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Get the template component based on ID
  const TemplateComponent = id ? getTemplate(id) : null;
  
  if (!TemplateComponent) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Template Not Found</h2>
        <p className="text-gray-600 mb-6">Sorry, we couldn't find the template you're looking for.</p>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-dark"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand-primary">CV Template Preview</h1>
          <div className="space-x-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button 
              onClick={() => navigate('/cv-editor', { state: { templateId: id } })} 
              className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark"
            >
              Use This Template
            </button>
          </div>
        </div>
      </header>
      
      {/* Template Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-lg shadow-xl p-6 overflow-hidden">
          <TemplateComponent data={sampleData} />
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview; 