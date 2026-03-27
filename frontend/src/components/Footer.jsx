import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-[#e8f2ef] dark:border-white/10 py-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="size-6 bg-primary rounded-md" />
              <h2 className="text-lg font-bold tracking-tight">Lumina AI</h2>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Pioneering the future of auditory learning. Designed for students, by students.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Platform</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-500 dark:text-gray-400">
              <li><a className="hover:text-primary transition-colors" href="#features">How it works</a></li>
              <li><Link className="hover:text-primary transition-colors" to="/register">Get Started</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/login">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Subjects</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-500 dark:text-gray-400">
              <li><Link className="hover:text-primary transition-colors" to="/session?subject=physics">Physics</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/session?subject=biology">Biology</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/session?subject=chemistry">Chemistry</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Account</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-500 dark:text-gray-400">
              <li><Link className="hover:text-primary transition-colors" to="/register">Register</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/login">Login</Link></li>
              <li><Link className="hover:text-primary transition-colors" to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[#e8f2ef] dark:border-white/5 text-sm text-gray-400">
          <p>© 2026 Lumina AI Technologies. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a className="hover:text-primary" href="#"><span className="material-symbols-outlined">public</span></a>
            <a className="hover:text-primary" href="#"><span className="material-symbols-outlined">alternate_email</span></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

