import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            My Portfolio
          </Link>
          <ul className="flex space-x-6">
            <li><Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link></li>
            <li><Link to="/about" className="text-gray-600 hover:text-blue-600">About</Link></li>
            <li><Link to="/projects" className="text-gray-600 hover:text-blue-600">Projects</Link></li>
            <li><Link to="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;