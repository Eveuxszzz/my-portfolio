const Contact = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Get In Touch</h1>
      <p className="text-gray-700 mb-8">
        I'm always interested in hearing about new projects and opportunities.
        Feel free to reach out!
      </p>
      
      <form className="bg-white rounded-lg shadow-md p-6">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@example.com"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            id="message"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your message..."
          ></textarea>
        </div>
        
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Send Message
        </button>
      </form>
      
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Direct Contact</h3>
        <p className="text-gray-700 mb-2">
          <strong>Email:</strong> hello@example.com
        </p>
        <p className="text-gray-700 mb-2">
          <strong>LinkedIn:</strong> linkedin.com/in/yourprofile
        </p>
        <p className="text-gray-700">
          <strong>GitHub:</strong> github.com/yourusername
        </p>
      </div>
    </div>
  );
};

export default Contact;