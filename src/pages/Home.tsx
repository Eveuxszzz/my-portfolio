const Home = () => {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to My Portfolio</h1>
      <p className="text-xl text-gray-600 mb-8">Full Stack Developer & Designer</p>
      <div className="max-w-2xl mx-auto">
        <img 
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          alt="Developer workspace"
          className="rounded-lg shadow-lg mb-8"
        />
        <p className="text-gray-700 leading-relaxed">
          I'm a passionate developer who loves creating beautiful, functional web applications.
          With expertise in React, TypeScript, and modern web technologies, I bring ideas to life
          through clean code and thoughtful design.
        </p>
      </div>
    </div>
  );
};

export default Home;