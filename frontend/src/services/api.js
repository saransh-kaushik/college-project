/**
 * api.js — Axios wrapper with automatic JWT injection.
 * All REST calls to the VoiceTutor backend go through this module.
 */

const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('vt_token');
}

async function request(method, path, data = null, isFormData = false) {
  const token = getToken();
  const headers = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = isFormData ? data : JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${path}`, config);
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.error || `HTTP ${response.status}`);
  }

  return json;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  register: (name, email, password) =>
    request('POST', '/auth/register', { name, email, password }),
  login: (email, password) =>
    request('POST', '/auth/login', { email, password }),
};

// ── User ─────────────────────────────────────────────────────────────────────
export const user = {
  getProfile: () => request('GET', '/user/profile'),
  updateSettings: (settings) => request('PUT', '/user/settings', settings),
  getJourneys: () => request('GET', '/user/journeys'),
  getSessions: () => request('GET', '/user/sessions'),
};

// ── Voice Token (VoiceLive credentials) ──────────────────────────────────────
export const voice = {
  // Returns { endpoint, apiKey, model, voice } for direct Azure AI VoiceLive WS connection
  getToken: () => request('GET', '/voice/token'),
};


// ── Sessions ──────────────────────────────────────────────────────────────────
export const sessions = {
  start: (subject, topic) => request('POST', '/sessions/start', { subject, topic }),
  end: (sessionId) => request('POST', `/sessions/${sessionId}/end`),
  get: (sessionId) => request('GET', `/sessions/${sessionId}`),
  share: (sessionId) => request('POST', `/sessions/${sessionId}/share`),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chat = {
  sendMessage: (sessionId, text, documentId) =>
    request('POST', '/chat/message', { session_id: sessionId, text, document_id: documentId || null }),
  uploadFile: (file, sessionId) => {
    const form = new FormData();
    form.append('file', file);
    if (sessionId) form.append('session_id', sessionId);
    return request('POST', '/chat/upload', form, true);
  },
  getDocuments: () => request('GET', '/chat/documents'),
};

// ── Progress ───────────────────────────────────────────────────────────────────
export const progress = {
  get: (userId) => request('GET', `/progress/${userId}`),
  getHistory: (userId) => request('GET', `/progress/${userId}/history`),
};

// ── Resources ──────────────────────────────────────────────────────────────────
export const resources = {
  get: (topic) => request('GET', `/resources?topic=${encodeURIComponent(topic || '')}`),
  replyToCommunity: (noteId, text) =>
    request('POST', `/resources/community/${noteId}/reply`, { text }),
};

// ── Auth helpers ───────────────────────────────────────────────────────────────
export function saveAuthData(token, userData) {
  localStorage.setItem('vt_token', token);
  localStorage.setItem('vt_user', JSON.stringify(userData));
}

export function getAuthData() {
  const token = localStorage.getItem('vt_token');
  const userStr = localStorage.getItem('vt_user');
  return { token, user: userStr ? JSON.parse(userStr) : null };
}

export function clearAuth() {
  localStorage.removeItem('vt_token');
  localStorage.removeItem('vt_user');
}

export function isLoggedIn() {
  return !!localStorage.getItem('vt_token');
}
