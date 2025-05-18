import React from 'react';
import DefaultTemplate from '../components/templates/DefaultTemplate';
import RedAccentTemplate from '../components/templates/RedAccentTemplate';

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  popular: boolean;
  isPremium: boolean;
  component: React.ComponentType<any>;
}

// Define available templates
const templates: Template[] = [
  {
    id: 'default',
    name: 'Professional Template',
    description: 'Clean and modern design for business professionals.',
    thumbnail: '/image/Thumbnail1.png',
    popular: true,
    isPremium: false,
    component: DefaultTemplate
  },
  {
    id: 'red-accent',
    name: 'Modern Minimal',
    description: 'A minimalist design focusing on clarity and simplicity.',
    thumbnail: '/image/Thumbnail2.png',
    popular: true,
    isPremium: false,
    component: RedAccentTemplate
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    description: 'Stand out with this bold and creative design for artists and designers.',
    thumbnail: '/templates/creative-portfolio-thumbnail.png',
    popular: true,
    isPremium: true,
    component: RedAccentTemplate // Currently using RedAccent as placeholder
  }
];

// Service functions
export const getTemplates = () => templates;

export const getTemplateById = (id: string) => templates.find(template => template.id === id);

export const getFeaturedTemplates = (count = 3) => 
  templates.slice(0, count);

export const getTemplate = (id: string) => {
  const template = templates.find(t => t.id === id);
  return template ? template.component : null;
};

// Get the default template component for "Create CV" button
export const getDefaultTemplate = () => templates[0].component;

export default {
  getTemplates,
  getTemplateById,
  getFeaturedTemplates,
  getTemplate,
  getDefaultTemplate
}; 