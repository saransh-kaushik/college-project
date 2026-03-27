import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/session.css';
import { sessions as sessionsApi, getAuthData } from '../services/api.js';
import { voiceSocket } from '../services/socket.js';
import { azureVoice } from '../services/azureVoice.js';

const SUBJECT_CONFIG = {
  physics: { name: 'Physics', tutor: 'Nova', color: 'text-blue-400', icon: 'bolt' },
  biology: { name: 'Biology', tutor: 'Vera', color: 'text-green-400', icon: 'eco' },
  chemistry: { name: 'Chemistry', tutor: 'Aiden', color: 'text-purple-400', icon: 'science' },
};

export default function Session() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subject = searchParams.get('subject') || 'biology';
  const config = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.biology;

  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [keyConcepts, setKeyConcepts] = useState([]);
  const [masteryLevel, setMasteryLevel] = useState({ topic: 'General', level: 0 });
  const [emotionBadge, setEmotionBadge] = useState({ label: 'Ready', icon: '✅' });
  const [timer, setTimer] = useState(0);
  const [assessmentQuestion, setAssessmentQuestion] = useState(null);
  const [statusMsg, setStatusMsg] = useState('Initializing session…');
  const timerRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const voiceLiveStarted = useRef(false);
  const { token } = getAuthData();

  // ── Timer ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `00:${m}:${sec}`;
  };

  // ── Session init: VoiceLive (direct) + WebSocket (analytics) ─────────────────
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // 1. Create session record in DB
        const { session_id } = await sessionsApi.start(subject, config.name);
        if (!mounted) return;
        setSessionId(session_id);
        setStatusMsg('Starting Voice Live session…');

        // 2. Connect analytics WebSocket (key concepts, mastery, assessment)
        if (token) {
          try {
            await voiceSocket.connect(token);
            if (mounted) setWsConnected(true);

            voiceSocket
              .on('MASTERY_UPDATE', (msg) => {
                setMasteryLevel({ topic: msg.topic, level: msg.level });
              })
              .on('LIVE_ANALYSIS_KEY_CONCEPT', (msg) => {
                setKeyConcepts((prev) => {
                  const exists = prev.find((c) => c.concept === msg.concept);
                  if (exists) return prev;
                  return [...prev.slice(-5), { concept: msg.concept, definition: msg.definition, icon: msg.icon || 'auto_awesome' }];
                });
              })
              .on('ASSESSMENT_QUESTION', (msg) => {
                setAssessmentQuestion(msg.question);
              })
              .on('DISCONNECTED', () => {
                setWsConnected(false);
              });
          } catch (wsErr) {
            console.warn('[Session] Analytics WS failed (non-fatal):', wsErr);
          }
        }

        // 3. Start VoiceLive — credentials fetched from backend, STT+LLM+TTS handled by Azure
        if (!voiceLiveStarted.current) {
          voiceLiveStarted.current = true;

          await azureVoice.startSession({
            subject,
            instructions: null, // uses built-in tutor persona in the service

            // User spoke → show in transcript + forward to analytics WS
            onTranscript: ({ text, emotion, confidence }) => {
              if (!text || !mounted) return;
              setTranscript((prev) => [...prev, { role: 'student', text }]);
              setEmotionBadge(getEmotionBadge(emotion, confidence));
              transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });

              if (wsConnected && session_id) {
                voiceSocket.sendTranscript({ sessionId: session_id, subject, text, emotion, confidence });
              }
            },

            // AI reply transcript (after audio plays)
            onAITranscript: (text) => {
              if (!text || !mounted) return;
              setTranscript((prev) => [...prev, { role: 'agent', text }]);
              transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            },

            onAISpeakingChange: (speaking) => {
              if (!mounted) return;
              setIsAISpeaking(speaking);
            },

            onError: (msg) => {
              if (!mounted) return;
              console.error('[VoiceLive]', msg);
              setStatusMsg(`⚠️ ${msg}`);
            },
          });

          if (mounted) {
            setIsRecording(true);
            setStatusMsg('🎙️ Listening… speak naturally.');
          }
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Session init error:', err);
        setStatusMsg(`⚠️ ${err.message || 'Could not start session'}`);
      }
    }

    init();
    return () => {
      mounted = false;
      azureVoice.stop();
      voiceSocket.disconnect();
      clearInterval(timerRef.current);
    };
  }, [subject, token]);

  // ── Microphone toggle — pause/resume mic; VoiceLive WS stays open ─────────────
  const toggleRecording = async () => {
    if (isRecording) {
      azureVoice.stopListening();
      setIsRecording(false);
      setStatusMsg('Mic paused. Click to resume.');
    } else {
      await azureVoice.resumeListening();
      setIsRecording(true);
      setStatusMsg('🎙️ Listening… speak naturally.');
    }
  };

  // ── End session ───────────────────────────────────────────────────────────────
  const endSession = async () => {
    clearInterval(timerRef.current);
    await azureVoice.stop();

    if (sessionId) {
      if (wsConnected) voiceSocket.sendSessionEnd(sessionId);
      voiceSocket.disconnect();
      await sessionsApi.end(sessionId).catch(console.warn);
    }

    navigate('/dashboard');
  };

  // ── Helpers ────────────────────────────────────────────────────────────────────
  const getEmotionBadge = (emotion, confidence) => {
    if (!emotion || emotion === 'neutral') return { label: 'Focused', icon: '🎯' };
    if (emotion === 'confused' || confidence < 0.5) return { label: 'Confused', icon: '😕' };
    if (emotion === 'curious') return { label: 'Curious', icon: '🤔' };
    return { label: 'Confident', icon: '✅' };
  };

  const orbState = isAISpeaking ? 'speaking' : isRecording ? 'listening' : 'idle';

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] w-full flex-col overflow-hidden bg-background-dark text-white font-display">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] size-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] size-[600px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="size-8 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{config.name}: Live Session</h2>
              <div className="flex items-center gap-2">
                <span className={`inline-block size-2 rounded-full bg-primary ${wsConnected ? 'animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs text-primary/80 uppercase tracking-widest font-semibold">
                  {wsConnected ? 'Live Session' : 'Offline Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Emotion badge */}
          <div className="flex items-center gap-2 bg-card-dark px-3 py-1.5 rounded-lg border border-primary/20 text-sm">
            <span>{emotionBadge.icon}</span>
            <span className="font-semibold">{emotionBadge.label}</span>
          </div>
          {/* Timer */}
          <div className="flex items-center gap-2 bg-card-dark px-4 py-2 rounded-lg border border-primary/20">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span className="text-sm font-bold tracking-wider">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 relative px-8 pb-32 gap-8 z-20">
        {/* Central Voice Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative">

          {/* AI Orb */}
          <div className="relative flex items-center justify-center w-full max-w-2xl aspect-square">
            <div className="absolute inset-0 orb-gradient animate-pulse" />
            <div className="absolute inset-20 border-[1px] border-primary/10 rounded-full" />
            <div className="absolute inset-40 border-[1px] border-primary/20 rounded-full" />
            <div className="relative size-64 flex items-center justify-center">
              <svg
                className={`w-full h-full text-primary transition-all duration-700 ${
                  orbState === 'speaking' ? 'scale-125' : orbState === 'listening' ? 'scale-110' : 'scale-100'
                }`}
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="orb-fill">
                    <stop offset="0%" stopColor="#1fad7e" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#1fad7e" stopOpacity="0.2" />
                  </radialGradient>
                </defs>
                <path
                  d="M44.7,-76.4C58.1,-69.2,69.5,-57.4,77.5,-43.8C85.5,-30.2,90.1,-15.1,89.2,-0.5C88.3,14.1,81.9,28.2,73.1,40.4C64.3,52.6,53,62.9,40.3,70.9C27.6,78.9,13.8,84.6,0.1,84.4C-13.6,84.2,-27.1,78.1,-39.7,70C-52.3,61.9,-63.9,51.8,-71.8,39.5C-79.7,27.2,-83.9,12.7,-82.9,-1.6C-81.9,-15.9,-75.7,-30,-67.2,-42.1C-58.7,-54.2,-47.9,-64.3,-35.3,-71.9C-22.7,-79.5,-11.3,-84.6,2.1,-88.2C15.6,-91.8,29.1,-93.8,44.7,-76.4Z"
                  fill="url(#orb-fill)"
                  transform="translate(100 100)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-white">
                  {orbState === 'speaking' ? 'volume_up' : orbState === 'listening' ? 'mic' : 'graphic_eq'}
                </span>
              </div>
            </div>
          </div>

          {/* Status message */}
          <p className="text-sm text-white/50 font-body mt-2">{statusMsg}</p>

          {/* Mastery bar */}
          {masteryLevel.level > 0 && (
            <div className="w-full max-w-md mt-4 px-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">{masteryLevel.topic}</span>
                <span className="text-primary font-bold">{Math.round(masteryLevel.level * 100)}% mastery</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${masteryLevel.level * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Transcript */}
          <div className="absolute bottom-6 w-full max-w-2xl px-8 py-6 rounded-xl bg-black/30 backdrop-blur-sm border border-white/5 max-h-48 overflow-y-auto custom-scrollbar">
            {transcript.length === 0 ? (
              <p className="text-white/30 text-sm font-body text-center">Your conversation will appear here…</p>
            ) : (
              <div className="flex flex-col gap-3 font-body">
                {transcript.slice(-4).map((msg, i) => (
                  <div key={i} className={`flex gap-3 text-sm ${msg.role === 'agent' ? 'opacity-80' : 'text-lg'}`}>
                    <span className={`font-bold ${msg.role === 'agent' ? 'text-primary' : 'text-accent-ochre'}`}>
                      {msg.role === 'agent' ? config.tutor : 'You'}
                    </span>
                    <p>{msg.text}</p>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Key Concepts Sidebar */}
        <aside className="w-80 flex flex-col glass-card rounded-xl overflow-hidden self-stretch my-4">
          <div className="p-6 border-b border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold">Key Concepts</h3>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded uppercase tracking-tighter">Live Analysis</span>
            </div>
            <p className="text-xs text-white/50 font-body">Tracking session context…</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            {keyConcepts.length === 0 ? (
              <div className="text-center py-8 text-white/30">
                <span className="material-symbols-outlined text-3xl mb-2 block">psychology</span>
                <p className="text-xs font-body">Concepts will appear as you speak</p>
              </div>
            ) : (
              keyConcepts.map((c, i) => (
                <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-primary/40 transition-colors group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="size-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-sm">{c.icon || 'auto_awesome'}</span>
                    </div>
                    <h4 className="font-bold text-primary">{c.concept}</h4>
                  </div>
                  <p className="text-sm text-white/70 font-body leading-snug">{c.definition}</p>
                </div>
              ))
            )}

            {/* Assessment question */}
            {assessmentQuestion && (
              <div className="p-4 rounded-lg bg-accent-ochre/10 border border-accent-ochre/30 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-accent-ochre">quiz</span>
                  <span className="text-xs font-bold text-accent-ochre uppercase tracking-widest">Quick Check</span>
                </div>
                <p className="text-sm text-white/80 font-body">{assessmentQuestion}</p>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Floating Control Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 glass-card rounded-full shadow-2xl z-50">
        {/* Voice level visualizer */}
        <div className={`flex items-end gap-0.5 h-6 px-2 ${isRecording ? 'opacity-100' : 'opacity-30'}`}>
          {[3, 5, 2, 4, 6].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full bg-primary`}
              style={{
                height: `${h * 4}px`,
                animation: isRecording ? `bounce 0.${i + 5}s ease infinite alternate` : 'none',
              }}
            />
          ))}
        </div>

        <div className="w-[1px] h-8 bg-white/10" />

        <div className="flex items-center gap-4">
          <button
            id="mic-toggle"
            onClick={toggleRecording}
            className={`group relative size-12 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-primary/20 text-primary ring-2 ring-primary/40'
                : 'bg-white/5 hover:bg-white/10 text-white'
            }`}
          >
            <span className="material-symbols-outlined">{isRecording ? 'mic' : 'mic_off'}</span>
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isRecording ? 'Mute mic' : 'Unmute mic'}
            </span>
          </button>

          <button className="group relative size-12 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-colors">
            <span className="material-symbols-outlined">settings_voice</span>
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity">Voice Settings</span>
          </button>
        </div>

        <div className="w-[1px] h-8 bg-white/10" />

        <button
          id="end-session"
          onClick={endSession}
          className="flex items-center gap-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-full font-bold transition-all"
        >
          <span className="material-symbols-outlined">call_end</span>
          <span>End Session</span>
        </button>
      </div>
    </div>
  );
}
