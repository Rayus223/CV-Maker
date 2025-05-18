import React from 'react';

interface OtherFieldFormProps {
  value: string;
  onChange: (value: string) => void;
}

const OtherFieldForm: React.FC<OtherFieldFormProps> = ({ value, onChange }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-medium text-gray-900 mb-4">Additional Information</h3>
      
      <div className="space-y-4">
        <div>
          <label 
            htmlFor="otherField" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Custom Field
          </label>
          <textarea
            id="otherField"
            rows={6}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter any additional information that you'd like to include on your CV..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
          <p className="mt-1 text-sm text-gray-500">
            This field can be used for any additional information you want to add to your CV.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtherFieldForm; 