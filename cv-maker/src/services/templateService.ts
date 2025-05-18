import React from 'react';
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
    id: 'red-accent',
    name: 'Professional Template',
    description: 'Clean and modern design for business professionals.',
    thumbnail: '/templates/red-accent-thumbnail.png',
    popular: true,
    isPremium: false,
    component: RedAccentTemplate
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'A minimalist design focusing on clarity and simplicity.',
    thumbnail: '/templates/modern-minimal-thumbnail.png',
    popular: true,
    isPremium: false,
    component: RedAccentTemplate // Currently using RedAccent as placeholder
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

export default {
  getTemplates,
  getTemplateById,
  getFeaturedTemplates,
  getTemplate
}; 