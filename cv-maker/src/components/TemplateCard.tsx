import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  popular?: boolean;
  isPremium?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  id,
  name,
  description,
  thumbnail,
  popular = false,
  isPremium = false
}) => {
  const navigate = useNavigate();

  const handleTemplateClick = () => {
    navigate(`/canva-editor?template=${id}`);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
      <div className="h-40 bg-gray-100 relative cursor-pointer" onClick={handleTemplateClick}>
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-gray-400 text-sm">Template Preview</div>
          </div>
        )}
        
        {popular && (
          <div className="absolute top-0 right-0 bg-brand-primary text-white text-xs px-2 py-1 m-2 rounded">
            Popular
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium">{name}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
        
        <div className="mt-3 flex justify-between items-center">
          <span className={`font-medium ${isPremium ? 'text-amber-500' : 'text-brand-primary'}`}>
            {isPremium ? 'Premium' : 'Free'}
          </span>
          <button 
            onClick={handleTemplateClick}
            className="text-sm text-brand-primary hover:underline"
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard; 