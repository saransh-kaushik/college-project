import { Link, useNavigate } from 'react-router-dom';
import { isLoggedIn, clearAuth } from '../services/api.js';

export default function Navbar() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-solid border-[#e8f2ef] dark:border-[#1fad7e]/20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl">graphic_eq</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Lumina AI</h2>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#features">Features</a>
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#community">Community</a>
          <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Login</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-primary/10" onClick={toggleDarkMode}>
            <span className="material-symbols-outlined dark:hidden">dark_mode</span>
            <span className="material-symbols-outlined hidden dark:block text-primary">light_mode</span>
          </button>

          {loggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-all"
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-500 border border-red-400/30 text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-red-500/20 transition-all"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/register"
              className="inline-flex bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

