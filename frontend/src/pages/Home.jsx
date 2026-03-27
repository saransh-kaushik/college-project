import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                v2v Learning Engine Active
              </div>
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-background-dark dark:text-white">
                Learn Anything, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-indigo to-accent-violet">Simply by Speaking.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
                The first AI tutor that listens, understands, and speaks back. Personalized learning at the speed of conversation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/session" className="h-14 px-8 bg-primary text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">mic</span>
                  Start Free Session
                </Link>
                <button className="h-14 px-8 border-2 border-primary/20 hover:border-primary/50 text-background-dark dark:text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">play_circle</span>
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-accent-violet/30 rounded-[2rem] blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-50"></div>
              <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl bg-background-dark/5 dark:bg-white/5 flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD4He3A6dk7ouqp5Ctq2B5PJLxeBkRCDovMWCoPfj5PsaEZ7LtMM3wjFcXhEJ6oOmUxw9F8uTu0aqWY8dWFMNYolPvqIkzvNzpXPG2wiSwi7T0vlzPCn5n6TTF8UKVBOzw3q5QL64j51ynlnnqZa_jmOF81CriAtQoQ-EdZdxpMIXH7JOKuG2VtVQ71HrqfZKHg-KVk1QmMRQEpxo1pdfWpwT9fFjzWUgiaMGSqKJA37LPRKPHenYkfbZCISKA92uk-WhPUVr2SnVk')" }}>
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent"></div>
                {/* Interactive Visualizer Overlay */}
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
                      <div className="w-1 bg-primary h-2 rounded-full"></div>
                      <div className="w-1 bg-primary h-5 rounded-full"></div>
                      <div className="w-1 bg-primary h-3 rounded-full"></div>
                      <div className="w-1 bg-primary h-6 rounded-full"></div>
                      <div className="w-1 bg-primary h-4 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2 rounded-2xl p-8 border border-[#d1e5df] dark:border-primary/20 glass-card">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-widest">Active Learners</p>
              <p className="text-background-dark dark:text-white text-4xl font-bold tracking-tight">50k+</p>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl p-8 border border-[#d1e5df] dark:border-primary/20 glass-card">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-widest">Success Rate</p>
              <p className="text-background-dark dark:text-white text-4xl font-bold tracking-tight">98%</p>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl p-8 border border-[#d1e5df] dark:border-primary/20 glass-card">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-widest">Daily Conversations</p>
              <p className="text-background-dark dark:text-white text-4xl font-bold tracking-tight">250k</p>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl p-8 border border-[#d1e5df] dark:border-primary/20 glass-card">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-widest">Languages</p>
              <p className="text-background-dark dark:text-white text-4xl font-bold tracking-tight">40+</p>
            </div>
          </div>
        </section>

        {/* How it Works / Timeline */}
        <section className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Mastery in Minutes</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Our intuitive process mimics natural human learning.</p>
          </div>
          <div className="relative grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="size-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">book_2</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Choose a Topic</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Pick any subject from organic chemistry to structural engineering.</p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="size-20 rounded-2xl bg-accent-indigo/10 text-accent-indigo flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">record_voice_over</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Start Talking</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Engage in a fluid, voice-to-voice dialogue. Ask questions, get answers.</p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="size-20 rounded-2xl bg-accent-violet/10 text-accent-violet flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">emoji_events</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold">Achieve Mastery</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Get analyzed feedback on your pronunciation and conceptual grasp.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="max-w-[1200px] mx-auto px-6 py-20 bg-primary/5 dark:bg-primary/10 rounded-[2.5rem] mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass-card rounded-3xl p-10 flex flex-col justify-between group overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-4">Accessible Everywhere</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-6">Built-in real-time transcription, instant translation, and screen-reader support for students of all abilities.</p>
                <button className="text-primary font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                  Explore Accessibility <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-[200px]">accessibility</span>
              </div>
            </div>
            <div className="glass-card rounded-3xl p-10 flex flex-col gap-6 items-center text-center">
              <div className="size-16 bg-accent-violet/20 rounded-full flex items-center justify-center text-accent-violet">
                <span className="material-symbols-outlined text-3xl">groups</span>
              </div>
              <h3 className="text-2xl font-bold">Global Community</h3>
              <p className="text-gray-600 dark:text-gray-400">Join 50k+ students in our study hubs across 40 countries.</p>
            </div>
            <div className="glass-card rounded-3xl p-10 flex flex-col gap-6">
              <div className="size-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <h3 className="text-2xl font-bold">Ultra-Low Latency</h3>
              <p className="text-gray-600 dark:text-gray-400">Conversation feels natural with sub-300ms response times.</p>
            </div>
            <div className="md:col-span-2 glass-card rounded-3xl p-10 flex items-center justify-between overflow-hidden relative">
              <div className="max-w-md">
                <h3 className="text-2xl font-bold mb-4">Mobile Ready</h3>
                <p className="text-gray-600 dark:text-gray-400">Learn on your commute. Lumina AI works seamlessly on iOS and Android browsers.</p>
              </div>
              <div className="hidden md:block w-40 h-64 bg-background-dark dark:bg-white/10 rounded-t-2xl border-x-4 border-t-4 border-primary/20 translate-y-10"></div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Choose the plan that fits your learning journey.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="p-10 rounded-3xl border border-[#d1e5df] dark:border-white/10 flex flex-col">
              <h4 className="text-xl font-bold mb-2">Free</h4>
              <p className="text-4xl font-bold mb-6">$0<span className="text-lg font-normal text-gray-500">/mo</span></p>
              <ul className="flex flex-col gap-4 mb-10 text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span> 1 hour daily voice</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span> 5 Core subjects</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span> Community access</li>
              </ul>
              <button className="w-full py-4 rounded-xl border-2 border-primary/20 font-bold hover:bg-primary/5 transition-colors mt-auto dark:hover:bg-white/5">Get Started</button>
            </div>
            {/* Pro */}
            <div className="p-10 rounded-3xl bg-background-dark dark:bg-white text-white dark:text-background-dark flex flex-col relative scale-105 shadow-2xl shadow-primary/20">
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">Most Popular</div>
              <h4 className="text-xl font-bold mb-2">Pro Scholar</h4>
              <p className="text-4xl font-bold mb-6">$19<span className="text-lg font-normal opacity-60">/mo</span></p>
              <ul className="flex flex-col gap-4 mb-10">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span> Unlimited voice chat</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span> All 40+ subjects</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span> Offline review mode</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span> AI Study Plan Generator</li>
              </ul>
              <button className="w-full py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all mt-auto shadow-xl shadow-primary/40">Unlock Pro</button>
            </div>
            {/* Team */}
            <div className="p-10 rounded-3xl border border-[#d1e5df] dark:border-white/10 flex flex-col">
              <h4 className="text-xl font-bold mb-2">Study Groups</h4>
              <p className="text-4xl font-bold mb-6">$49<span className="text-lg font-normal text-gray-500">/mo</span></p>
              <ul className="flex flex-col gap-4 mb-10 text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span> Up to 5 members</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span> Shared knowledge base</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span> Group analytics</li>
              </ul>
              <button className="w-full py-4 rounded-xl border-2 border-primary/20 font-bold hover:bg-primary/5 transition-colors mt-auto dark:hover:bg-white/5">Create Group</button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-[1200px] mx-auto px-6 py-20 border-t border-[#e8f2ef] dark:border-white/5">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 leading-tight">Join the voice <br />revolution in education.</h2>
              <div className="flex gap-4 mb-8">
                <div className="flex -space-x-4">
                  <img alt="user" className="size-12 rounded-full border-4 border-background-light dark:border-background-dark object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpB007yBLDwu32F7MX7XhPZMNpf8aEZ09ksU7LENfW0Z2O16uMHzRRtHuqJgITy4YKZTeSRLZVuLtK2wuK9D1x6Cv9lXpzuv2rxuop7yN78KAl429fKbX10a70P4_muyWUqGKi6bQTFJbUX7BmBBnhsqJgRfsx9zzwjoFS1PyB4ElHRYHTDLvBxT0bPP3fSNdOjhlNgLaZBj8NU-wXm8iiTICoAUBnTEkV7jNw8m27F-CbzJJsLcBW39x2LVPRsyziKnONWRcODr8" />
                  <img alt="user" className="size-12 rounded-full border-4 border-background-light dark:border-background-dark object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVy0XCcL4aqjghz2fGbwq1c6LPXqMs36S2CvGYzXngwRqk8MpparIk0v4-Yya9B6ss5kU9K43wsWCwiejxwm0LnBJZ_9cLk-U1kyqc3SMnoRSdrFZ3MHvRZwSso9Vhgu_lDyYG5zCjx4o-6lAK_7oJSvPCHnMeUQzGmrv7FECen4_1ojzZ22L9FOc9ijVZkLdlUKi0EDA0DGg2hrzHG-OzL3p4anFZ19WjGd8hICfT1SyW5Y7l99OiqY7hE1b35eFF-44X1TerWyk" />
                  <img alt="user" className="size-12 rounded-full border-4 border-background-light dark:border-background-dark object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuByw-6TwC6biZ6tH7NP1bjRPd-5qMSlLtTmifu7RUBL3F3soobEg7OOwoKL7vCyDzryfFzk7B95cuH_Fss3NRgtrA197Y1sJovXLdJ4aCc4rs5sx4iCOygRwmch3K4rE03xnq2Hu3XkKf5WYF1BKbWuBK6P1Mc5pwNkcLt0m60bFaztIZ01X1wepPAWI3aRAsDR3ifbH2e3MkzOi4XVBgQ2uRkpk6EtKzQNdopyscACSsLnK8YZQ89VUEl1kqTdpdFDKwDqyEXubVs" />
                  <div className="size-12 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold border-4 border-background-light dark:border-background-dark">
                    +50k
                  </div>
                </div>
                <div className="text-sm font-medium">
                  <p>50,000+ Students</p>
                  <div className="flex text-yellow-500">
                    <span className="material-symbols-outlined text-xs fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-xs fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-xs fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-xs fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-xs fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-card p-10 rounded-[2.5rem] relative">
              <span className="material-symbols-outlined text-primary text-6xl absolute top-6 right-10 opacity-20">format_quote</span>
              <p className="text-xl font-medium italic leading-relaxed mb-8">
                "Lumina transformed my prep for the MCAT. Being able to explain complex biological pathways out loud and have an AI correct my logic in real-time is a game changer."
              </p>
              <div className="flex items-center gap-4">
                <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">SM</div>
                <div>
                  <h5 className="font-bold">Sarah Mitchell</h5>
                  <p className="text-sm text-gray-500">Medical Student, Johns Hopkins</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-indigo/40 to-transparent"></div>
            <div className="relative z-10 flex flex-col items-center gap-8">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight max-w-2xl">Ready to speak your way to success?</h2>
              <button className="bg-white text-primary px-12 py-5 rounded-2xl text-xl font-bold hover:scale-105 transition-transform shadow-2xl shadow-black/20">
                Start Learning for Free
              </button>
              <p className="text-white/80 font-medium">No credit card required. Cancel anytime.</p>
            </div>
            {/* Decorative floating elements */}
            <div className="absolute top-10 left-10 size-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 right-10 size-32 bg-accent-violet/30 rounded-full blur-2xl"></div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
