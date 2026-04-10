import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { isLoggedIn } from '../services/api.js';

export default function Home() {
  const loggedIn = isLoggedIn();

  // Smart CTA: logged-in users go to dashboard, new users go to register
  const primaryCTA = loggedIn ? '/dashboard' : '/register';
  const primaryLabel = loggedIn ? 'Go to Dashboard' : 'Start Free Session';

  return (
    <>
      <main className="flex-1">
        {/* ── Hero Section ───────────────────────────────────────────── */}
        <section id="hero" className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                v2v Learning Engine Active
              </div>
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-background-dark dark:text-white">
                Learn Anything, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-indigo to-accent-violet">
                  Simply by Speaking.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
                The first AI tutor that listens, understands, and speaks back. Personalized learning at the speed of conversation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to={primaryCTA}
                  className="h-14 px-8 bg-primary text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl shadow-primary/30"
                >
                  <span className="material-symbols-outlined">mic</span>
                  {primaryLabel}
                </Link>
                <Link
                  to="/login"
                  className="h-14 px-8 border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-background-dark dark:text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">login</span>
                  {loggedIn ? 'Voice Session' : 'Sign In'}
                </Link>
              </div>
              {/* Trust indicators */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  No credit card needed
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  Free to start
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  Physics, Biology & Chemistry
                </span>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-accent-violet/30 rounded-[2rem] blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-50" />
              <div
                className="relative aspect-square w-full rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl bg-background-dark/5 dark:bg-white/5 flex items-center justify-center bg-cover bg-center"
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD4He3A6dk7ouqp5Ctq2B5PJLxeBkRCDovMWCoPfj5PsaEZ7LtMM3wjFcXhEJ6oOmUxw9F8uTu0aqWY8dWFMNYolPvqIkzvNzpXPG2wiSwi7T0vlzPCn5n6TTF8UKVBOzw3q5QL64j51ynlnnqZa_jmOF81CriAtQoQ-EdZdxpMIXH7JOKuG2VtVQ71HrqfZKHg-KVk1QmMRQEpxo1pdfWpwT9fFjzWUgiaMGSqKJA37LPRKPHenYkfbZCISKA92uk-WhPUVr2SnVk')" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 glass-card p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary rounded-full flex items-center justify-center text-white animate-pulse">
                        <span className="material-symbols-outlined">waves</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-background-dark dark:text-white">Lumina Tutor</p>
                        <p className="text-xs text-primary font-medium">Listening...</p>
                      </div>
                    </div>
                    <div className="flex gap-1 items-end h-6">
                      {[2, 5, 3, 6, 4].map((h, i) => (
                        <div key={i} className="w-1 bg-primary rounded-full" style={{ height: `${h * 4}px` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ── How it Works ────────────────────────────────────────────── */}
        <section id="features" className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Mastery in 3 Steps</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">From sign-up to speaking with your AI tutor in under 2 minutes.</p>
          </div>
          <div className="relative grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="size-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">person_add</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Step 1</span>
                <h3 className="text-xl font-bold">Create Account</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Sign up for free — no credit card required. Takes 30 seconds.</p>
              </div>
              <Link
                to="/register"
                className="mt-auto px-6 py-2.5 bg-primary/10 text-primary rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all"
              >
                Sign Up Free →
              </Link>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="size-20 rounded-2xl bg-accent-indigo/10 text-accent-indigo flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">science</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-accent-indigo uppercase tracking-widest">Step 2</span>
                <h3 className="text-xl font-bold">Pick a Subject</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Choose Physics, Biology, or Chemistry from your dashboard. Upload a PDF for extra context.</p>
              </div>
              <Link
                to={loggedIn ? '/dashboard' : '/login'}
                className="mt-auto px-6 py-2.5 bg-accent-indigo/10 text-accent-indigo rounded-xl font-bold text-sm hover:bg-accent-indigo hover:text-white transition-all"
              >
                Go to Dashboard →
              </Link>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="size-20 rounded-2xl bg-accent-violet/10 text-accent-violet flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">mic</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-accent-violet uppercase tracking-widest">Step 3</span>
                <h3 className="text-xl font-bold">Start Talking</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Hit the mic button in your Dashboard or jump straight into a Live Voice Session.</p>
              </div>
              <Link
                to={loggedIn ? '/session?subject=biology' : '/register'}
                className="mt-auto px-6 py-2.5 bg-accent-violet/10 text-accent-violet rounded-xl font-bold text-sm hover:bg-accent-violet hover:text-white transition-all"
              >
                Try Live Session →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Subject Cards ───────────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Choose Your Subject</h2>
            <p className="text-gray-600 dark:text-gray-400">Each subject has a dedicated AI tutor with deep expertise.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { id: 'physics', name: 'Physics', tutor: 'Nova', icon: 'bolt', color: 'from-blue-500/20 to-blue-600/5', badge: 'bg-blue-500/10 text-blue-400', topics: 'Mechanics • Thermodynamics • Electromagnetism' },
              { id: 'biology', name: 'Biology', tutor: 'Vera', icon: 'eco', color: 'from-primary/20 to-primary/5', badge: 'bg-primary/10 text-primary', topics: 'Cell Biology • Genetics • Physiology' },
              { id: 'chemistry', name: 'Chemistry', tutor: 'Aiden', icon: 'science', color: 'from-purple-500/20 to-purple-600/5', badge: 'bg-purple-500/10 text-purple-400', topics: 'Bonding • Reactions • Organic Chemistry' },
            ].map((sub) => (
              <Link
                key={sub.id}
                to={loggedIn ? `/session?subject=${sub.id}` : '/register'}
                className={`p-8 rounded-3xl bg-gradient-to-br ${sub.color} border border-white/10 dark:border-white/5 glass-card hover:scale-[1.03] transition-transform group flex flex-col gap-5`}
              >
                <div className={`w-14 h-14 rounded-2xl ${sub.badge} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-2xl">{sub.icon}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">{sub.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">Tutor: <span className="font-semibold">{sub.tutor}</span></p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{sub.topics}</p>
                </div>
                <div className="mt-auto flex items-center gap-2 font-bold text-sm group-hover:gap-4 transition-all">
                  <span>Start Session</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── PDF Upload Feature Banner ───────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="bg-gradient-to-r from-primary/10 via-accent-indigo/10 to-accent-violet/10 border border-primary/20 rounded-[2rem] p-10 md:p-14 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider w-fit">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                RAG-Powered PDF Chat
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Upload your textbook.<br />Chat about any page.</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                Attach any PDF — lecture slides, research papers, textbook chapters — and your AI tutor will answer questions
                directly from the content, grounded in your own material.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <Link
                  to={loggedIn ? '/dashboard' : '/register'}
                  className="px-8 py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 w-fit shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined">upload_file</span>
                  Try PDF Chat
                </Link>
                <span className="text-sm text-gray-500 self-center">Supports PDF, TXT, Markdown</span>
              </div>
            </div>
            {/* Visual */}
            <div className="shrink-0 w-full md:w-64 h-40 bg-background-dark/5 dark:bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <span className="material-symbols-outlined text-5xl text-primary/40">picture_as_pdf</span>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Drop PDF here</p>
              <div className="absolute bottom-3 right-3 size-6 bg-primary rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xs">add</span>
              </div>
            </div>
          </div>
        </section>


        {/* ── CTA Footer Section ────────────────────────────────────────── */}
        <section className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-indigo/40 to-transparent" />
            <div className="relative z-10 flex flex-col items-center gap-8">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight max-w-2xl">Ready to speak your way to success?</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="bg-white text-primary px-12 py-5 rounded-2xl text-xl font-bold hover:scale-105 transition-transform shadow-2xl shadow-black/20 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  Start Learning for Free
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-white/40 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:border-white hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">login</span>
                  Sign In
                </Link>
              </div>
              <p className="text-white/80 font-medium">No credit card required. Cancel anytime.</p>
            </div>
            <div className="absolute top-10 left-10 size-24 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-10 right-10 size-32 bg-accent-violet/30 rounded-full blur-2xl" />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
