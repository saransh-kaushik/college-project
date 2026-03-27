import { Link } from 'react-router-dom';

export default function Navbar() {
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
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
          <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Community</a>
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Pricing</a>
        </nav>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-primary/10" onClick={toggleDarkMode}>
            <span className="material-symbols-outlined dark:hidden">dark_mode</span>
            <span className="material-symbols-outlined hidden dark:block text-primary">light_mode</span>
          </button>
          <Link to="/session" className="inline-flex bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
