import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import './App.css';

function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <div className={`min-h-screen bg-gray-50${isHome ? ' app-snap-shell' : ''}`}>
      {!isHome && <Header />}
      <main className={isHome ? 'app-snap-view' : 'container mx-auto px-4 py-8'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;