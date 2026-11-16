const About = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">About Me</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <img 
            src="https://images.unsplash.com/photo-1560250097-3b3e547c6a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
            alt="About me"
            className="rounded-lg shadow-lg mb-4"
          />
        </div>
        <div>
          <p className="text-gray-700 mb-4 leading-relaxed">
            I'm a dedicated full-stack developer with over 5 years of experience in creating
            robust web applications. My journey in software development started with a
            passion for solving complex problems through code.
          </p>
          <p className="text-gray-700 mb-4 leading-relaxed">
            I specialize in React, TypeScript, Node.js, and modern web technologies. I believe
            in writing clean, maintainable code and creating exceptional user experiences.
          </p>
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3">Skills</h3>
            <ul className="flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">React</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">TypeScript</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Node.js</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">JavaScript</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">HTML/CSS</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Docker</span>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;