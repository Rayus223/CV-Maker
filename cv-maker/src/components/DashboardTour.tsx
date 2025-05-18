import React from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

interface DashboardTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardTour: React.FC<DashboardTourProps> = ({ isOpen, onClose }) => {
  const steps: Step[] = [
    {
      target: '.profile-section',
      content: 'This is your profile section. Upload a photo and manage your personal information here.',
      disableBeacon: true,
    },
    {
      target: '.create-cv-button',
      content: 'Click here to start creating your new CV from scratch.',
    },
    {
      target: '.templates-section',
      content: 'Browse through our collection of professional templates. Click on any template to preview and use it.',
    },
    {
      target: '.recent-projects',
      content: 'All your CV projects will appear here for quick access.',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onClose();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={isOpen}
      continuous
      showSkipButton
      showProgress
      styles={{
        options: {
          primaryColor: '#4F46E5', // brand-primary color
          zIndex: 1000,
        },
        tooltip: {
          borderRadius: '8px',
        },
        buttonNext: {
          backgroundColor: '#4F46E5',
        },
        buttonBack: {
          marginRight: 10,
        },
      }}
      callback={handleJoyrideCallback}
    />
  );
};

export default DashboardTour; 