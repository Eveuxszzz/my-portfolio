const Projects = () => {
  const projects = [
    {
      id: 1,
      title: "E-commerce Platform",
      description: "A full-stack e-commerce solution with React, Node.js, and PostgreSQL",
      image: "https://images.unsplash.com/photo-1556742049-0cf9fda9148c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      technologies: ["React", "Node.js", "PostgreSQL", "Express"]
    },
    {
      id: 2,
      title: "Task Management App",
      description: "A collaborative task management application with real-time updates",
      image: "https://images.unsplash.com/photo-1531492186233-b0d7efc69652?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      technologies: ["React", "TypeScript", "WebSockets", "Tailwind CSS"]
    },
    {
      id: 3,
      title: "Weather Dashboard",
      description: "Real-time weather data visualization and forecasting",
      image: "https://images.unsplash.com/photo-1591630738345-d3f2238adfd0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      technologies: ["React", "API Integration", "Chart.js", "TypeScript"]
    }
  ];

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-6">My Projects</h1>
      <p className="text-gray-700 mb-8">
        Here are some of my recent projects showcasing my skills in web development.
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <img 
              src={project.image} 
              alt={project.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;