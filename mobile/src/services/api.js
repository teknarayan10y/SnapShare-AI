// Mobile API Client for SnapShare Backend with Complete Web Parity
import { Platform } from 'react-native';

// Storage helper with fallback for web/React Native
let storageEngine = null;
try {
  storageEngine = require('@react-native-async-storage/async-storage').default;
} catch {
  storageEngine = {
    getItem: async (key) => (typeof window !== 'undefined' ? window.localStorage?.getItem(key) : null),
    setItem: async (key, val) => (typeof window !== 'undefined' ? window.localStorage?.setItem(key, val) : null),
    removeItem: async (key) => (typeof window !== 'undefined' ? window.localStorage?.removeItem(key) : null),
  };
}

// Default to localhost for web/iOS simulator, 10.0.2.2 for Android emulator
const getDefaultHost = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

let currentBaseUrl = getDefaultHost();
let authToken = null;

export const setApiUrl = async (url) => {
  if (!url) return;
  currentBaseUrl = url.replace(/\/$/, '');
  try {
    await storageEngine.setItem('snapshare_api_url', currentBaseUrl);
  } catch (e) {
    console.error('Failed to save API URL:', e);
  }
};

export const getApiUrl = async () => {
  try {
    const saved = await storageEngine.getItem('snapshare_api_url');
    if (saved) currentBaseUrl = saved;
  } catch (e) {
    console.error('Failed to get API URL:', e);
  }
  return currentBaseUrl;
};

export const setAuthToken = async (token) => {
  authToken = token;
  try {
    if (token) {
      await storageEngine.setItem('snapshare_token', token);
    } else {
      await storageEngine.removeItem('snapshare_token');
    }
  } catch (e) {
    console.error('Failed to persist auth token:', e);
  }
};

export const getSavedAuthToken = async () => {
  try {
    authToken = await storageEngine.getItem('snapshare_token');
  } catch (e) {
    console.error('Failed to get token:', e);
  }
  return authToken;
};

// Generic request wrapper
async function request(endpoint, options = {}) {
  const url = `${currentBaseUrl}${endpoint}`;
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }),

  getProfile: () => request('/api/auth/me'),

  // Analytics & Dashboard Overview
  getDashboard: () => request('/api/analytics/dashboard'),

  // Collections / Events
  getCollections: () => request('/api/collections'),

  getCollection: (id) => request(`/api/collections/${id}`),

  createCollection: (payload) =>
    request('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  // Files
  getFiles: (collectionId = '') => {
    const query = collectionId ? `?collectionId=${collectionId}` : '';
    return request(`/api/files${query}`);
  },

  getAllFiles: (params = {}) => {
    const queryParts = [];
    if (params.page) queryParts.push(`page=${params.page}`);
    if (params.limit) queryParts.push(`limit=${params.limit}`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params.category && params.category !== 'all') queryParts.push(`category=${params.category}`);
    if (params.favorites) queryParts.push(`favorites=true`);
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return request(`/api/files${qs}`);
  },

  toggleFavorite: (fileId) =>
    request(`/api/files/${fileId}/favorite`, {
      method: 'PATCH',
    }),

  deleteFile: (fileId) =>
    request(`/api/files/${fileId}`, {
      method: 'DELETE',
    }),

  // Upload file (Multipart FormData)
  uploadFile: async (fileUri, fileName, mimeType, collectionId = '') => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName || 'photo.jpg',
      type: mimeType || 'image/jpeg',
    });

    if (collectionId) {
      formData.append('collectionId', collectionId);
    }

    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const response = await fetch(`${currentBaseUrl}/api/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || `Upload failed (${response.status})`);
    }
    return data;
  },

  // Feature 4: Attach Voice Note
  attachVoiceNote: (fileId, payload) =>
    request(`/api/files/${fileId}/voice-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  // AI Smart Folders
  getAIOverview: () => request('/api/ai/overview'),

  analyzeBulk: (fileIds) =>
    request('/api/ai/analyze/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    }),

  getSmartFolders: (collectionId = '') => {
    const query = collectionId ? `?collectionId=${collectionId}` : '';
    return request(`/api/ai/folders${query}`);
  },

  getFolders: (collectionId = '') => {
    const query = collectionId ? `?collectionId=${collectionId}` : '';
    return request(`/api/ai/folders${query}`);
  },

  triggerOrganization: (collectionId = '', rule = null) =>
    request('/api/ai/organize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionId, rule }),
    }),

  // Semantic Search
  searchAI: (query, type = 'all', limit = 20) =>
    request('/api/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, type, limit }),
    }),

  // Duplicate Center
  getDuplicates: () => request('/api/ai/duplicates'),

  resolveDuplicates: (groupId, keepFileId, deleteFileIds = []) =>
    request(`/api/ai/duplicates/${groupId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keepFileId, deleteFileIds }),
    }),

  // Job Pipeline
  getJobs: (limit = 20) => request(`/api/ai/jobs?limit=${limit}`),

  retryJob: (jobId) =>
    request(`/api/ai/jobs/${jobId}/retry`, {
      method: 'POST',
    }),

  cancelJob: (jobId) =>
    request(`/api/ai/jobs/${jobId}/cancel`, {
      method: 'POST',
    }),

  // Natural Language Rule Engine & Commands
  interpretRule: (naturalLanguagePrompt) =>
    request('/api/ai/rules/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: naturalLanguagePrompt }),
    }),

  createRule: (rulePayload) =>
    request('/api/ai/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rulePayload),
    }),

  getRules: () => request('/api/ai/rules'),

  deleteRule: (ruleId) =>
    request(`/api/ai/rules/${ruleId}`, {
      method: 'DELETE',
    }),

  previewGroupOrganization: (payload = {}) =>
    request('/api/ai/groups/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  executeGroupOrganization: (payload = {}) =>
    request('/api/ai/groups/organize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getOrganizationHistory: () => request('/api/ai/organization/history'),

  undoOrganization: (historyId) =>
    request('/api/ai/organization/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historyId }),
    }),

  // People & Biometrics
  getPeople: () => request('/api/ai/people'),

  renamePerson: (personId, displayName) =>
    request(`/api/ai/people/${personId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    }),

  deletePerson: (personId) =>
    request(`/api/ai/people/${personId}`, {
      method: 'DELETE',
    }),

  // Privacy & Consent
  getPrivacySettings: () => request('/api/ai/privacy'),

  updatePrivacySettings: (payload) =>
    request('/api/ai/privacy', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getAIPreferences: () => request('/api/ai/privacy'),

  updateAIPreferences: (payload) =>
    request('/api/ai/privacy', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  purgeBiometricData: () =>
    request('/api/ai/privacy/face-data', {
      method: 'DELETE',
    }),

  // Feature 1: Find My Photos (Guest Selfie Match)
  findMyPhotos: (selfieBase64, collectionId = '', threshold = 0.38) =>
    request('/api/ai/find-my-photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selfieBase64, collectionId, threshold }),
    }),

  // Feature 6: Auto-Curated Photobook / Album Builder
  getPhotobook: (collectionId = '') =>
    request(`/api/ai/photobook${collectionId ? `/${collectionId}` : ''}`),
};

export default api;
