import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/session.css';

export default function Session() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const mediaStreamRef = useRef(null);
  
  // Minimal logic for the UI interactions
  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const endSession = () => {
    navigate('/dashboard');
  };

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] w-full flex-col overflow-hidden bg-background-dark text-white font-display">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] size-[600px] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] size-[600px] rounded-full bg-primary/10 blur-[120px]"></div>
      </div>

      {/* Header Section */}
      <header className="flex items-center justify-between px-8 py-6 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="size-8 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Biology 101: Plant Life</h2>
              <div className="flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-xs text-primary/80 uppercase tracking-widest font-semibold">Live Session</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-card-dark px-4 py-2 rounded-lg border border-primary/20">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span className="text-sm font-bold tracking-wider">00:15:42</span>
          </div>
          <div className="size-10 rounded-full border-2 border-primary/40 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-scoKYIbsDWlOCTELLe5_8hmTSCPjWWnZxtCYMjzN4L7pUUl00KdcvZ1pKvmLNzRn8aQgUy5v3ou-IVPiVd5iek3hXt4QYlGyX9JBqTFym49oOLNpRoXlqEtD-Log-WQlnW9lhplI4kT0DdZBFZdqLpGg0JItKR9bWOdtq-Jq3XauF2o-tpyUHPTguIU4BcYznvK3Xs6Dzjz3QjFU0rqFM9RKcU_3vbHaD50Yge07sMigiK6jYEfTIG0p78cB4h41RyS_ITNhJsI')" }}></div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 relative px-8 pb-32 gap-8 z-20">
        {/* Central V2V Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          
          {/* AI Orb Visualization */}
          <div className="relative flex items-center justify-center w-full max-w-2xl aspect-square">
            {/* Ambient Glows */}
            <div className="absolute inset-0 orb-gradient animate-pulse"></div>
            <div className="absolute inset-20 border-[1px] border-primary/10 rounded-full"></div>
            <div className="absolute inset-40 border-[1px] border-primary/20 rounded-full"></div>
            
            {/* The Fluid Orb (Conceptual SVG) */}
            <div className="relative size-64 flex items-center justify-center">
              <svg className={`w-full h-full text-primary transition-all duration-700 ${isRecording ? 'scale-110' : 'scale-100'}`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="orb-fill">
                    <stop offset="0%" stopColor="#1fad7e" stopOpacity="0.8"></stop>
                    <stop offset="100%" stopColor="#1fad7e" stopOpacity="0.2"></stop>
                  </radialGradient>
                </defs>
                <path d="M44.7,-76.4C58.1,-69.2,69.5,-57.4,77.5,-43.8C85.5,-30.2,90.1,-15.1,89.2,-0.5C88.3,14.1,81.9,28.2,73.1,40.4C64.3,52.6,53,62.9,40.3,70.9C27.6,78.9,13.8,84.6,0.1,84.4C-13.6,84.2,-27.1,78.1,-39.7,70C-52.3,61.9,-63.9,51.8,-71.8,39.5C-79.7,27.2,-83.9,12.7,-82.9,-1.6C-81.9,-15.9,-75.7,-30,-67.2,-42.1C-58.7,-54.2,-47.9,-64.3,-35.3,-71.9C-22.7,-79.5,-11.3,-84.6,2.1,-88.2C15.6,-91.8,29.1,-93.8,44.7,-76.4Z" fill="url(#orb-fill)" transform="translate(100 100)"></path>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-white">graphic_eq</span>
              </div>
            </div>
          </div>
          
          {/* Real-time Transcription */}
          <div className="absolute bottom-6 w-full max-w-2xl px-8 py-6 rounded-xl bg-black/30 backdrop-blur-sm border border-white/5">
            <div className="flex flex-col gap-3 font-body">
              <div className="flex gap-3 text-sm" style={{ opacity: 0.8 }}>
                <span className="font-bold text-primary">AI Tutor</span>
                <p>Excellent. Now, why do you think plants need sunlight for this process?</p>
              </div>
              <div className="flex gap-3 text-lg leading-relaxed">
                <span className="font-bold text-accent-ochre">You</span>
                <p>Is it because the <span className="text-accent-ochre font-semibold underline decoration-accent-ochre/30">chlorophyll</span> needs energy to convert CO2 into glucose?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Concepts Sidebar */}
        <aside className="w-80 flex flex-col glass-card rounded-xl overflow-hidden self-stretch my-4">
          <div className="p-6 border-b border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold">Key Concepts</h3>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded uppercase tracking-tighter">Live Analysis</span>
            </div>
            <p className="text-xs text-white/50 font-body">Tracking session context...</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            
            {/* Concept Item 1 */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-primary/40 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-sm">eco</span>
                </div>
                <h4 className="font-bold text-primary group-hover:text-primary transition-colors">Chlorophyll</h4>
              </div>
              <p className="text-sm text-white/70 font-body leading-snug">The green pigment in plants responsible for light absorption during photosynthesis.</p>
            </div>
            
            {/* Concept Item 2 */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-primary/40 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-8 rounded bg-accent-ochre/20 flex items-center justify-center text-accent-ochre">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                </div>
                <h4 className="font-bold text-accent-ochre group-hover:text-accent-ochre transition-colors">ATP</h4>
              </div>
              <p className="text-sm text-white/70 font-body leading-snug">Energy currency of the cell produced during photosynthesis. Adenosine triphosphate.</p>
            </div>
            
            {/* Concept Item 3 (New Detection) */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-8 rounded bg-primary flex items-center justify-center text-background-dark">
                  <span className="material-symbols-outlined text-sm">biotech</span>
                </div>
                <h4 className="font-bold text-white">Stomata</h4>
              </div>
              <p className="text-sm text-white/70 font-body leading-snug italic">Capturing definition...</p>
            </div>
            
          </div>
        </aside>
      </main>

      {/* Floating Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 glass-card rounded-full shadow-2xl z-50">
        
        {/* Voice Level Visualizer (Small) */}
        <div className="flex items-end gap-0.5 h-6 px-2">
          <div className="w-1 h-3 bg-primary/40 rounded-full"></div>
          <div className="w-1 h-5 bg-primary rounded-full"></div>
          <div className="w-1 h-2 bg-primary/60 rounded-full"></div>
          <div className="w-1 h-4 bg-primary/80 rounded-full"></div>
          <div className="w-1 h-6 bg-primary rounded-full"></div>
        </div>
        
        <div className="w-[1px] h-8 bg-white/10"></div>
        
        <div className="flex items-center gap-4">
          <button onClick={toggleRecording} className={`group relative size-12 rounded-full flex items-center justify-center transition-colors ${isRecording ? 'bg-primary/20 text-primary' : 'bg-white/5 hover:bg-white/10 text-white'}`}>
            <span className="material-symbols-outlined">{isRecording ? "mic" : "mic_off"}</span>
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity">Toggle Mic</span>
          </button>
          <button className="group relative size-12 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-colors">
            <span className="material-symbols-outlined">settings_voice</span>
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity">Voice Settings</span>
          </button>
        </div>
        
        <div className="w-[1px] h-8 bg-white/10"></div>
        
        <button onClick={endSession} className="flex items-center gap-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-full font-bold transition-all">
          <span className="material-symbols-outlined">call_end</span>
          <span>End Session</span>
        </button>
      </div>

    </div>
  );
}
