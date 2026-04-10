import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { user as userApi, sessions as sessionsApi, chat as chatApi, resources as resourcesApi, getAuthData, clearAuth } from '../services/api.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: localUser } = getAuthData();

  const [profile, setProfile] = useState(localUser || { name: 'Loading...', tier: 'Free' });
  const [journeys, setJourneys] = useState([
    { id: 'biology', name: 'Bio-Chemistry Path', icon: 'science' },
    { id: 'physics', name: 'Physics Fundamentals', icon: 'bolt' },
    { id: 'chemistry', name: 'Chemistry Lab', icon: 'biotech' },
  ]);
  const [pastSessions, setPastSessions] = useState([]);
  const [activeJourney, setActiveJourney] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      content: "Hello! I'm your EduFlow AI tutor. Select a learning journey from the sidebar, or ask me anything to get started. You can also click the mic icon to start a live voice session! 🎙️",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [studyResources, setStudyResources] = useState(null);
  const [masteryData, setMasteryData] = useState(null);
  const chatEndRef = useRef(null);

  // ── Initial data load ────────────────────────────────────────────────────────
  useEffect(() => {
    userApi.getProfile().then(setProfile).catch(console.warn);
    userApi.getJourneys().then((d) => setJourneys(d.journeys)).catch(console.warn);
    userApi.getSessions().then((d) => setPastSessions(d.sessions || [])).catch(console.warn);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Journey selection ─────────────────────────────────────────────────────────
  const selectJourney = async (journey) => {
    setActiveJourney(journey);
    // Start a new backend session for this subject
    try {
      const { session_id } = await sessionsApi.start(journey.id, journey.name);
      setSessionId(session_id);
    } catch (err) {
      console.warn('Could not start session:', err.message);
    }
    // Load resources
    resourcesApi.get(journey.name.split(' ')[0]).then(setStudyResources).catch(console.warn);
  };

  // ── Text chat send ────────────────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setSending(true);

    try {
      let sid = sessionId;
      if (!sid && activeJourney) {
        const { session_id } = await sessionsApi.start(activeJourney.id);
        setSessionId(session_id);
        sid = session_id;
      }

      const data = await chatApi.sendMessage(sid, userMsg);

      setMessages((prev) => [...prev, { role: 'agent', content: data.ai_response }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'agent',
        content: `⚠️ ${err.message || 'Failed to get a response. Make sure the backend is running.'}`,
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side type guard (backend also enforces this)
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt'].includes(ext || '')) {
      setMessages((prev) => [...prev, {
        role: 'agent',
        content: `❌ Only .pdf and .txt files are supported. You tried to upload a .${ext} file.`,
      }]);
      return;
    }

    try {
      setMessages((prev) => [...prev, { role: 'user', content: `📎 Uploading: ${file.name}…` }]);
      const result = await chatApi.uploadFile(file, sessionId);
      setMessages((prev) => [...prev, {
        role: 'agent',
        content: `✅ **${file.name}** uploaded and processed into ${result.chunk_count} chunks. I can now answer questions from its content!`,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'agent', content: `❌ Upload failed: ${err.message}` }]);
    } finally {
      // Reset input so the same file can be re-uploaded if needed
      e.target.value = '';
    }
  };

  const handleShare = async () => {
    if (!sessionId) return;
    try {
      const { share_url } = await sessionsApi.share(sessionId);
      navigator.clipboard.writeText(share_url).catch(() => {});
      alert(`Share link copied: ${share_url}`);
    } catch (err) {
      alert('Could not generate share link');
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const currentTitle = activeJourney
    ? journeys.find((j) => j.id === activeJourney.id)?.name || 'Learning Session'
    : 'Welcome to EduFlow AI';

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
                {journeys.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => selectJourney(j)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
                      activeJourney?.id === j.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="material-icons-outlined text-sm">{j.icon}</span>
                    {j.name}
                    {activeJourney?.id === j.id && <span className="ml-auto w-2 h-2 bg-primary rounded-full" />}
                  </button>
                ))}
              </nav>
            </section>

            {pastSessions.length > 0 && (
              <section>
                <h2 className="font-display text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-2">Past Conversations</h2>
                <div className="space-y-1">
                  {pastSessions.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      className="w-full block px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg text-left truncate"
                    >
                      {s.title || s.subject}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {profile.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-bold">{profile.name}</p>
              <p className="text-xs text-slate-500">{profile.tier || 'Free'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="ml-auto text-slate-400 hover:text-red-500 transition-colors"
            >
              <span className="material-icons-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-display font-bold text-xl">{currentTitle}</h2>
            {activeJourney && (
              <span className="px-2 py-0.5 bg-accent-ochre/20 text-accent-ochre text-[10px] font-bold rounded-full border border-accent-ochre/30">
                ACTIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {sessionId && (
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <span className="material-icons-outlined text-sm">share</span> Share Journey
              </button>
            )}
          </div>
        </header>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-background-light dark:bg-background-dark">
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.map((msg, i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'agent'
                    ? 'bg-primary text-white'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}>
                  <span className="material-icons-outlined text-sm">
                    {msg.role === 'agent' ? 'auto_awesome' : 'person'}
                  </span>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded bg-primary flex-shrink-0 flex items-center justify-center text-white">
                  <span className="material-icons-outlined text-sm">auto_awesome</span>
                </div>
                <div className="flex-1 pt-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Smart Input Bar */}
        <div className="p-6 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={sendMessage}>
              <div className="relative flex items-end gap-3 bg-background-light dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:border-primary transition-all">
                <label className="p-2 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Attach file">
                  <span className="material-icons-outlined">attach_file</span>
                  <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
                </label>
                <textarea
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none custom-scrollbar outline-none"
                  placeholder={activeJourney ? `Ask about ${activeJourney.name}…` : "Ask a follow-up or upload a paper..."}
                  rows="1"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
                />
                <Link
                  to={activeJourney ? `/session?subject=${activeJourney.id}` : '/session'}
                  className="v2v-pulse w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                  title="Start voice session"
                >
                  <span className="material-icons-outlined">mic</span>
                </Link>
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-[#158f66] shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  <span className="material-icons-outlined">send</span>
                </button>
              </div>
            </form>
            <p className="text-[10px] text-center mt-3 text-slate-400 font-medium">EduFlow AI can make mistakes. Verify important information.</p>
          </div>
        </div>
      </main>

      {/* Contextual Resource Panel */}
      <aside className="w-80 bg-slate-50 dark:bg-slate-900/40 border-l border-slate-200 dark:border-slate-800 flex flex-col p-6 hidden xl:flex shrink-0">
        <h2 className="font-display font-bold text-sm tracking-widest uppercase text-slate-400 mb-6">Study Resources</h2>
        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
          {studyResources ? (
            <>
              {studyResources.documents?.map((doc, i) => (
                <div key={i} className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 group cursor-pointer hover:border-primary/50 transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-${doc.color}-50 text-${doc.color}-500 rounded-lg group-hover:bg-${doc.color}-500 group-hover:text-white transition-colors`}>
                      <span className="material-icons-outlined text-sm">{doc.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold mb-1">{doc.title}</h3>
                      <p className="text-[10px] text-slate-500 italic">{doc.subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
              {studyResources.community_discussions?.map((d, i) => (
                <div key={i} className="bg-accent-ochre/5 p-4 rounded-xl border border-accent-ochre/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons-outlined text-xs text-accent-ochre">groups</span>
                    <span className="text-[10px] font-bold text-accent-ochre tracking-widest uppercase">Student Discussion</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic mb-2">{d.text}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold">{d.author}</span>
                    <button className="ml-auto text-primary text-[10px] font-bold underline">Reply</button>
                  </div>
                </div>
              ))}
              {studyResources.quick_facts?.map((f, i) => (
                <div key={i} className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1">
                    <span className="material-icons-outlined text-xs">tips_and_updates</span> Quick Fact
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{f.text}</p>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <span className="material-icons-outlined text-4xl mb-3 block">auto_stories</span>
              <p className="text-sm">Select a learning journey to see contextual study resources.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
