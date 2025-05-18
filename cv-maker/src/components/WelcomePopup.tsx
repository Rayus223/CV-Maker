import React from 'react';
import { motion } from 'framer-motion';

interface WelcomePopupProps {
  onClose: (startTour: boolean) => void;
  userName?: string;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ onClose, userName }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* Decorative header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-dark h-3"></div>
        
        <div className="p-6 sm:p-8">
          {/* Welcome message */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to CV Maker{userName ? `, ${userName}` : ''}! 🎉
            </h2>
            <p className="text-gray-600">
              We're excited to help you create your perfect CV
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-brand-primary text-xl mb-2">📝</div>
              <h3 className="font-medium text-gray-900 mb-1">Professional Templates</h3>
              <p className="text-sm text-gray-600">Choose from our collection of expertly designed templates</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-brand-primary text-xl mb-2">⚡</div>
              <h3 className="font-medium text-gray-900 mb-1">Easy Customization</h3>
              <p className="text-sm text-gray-600">Customize your CV with our intuitive editor</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-brand-primary text-xl mb-2">🎨</div>
              <h3 className="font-medium text-gray-900 mb-1">Modern Designs</h3>
              <p className="text-sm text-gray-600">Stand out with beautiful, contemporary layouts</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-brand-primary text-xl mb-2">💾</div>
              <h3 className="font-medium text-gray-900 mb-1">Auto-Save</h3>
              <p className="text-sm text-gray-600">Never lose your progress with automatic saving</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onClose(true)}
              className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors duration-200"
            >
              Get Started with Tour
            </button>
            <button
              onClick={() => onClose(false)}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Skip Tour
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomePopup; 