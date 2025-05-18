import React from 'react';
import { CVData } from '../../types/types';
import CVTemplate from '../CVTemplate';

interface DefaultTemplateProps {
  data: CVData;
}

const DefaultTemplate: React.FC<DefaultTemplateProps> = ({ data }) => {
  // This is just a wrapper around the existing CVTemplate component
  return <CVTemplate data={data} />;
};

export default DefaultTemplate; 