import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { user as userApi, sessions as sessionsApi, chat as chatApi, getAuthData, clearAuth } from '../services/api.js';

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
      content: "Hello! I'm your Lumina AI tutor. Select a learning journey from the sidebar, ask me anything, or upload a document to chat about it. 🎙️",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // ── Document state ────────────────────────────────────────────────────────────
  const [userDocs, setUserDocs] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);

  const chatEndRef = useRef(null);

  // ── Initial data load ─────────────────────────────────────────────────────────
  useEffect(() => {
    userApi.getProfile().then(setProfile).catch(console.warn);
    userApi.getJourneys().then((d) => setJourneys(d.journeys)).catch(console.warn);
    userApi.getSessions().then((d) => setPastSessions(d.sessions || [])).catch(console.warn);
    loadDocuments();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDocuments = () => {
    chatApi.getDocuments()
      .then((d) => setUserDocs(d.documents || []))
      .catch(console.warn);
  };

  // ── Journey selection ─────────────────────────────────────────────────────────
  const selectJourney = async (journey) => {
    setActiveJourney(journey);
    try {
      const { session_id } = await sessionsApi.start(journey.id, journey.name);
      setSessionId(session_id);
    } catch (err) {
      console.warn('Could not start session:', err.message);
    }
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

      const data = await chatApi.sendMessage(sid, userMsg, activeDocId);
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

  // ── File upload ───────────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        content: `✅ **${file.name}** uploaded and processed into ${result.chunk_count} chunks. Select it from the Documents panel to query it specifically.`,
      }]);
      // Refresh document list and auto-select the new doc
      setActiveDocId(result.document_id);
      loadDocuments();
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'agent', content: `❌ Upload failed: ${err.message}` }]);
    } finally {
      e.target.value = '';
    }
  };

  const handleShare = async () => {
    if (!sessionId) return;
    try {
      const { share_url } = await sessionsApi.share(sessionId);
      navigator.clipboard.writeText(share_url).catch(() => {});
      alert(`Share link copied: ${share_url}`);
    } catch {
      alert('Could not generate share link');
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const currentTitle = activeJourney
    ? journeys.find((j) => j.id === activeJourney.id)?.name || 'Learning Session'
    : 'Welcome to Lumina AI';

  const activeDoc = userDocs.find((d) => d.id === activeDocId);

  // Format relative time
  const relTime = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 h-screen overflow-hidden flex font-body w-full">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-72 bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-icons-outlined text-sm">school</span>
            </div>
            <h1 className="font-display font-bold text-lg tracking-tight">Lumina AI</h1>
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

      {/* ── Main Chat ───────────────────────────────────────────────────────── */}
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
            {activeDoc && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20 max-w-[180px]">
                <span className="material-icons-outlined text-[10px]">description</span>
                <span className="truncate">{activeDoc.filename}</span>
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
                <label className="p-2 text-slate-400 hover:text-primary transition-colors cursor-pointer" title="Attach PDF or TXT">
                  <span className="material-icons-outlined">attach_file</span>
                  <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
                </label>
                <textarea
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none custom-scrollbar outline-none"
                  placeholder={
                    activeDoc
                      ? `Ask about "${activeDoc.filename}"…`
                      : activeJourney
                      ? `Ask about ${activeJourney.name}…`
                      : 'Ask anything or upload a document…'
                  }
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
            <p className="text-[10px] text-center mt-3 text-slate-400 font-medium">Lumina AI can make mistakes. Verify important information.</p>
          </div>
        </div>
      </main>

      {/* ── Documents Panel (right) ──────────────────────────────────────────── */}
      <aside className="w-80 bg-slate-50 dark:bg-slate-900/40 border-l border-slate-200 dark:border-slate-800 flex flex-col p-5 hidden xl:flex shrink-0">

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xs tracking-widest uppercase text-slate-400">My Documents</h2>
          <label
            className="flex items-center gap-1 text-[10px] font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
            title="Upload PDF or TXT"
          >
            <span className="material-icons-outlined text-sm">upload</span>
            Upload
            <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
          </label>
        </div>

        {/* "None" option — clear selection */}
        {activeDocId && (
          <button
            onClick={() => setActiveDocId(null)}
            className="w-full flex items-center gap-2 px-3 py-2 mb-3 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 transition-all"
          >
            <span className="material-icons-outlined text-sm">cancel</span>
            Clear document filter
          </button>
        )}

        {/* Document list */}
        <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {userDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="material-icons-outlined text-4xl mb-3 block">description</span>
              <p className="text-xs leading-relaxed">
                No documents yet.<br />Upload a PDF or TXT to start chatting about it.
              </p>
            </div>
          ) : (
            userDocs.map((doc) => {
              const isActive = doc.id === activeDocId;
              const isPdf = doc.filename.toLowerCase().endsWith('.pdf');
              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveDocId(isActive ? null : doc.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all group ${
                    isActive
                      ? 'bg-primary/10 border-primary/40 shadow-sm'
                      : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* File icon */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'
                    } transition-colors`}>
                      <span className="material-icons-outlined text-sm">
                        {isPdf ? 'picture_as_pdf' : 'article'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isActive ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                        {doc.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {doc.chunk_count > 0 && (
                          <span className="text-[10px] text-slate-400">{doc.chunk_count} chunks</span>
                        )}
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="text-[10px] text-slate-400">{relTime(doc.created_at)}</span>
                      </div>
                    </div>

                    {/* Active check */}
                    {isActive && (
                      <span className="material-icons-outlined text-primary text-sm flex-shrink-0">check_circle</span>
                    )}
                  </div>

                  {isActive && (
                    <p className="text-[10px] text-primary/80 mt-2 pl-9 font-medium">
                      Querying this document
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <p className="text-[10px] text-slate-400 text-center mt-4 leading-relaxed">
          Select a document to focus context on it.<br />Deselect to use the full knowledge base.
        </p>
      </aside>
    </div>
  );
}
