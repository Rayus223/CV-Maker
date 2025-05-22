export interface CVData {
  firstName: string;
  lastName: string;
  pronouns: string;
  title: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  profileImage?: {
    url: string;
    publicId: string;
  };
  skills: string[];
  links: {
    label: string;
    url: string;
  }[];
  experience: {
    company: string;
    position: string;
    type: string;
    startDate: string;
    endDate: string;
    tasks: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    location: string;
    startDate: string;
    endDate: string;
    grade?: string;
    details?: string[];
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string;
    startDate: string;
    endDate: string;
    link?: string;
    image?: {
      url: string;
      publicId: string;
    };
  }[];
  recentProjects: {
    id?: string;
    name: string;
    description: string;
    image?: {
      url: string;
      publicId: string;
    };
    link?: string;
    updatedAt?: string;
    createdAt?: string;
  }[];
  otherField?: string;
}

export const sampleData: CVData = {
  firstName: "John",
  lastName: "Doe",
  pronouns: "they/them",
  title: "Demo Subject, Placeholder",
  dob: "01/01/1970",
  phone: "+1-234-871-555-9",
  email: "john@example.com",
  address: "1600 Pennsylvania Ave, Washington DC, United States",
  profileImage: {
    url: "https://res.cloudinary.com/demo/image/upload/v1580125392/sample.jpg",
    publicId: "sample"
  },
  skills: [
    "C++, C, Python, Bash, PHP",
    "JavaScript, C#, Java, Kotlin, MySQL, PostgreSQL, Visual Basic, R",
    "HTML, CSS",
    "MS, Libre, GSuite Office, Adobe Acrobat",
    "Linux, Windows, macOS"
  ],
  links: [
    { label: "/example", url: "https://github.com/example" },
    { label: "/john-doe", url: "https://www.linkedin.com/in/john-doe/" },
    { label: "/John_Doe7373990", url: "https://www.xing.com/profile/John_Doe7373990/cv" }
  ],
  experience: [
    {
      company: "United States Government",
      position: "President",
      type: "Full-time",
      startDate: "Jan 2016",
      endDate: "Nov 2020",
      tasks: [
        "Do stuff",
        "- That included Stuff",
        "- and more Stuff",
        "Other Task"
      ]
    },
    {
      company: "McKienze Ltd",
      position: "Thieve",
      type: "Part-time",
      startDate: "Oct 2013",
      endDate: "Nov 2016",
      tasks: [
        "Do stuff",
        "- That included Stuff",
        "- and more Stuff",
        "Other Task",
        "- That included more Stuff",
        "- and other different Stuff",
        "tellus elementum sagittis vitae et",
        "aliquam sem et tortor consequat"
      ]
    },
    {
      company: "ACME Corp",
      position: "Occupation",
      type: "Traineeship",
      startDate: "Aug 2010",
      endDate: "Oct 2013",
      tasks: [
        "massa tempor nec feugiat nisl pretium fusce id"
      ]
    }
  ],
  education: [
    {
      institution: "Sample University",
      degree: "Management & Business Administration (Graduate Degree)",
      location: "Springfield",
      startDate: "Oct 2013",
      endDate: "Nov 2016",
      grade: "2.6",
      details: [
        "Degree: Diploma of Business",
        "Subsidiary subject: Psychology",
        "In-depth study: Thievery",
        "Thesis subject: ultrices gravida dictum fusce"
      ]
    },
    {
      institution: "Some School",
      degree: "Potenti nullam - sodales ut (Professional Training with A-Levels)",
      location: "Miami",
      startDate: "Sep 2010",
      endDate: "Sep 2013",
      grade: "3.4",
      details: [
        "Degrees: Potenti nullam & A-Levels (General higher education entrance qualification)",
        "Vocational Grades: interdisciplinary 1.7, subject-specific 1.1",
        "Grammar School Grade: 3.4",
        "Project subject: sit amet nulla facilisi"
      ]
    },
    {
      institution: "Middle school",
      degree: "School Education",
      location: "New York",
      startDate: "Sep 2005",
      endDate: "Jun 2010",
      grade: "2.5",
      details: [
        "Degree: Secondary school leaving certificate",
        "Elective Courses: Chemistry, Engineering, Art"
      ]
    }
  ],
  projects: [
    {
      name: "Personal Portfolio Website",
      description: "Designed and developed a responsive personal portfolio website to showcase my projects and skills.",
      technologies: "React, Tailwind CSS, TypeScript",
      startDate: "Jan 2023",
      endDate: "Feb 2023",
      link: "https://johndoe.com",
      image: {
        url: "https://res.cloudinary.com/demo/image/upload/v1580125392/portfolio.jpg",
        publicId: "portfolio"
      }
    },
    {
      name: "Task Management App",
      description: "Created a task management application with user authentication and task tracking features.",
      technologies: "Node.js, Express, MongoDB, React",
      startDate: "Mar 2022",
      endDate: "Jun 2022",
      link: "https://github.com/example/task-manager",
      image: {
        url: "https://res.cloudinary.com/demo/image/upload/v1580125392/taskapp.jpg",
        publicId: "taskapp"
      }
    }
  ],
  recentProjects: [
    {
      name: "E-commerce Website",
      description: "Built a full-featured e-commerce platform with product listings, cart, and checkout functionality.",
      image: {
        url: "https://res.cloudinary.com/demo/image/upload/v1580125392/ecommerce.jpg",
        publicId: "ecommerce"
      },
      link: "https://github.com/example/ecommerce"
    },
    {
      name: "Weather App",
      description: "Developed a weather application that provides real-time forecasts based on user location.",
      image: {
        url: "https://res.cloudinary.com/demo/image/upload/v1580125392/weather.jpg",
        publicId: "weather"
      },
      link: "https://weather-app-demo.com"
    },
    {
      name: "Blog Platform",
      description: "Created a content management system for bloggers with markdown support and image uploads.",
      image: {
        url: "https://res.cloudinary.com/demo/image/upload/v1580125392/blog.jpg",
        publicId: "blog"
      },
      link: "https://blog-demo.com"
    }
  ],
  otherField: "This is a custom field that can be used for any additional information."
}; 