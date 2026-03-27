import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 h-screen overflow-hidden flex font-body w-full">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-icons-outlined text-sm">school</span>
            </div>
            <h1 className="font-display font-bold text-lg tracking-tight">EduFlow AI</h1>
          </Link>

          <div className="space-y-6">
            <section>
              <h2 className="font-display text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-2">Learning Journeys</h2>
              <nav className="space-y-1">
                <a className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium transition-colors" href="#">
                  <span className="material-icons-outlined text-sm">science</span>
                  Bio-Chemistry Path
                  <span className="ml-auto w-2 h-2 bg-primary rounded-full"></span>
                </a>
                <a className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors" href="#">
                  <span className="material-icons-outlined text-sm">functions</span>
                  Calculus II
                </a>
                <a className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors" href="#">
                  <span className="material-icons-outlined text-sm">code</span>
                  Neural Networks
                </a>
              </nav>
            </section>

            <section>
              <h2 className="font-display text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-2">Past Conversations</h2>
              <div className="space-y-1">
                <a className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg" href="#">ATP Synthesis Basics</a>
                <a className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg" href="#">Derivatives Review</a>
                <a className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg" href="#">Intro to React Hooks</a>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img className="w-10 h-10 rounded-full border-2 border-primary/20" alt="Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA--w8i16Tksmytu4j5pPp0KKN924hW5KmmpDiFsrQjhZ6KHJlHSJ734OWe5gpm_y7HxQLX56JP2eDhu6rX1eJXvCkX52mtBTfM1gCqFp3-1D8T-A2zzLO81cDG7Po21uYizF3v_IzeGRZvwSY1aCatjeVMiWV5c1u23KK2gwxqr3QlgBUCjvrU6CFfCvov-am372KoXQMh1bFGS5JPj9MG5wzYtZyVJCyYm57GINCdblfCSGkQAlQ_P-Oxz5QJDjUQe-eupXcEZcs" />
            <div>
              <p className="text-sm font-bold">Alex Chen</p>
              <p className="text-xs text-slate-500">Premium Scholar</p>
            </div>
            <button className="ml-auto text-slate-400 hover:text-slate-600">
              <span className="material-icons-outlined">settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-display font-bold text-xl">Bio-Chemistry: ATP Synthesis</h2>
            <span className="px-2 py-0.5 bg-accent-ochre/20 text-accent-ochre text-[10px] font-bold rounded-full border border-accent-ochre/30">MODULE 4</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              <span className="material-icons-outlined text-sm">share</span> Share Journey
            </button>
          </div>
        </header>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-background-light dark:bg-background-dark">
          <div className="max-w-4xl mx-auto space-y-10">
            {/* User Message */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center">
                <span className="material-icons-outlined text-sm">person</span>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Can you explain the role of ATP synthase in the electron transport chain? A Python simulation or a diagram would really help me visualize the flow.
                </p>
              </div>
            </div>

            {/* AI Response */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded bg-primary flex-shrink-0 flex items-center justify-center text-white">
                <span className="material-icons-outlined text-sm">auto_awesome</span>
              </div>
              <div className="flex-1 pt-1 space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                  <h3 className="font-display text-xl font-bold mb-2">The Molecular Turbine: ATP Synthase</h3>
                  <p className="text-slate-700 dark:text-slate-300">Think of ATP synthase as a macroscopic hydroelectric dam at the molecular level. It uses the proton gradient (concentration difference) across the inner mitochondrial membrane to drive the synthesis of ATP.</p>
                </div>

                {/* Diagram Component */}
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-primary flex items-center gap-2">
                      <span className="material-icons-outlined text-xs">schema</span> DIAGRAM: ELECTRON FLOW
                    </span>
                    <button className="text-slate-400 hover:text-slate-600">
                      <span className="material-icons-outlined text-sm">open_in_full</span>
                    </button>
                  </div>
                  <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      {/* Simple SVG Flow representation */}
                      <div className="flex gap-8 items-center">
                        <div className="px-4 py-2 bg-primary/20 border border-primary/40 rounded text-xs font-bold">Proton Gradient</div>
                        <span className="material-symbols-outlined text-primary">arrow_forward</span>
                        <div className="px-4 py-2 bg-primary border border-primary rounded text-xs font-bold text-white shadow-lg shadow-primary/20">ATP Synthase</div>
                        <span className="material-symbols-outlined text-primary">arrow_forward</span>
                        <div className="px-4 py-2 bg-accent-ochre/20 border border-accent-ochre/40 rounded text-xs font-bold">ATP Energy</div>
                      </div>
                      <p className="text-[10px] uppercase tracking-tighter text-slate-400">Simplified Mechanism Representation</p>
                    </div>
                  </div>
                </div>

                {/* Code Snippet */}
                <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">atp_simulation.py</span>
                    <button className="text-slate-400 hover:text-white transition-colors">
                      <span className="material-icons-outlined text-sm">content_copy</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-x-auto text-slate-300"><code><span className="text-primary">class</span> <span className="text-accent-ochre">ATPSynthase</span>:
    <span className="text-primary">def</span> <span className="text-blue-400">__init__</span>(self, proton_gradient):
        self.gradient = proton_gradient
        self.atp_count = <span className="text-orange-400">0</span>

    <span className="text-primary">def</span> <span className="text-blue-400">rotate</span>(self):
        <span className="text-slate-500"># Simulation of rotor turning per proton flow</span>
        <span className="text-primary">if</span> self.gradient &gt; <span className="text-orange-400">0</span>:
            self.atp_count += <span className="text-orange-400">0.33</span> 
            self.gradient -= <span className="text-orange-400">1</span>
            <span className="text-primary">return</span> <span className="text-green-400">"Synthesized 1/3 ATP"</span></code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Input Bar */}
        <div className="p-6 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end gap-3 bg-background-light dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:border-primary transition-all">
              <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                <span className="material-icons-outlined">attach_file</span>
              </button>
              <textarea className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none custom-scrollbar outline-none" placeholder="Ask a follow-up or upload a paper..." rows="1"></textarea>
              <Link to="/session" className="v2v-pulse w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                <span className="material-icons-outlined">mic</span>
              </Link>
              <button className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-[#158f66] shadow-lg shadow-primary/20 transition-all">
                <span className="material-icons-outlined">send</span>
              </button>
            </div>
            <p className="text-[10px] text-center mt-3 text-slate-400 font-medium">EduFlow AI can make mistakes. Verify important information.</p>
          </div>
        </div>
      </main>

      {/* Contextual Resource Panel */}
      <aside className="w-80 bg-slate-50 dark:bg-slate-900/40 border-l border-slate-200 dark:border-slate-800 flex flex-col p-6 hidden xl:flex shrink-0">
        <h2 className="font-display font-bold text-sm tracking-widest uppercase text-slate-400 mb-6">Study Resources</h2>
        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
          {/* Resource Card */}
          <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 group cursor-pointer hover:border-primary/50 transition-all">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
                <span className="material-icons-outlined text-sm">picture_as_pdf</span>
              </div>
              <div>
                <h3 className="text-xs font-bold mb-1">Cell_Metabolism_Ch4.pdf</h3>
                <p className="text-[10px] text-slate-500 italic">Page 142 • Highlighted by AI</p>
              </div>
            </div>
          </div>
          {/* Note Card */}
          <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 group cursor-pointer hover:border-primary/50 transition-all">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <span className="material-icons-outlined text-sm">notes</span>
              </div>
              <div>
                <h3 className="text-xs font-bold mb-1">MIT OpenCourseWare Notes</h3>
                <p className="text-[10px] text-slate-500">Curated Summary • 2.4k Views</p>
              </div>
            </div>
          </div>
          {/* Community Note */}
          <div className="bg-accent-ochre/5 p-4 rounded-xl border border-accent-ochre/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icons-outlined text-xs text-accent-ochre">groups</span>
              <span className="text-[10px] font-bold text-accent-ochre tracking-widest uppercase">Student Discussion</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 italic mb-2">"Wait, so the F0 unit is the one that actually rotates? I thought it was F1..."</p>
            <div className="flex items-center gap-2">
              <img className="w-4 h-4 rounded-full" alt="Student" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnQk32vBK8qqnzoJt4PSE7V52ybf17sjgobk3vULKpWqXDfyHbLtM-znN_CGrMMinTz451JP8l03JqtjH_F6FhRzKBtgmlH1JrDF5J8t0l6EHXkpVfPDLj0-gB5pIWFRf7340qR0gR0trEHQA2-c3WO_2LlhuJgkdFnTWbDWnUeed24v7pf2yJ4H6OrOY7NowymkCuddEksRJcfBENTIi6csM4sEu4vcO6cHoMGoqkKCaYMuZH-fsmVEVZqbGWUQIUerCPUtWyEn8" />
              <span className="text-[10px] font-bold">@sarah_bio</span>
              <button className="ml-auto text-primary text-[10px] font-bold underline">Reply</button>
            </div>
          </div>
          {/* Quick Fact */}
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">tips_and_updates</span> Quick Fact
            </h4>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              A single ATP synthase can produce about 100 molecules of ATP per second. That's over 6,000 rotations per minute!
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-display font-bold text-sm tracking-widest uppercase text-slate-400 mb-4 px-1">Upcoming Quiz</h2>
          <div className="p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold">Metabolic Pathways</span>
              <span className="text-[10px] text-slate-400">Tomm, 10 AM</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[65%]"></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">65% Readiness based on chat</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
