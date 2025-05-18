import React from 'react';
import { CVData } from '../../types/types';

interface RedAccentTemplateProps {
  data: CVData;
}

const RedAccentTemplate: React.FC<RedAccentTemplateProps> = ({ data }) => {
  return (
    <div className="bg-white text-gray-900 p-8 max-w-4xl mx-auto shadow-lg">
      {/* Header */}
      <div className="border-b-2 border-red-800 pb-4 flex justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 uppercase">
            {data.firstName} {data.lastName}
          </h1>
          <p className="text-lg text-red-800">{data.title}</p>
          
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div className="flex items-center">
              <span className="text-red-800 mr-2">●</span>
              <span>{data.email}</span>
            </div>
            <div className="flex items-center">
              <span className="text-red-800 mr-2">●</span>
              <span>{data.phone}</span>
            </div>
            <div className="flex items-center">
              <span className="text-red-800 mr-2">●</span>
              <span>{data.address}</span>
            </div>
            {data.links && data.links.map((link, index) => (
              <div key={index} className="flex items-center">
                <span className="text-red-800 mr-2">●</span>
                <span>{link.label}: {link.url}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-red-800">
          {data.profileImage ? (
            <img 
              src={data.profileImage.url} 
              alt={`${data.firstName} ${data.lastName}`} 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-red-800 text-4xl font-bold">
              {data.firstName && data.firstName[0]}
              {data.lastName && data.lastName[0]}
            </div>
          )}
        </div>
      </div>

      <div className="flex mt-6 gap-6">
        {/* Left column - 2/3 width */}
        <div className="w-2/3">
          {/* Experience Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold uppercase text-red-800 border-b border-red-800 mb-3">
              Experience
            </h2>
            {data.experience && data.experience.map((exp, index) => (
              <div key={index} className="mb-4">
                <h3 className="font-bold">Job Title {index + 1}</h3>
                <h4 className="text-red-800 font-medium">{exp.company}</h4>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center">
                    <span className="mr-2">◻</span>
                    <span>{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">◻</span>
                    <span>{exp.type}</span>
                  </div>
                </div>
                <ul className="mt-1 text-sm">
                  {exp.tasks && exp.tasks.map((task, taskIndex) => (
                    <li key={taskIndex}>{task}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Projects Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold uppercase text-red-800 border-b border-red-800 mb-3">
              Projects
            </h2>
            {data.projects && data.projects.map((project, index) => (
              <div key={index} className="mb-4">
                <h3 className="font-bold">{project.name}</h3>
                <h4 className="text-red-800">Funding agency/institution</h4>
                <div className="flex items-center text-sm">
                  <span className="mr-2">◻</span>
                  <span>{project.startDate} - {project.endDate}</span>
                </div>
                <p className="mt-1 text-sm">{project.description}</p>
              </div>
            ))}
          </div>

          {/* A Day of My Life Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold uppercase text-red-800 border-b border-red-800 mb-3">
              A day of my life
            </h2>
            <div className="flex justify-center">
              {/* Placeholder for pie chart - in a real app you'd use a chart library */}
              <div className="w-40 h-40 rounded-full bg-red-100 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs text-center">
                    <p>Day visualization</p>
                    <p>(Add your chart here)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - 1/3 width */}
        <div className="w-1/3">
          {/* My Life Philosophy Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold uppercase text-red-800 border-b border-red-800 mb-3">
              My Life Philosophy
            </h2>
            <blockquote className="italic text-sm">
              "{data.otherField || "Something smart or heartfelt, preferably in one sentence."}"
            </blockquote>
          </div>

          {/* Most Proud Of Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold uppercase text-red-800 border-b border-red-800 mb-3">
              Most Proud Of
            </h2>
            <div className="space-y-2">
              <div>
                <div className="flex items-center">
                  <span className="text-red-800 mr-2">🏆</span>
                  <span className="font-medium">Fantastic Achievement</span>
                </div>
                <p className="text-sm ml-6">and some details about it</p>
              </div>
              <div>
                <div className="flex items-center">
                  <span className="text-red-800 mr-2">❤️</span>
                  <span className="font-medium">Another achievement</span>
                </div>
                <p className="text-sm ml-6">more details about it of course</p>
              </div>
            </div>
          </div>

          {/* Strengths Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold uppercase text-red-800 border-b border-red-800 mb-3">
              Strengths
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.skills && data.skills.map((skill, index) => (
                <span 
                  key={index} 
                  className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm border border-gray-300 rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Languages Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold uppercase text-red-800 border-b border-red-800 mb-3">
              Languages
            </h2>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between">
                  <span>English</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <span key={dot} className="w-3 h-3 rounded-full bg-red-800 mx-0.5"></span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Spanish</span>
                  <div className="flex">
                    {[1, 2, 3, 4].map((dot) => (
                      <span key={dot} className="w-3 h-3 rounded-full bg-red-800 mx-0.5"></span>
                    ))}
                    <span className="w-3 h-3 rounded-full bg-gray-300 mx-0.5"></span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>German</span>
                  <div className="flex">
                    {[1, 2, 3].map((dot) => (
                      <span key={dot} className="w-3 h-3 rounded-full bg-red-800 mx-0.5"></span>
                    ))}
                    <span className="w-3 h-3 rounded-full bg-gray-300 mx-0.5"></span>
                    <span className="w-3 h-3 rounded-full bg-gray-300 mx-0.5"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold uppercase text-red-800 border-b border-red-800 mb-3">
              Education
            </h2>
            {data.education && data.education.map((edu, index) => (
              <div key={index} className="mb-4">
                <h3 className="font-bold">{edu.degree}</h3>
                <h4 className="text-red-800">{edu.institution}</h4>
                <div className="flex items-center text-sm">
                  <span className="mr-2">◻</span>
                  <span>{edu.startDate} - {edu.endDate}</span>
                </div>
                {edu.details && edu.details.length > 0 && (
                  <p className="text-sm">Thesis title: {edu.details[0]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedAccentTemplate; 