import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    navigate('/dashboard'); // Mock login success
  };

  return (
    <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-4 bg-mesh relative overflow-hidden min-h-[80vh]">
      {/* Abstract background shapes */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md z-10">
        {/* Auth Card */}
        <div className="glass-card rounded-[2.5rem] shadow-2xl p-8 md:p-10">
          
          {/* Toggle Header */}
          <div className="flex p-1 bg-white/50 dark:bg-black/20 rounded-full mb-10 relative">
            <Link to="/login" className="flex-1 text-center py-3 text-sm font-medium rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all duration-300">
              Sign In
            </Link>
            <Link to="/register" className="flex-1 text-center py-3 text-sm font-bold rounded-full bg-white dark:bg-white/10 text-primary shadow-sm transition-all duration-300">
              Create Account
            </Link>
          </div>
          
          {/* Brand/Welcome */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-display tracking-tight mb-2">Join Lumina</h1>
            <p className="text-gray-500 text-sm">Create your AI tutor workspace and start learning.</p>
          </div>
          
          {/* Form */}
          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2 ml-1" htmlFor="name">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 text-lg">person</span>
                <input className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-gray-400" id="name" placeholder="John Doe" type="text" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2 ml-1" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 text-lg">mail</span>
                <input className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-gray-400" id="email" placeholder="name@company.com" type="email" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-gray-500 mb-2 ml-1" htmlFor="password">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 text-lg">lock</span>
                <input className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-gray-400" id="password" placeholder="••••••••" type="password" />
              </div>
            </div>
            
            <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#1fad7e] to-[#158f66] text-white font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 mt-4">
              Create Account
            </button>
          </form>
          
          {/* Divider */}
          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-primary/10"></div>
            </div>
            <span className="relative px-4 bg-background-light dark:bg-background-dark text-xs font-bold text-gray-500 uppercase tracking-widest">Or sign up with</span>
          </div>
          
          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 py-3 rounded-2xl border border-primary/10 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/10 hover:shadow-md transition-all group">
              <img alt="Google" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsmnDkrFkB88qE-D7C7xHRDv6C7qAe5s3w79wAdf-xDiTeOyR38m-6JjIv7xeD_txcgy_YoQFvrCOr0WfhkKmLCqp7F_Ci4kpmNbbLId7P6KJJ4A2WDGSNIiCupvMy5rLufz22Og8ohVREwU2JrnDoTXhHH77jqcgtrywKdIpc1U8O6e1bDI75Xef3QyJjEDZjYhT7KdVrmiimMeOPsPTeLMsCfIDd8aO3tz-QCuNHP1RJlVl0P7hjGuPAObbE4Gf17sTcmjxAoTg" />
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Google</span>
            </button>
            <button className="flex items-center justify-center gap-3 py-3 rounded-2xl border border-primary/10 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/10 hover:shadow-md transition-all group">
              <span className="material-symbols-outlined text-xl group-hover:text-primary transition-colors">terminal</span>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">GitHub</span>
            </button>
          </div>
          
          {/* Footer Text */}
          <p className="text-center mt-8 text-xs text-gray-500">
            By registering, you agree to Lumina AI's <a className="text-primary font-bold hover:underline" href="#">Terms</a> &amp; <a className="text-primary font-bold hover:underline" href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
