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

// Default host: production Render backend in release, localhost in dev
const getDefaultHost = () => {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return 'https://snapshare-backend-ucxu.onrender.com';
  }
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

  // Upload file (Multipart FormData via XMLHttpRequest for 100% Android/iOS & Web compatibility)
  uploadFile: async (fileUri, fileName, mimeType, collectionId = '') => {
    return new Promise(async (resolve, reject) => {
      try {
        const cleanName = fileName || `photo_${Date.now()}.jpg`;
        const cleanMime = mimeType || 'image/jpeg';
        const formData = new FormData();

        if (Platform.OS === 'web') {
          // On Web, fetch URI as Blob if needed
          if (fileUri.startsWith('blob:') || fileUri.startsWith('data:')) {
            const resp = await fetch(fileUri);
            const blob = await resp.blob();
            formData.append('files', blob, cleanName);
            formData.append('file', blob, cleanName);
          } else {
            formData.append('files', { uri: fileUri, name: cleanName, type: cleanMime });
            formData.append('file', { uri: fileUri, name: cleanName, type: cleanMime });
          }
        } else {
          // React Native Android & iOS: standard object handled by native NetworkingModule
          const filePayload = {
            uri: fileUri,
            name: cleanName,
            type: cleanMime,
          };
          formData.append('files', filePayload);
          formData.append('file', filePayload);
        }

        if (collectionId) {
          formData.append('collectionId', collectionId);
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${currentBaseUrl}/api/files/upload`);
        xhr.timeout = 120000; // 2 minutes

        xhr.setRequestHeader('Accept', 'application/json');
        if (authToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resData = JSON.parse(xhr.responseText);
              resolve(resData);
            } catch (e) {
              resolve({ success: true, text: xhr.responseText });
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.error || errData.message || `Upload failed (${xhr.status})`));
            } catch (e) {
              reject(new Error(`Upload failed (${xhr.status}): ${xhr.statusText || 'Server Error'}`));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network connection error during image upload'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Upload timed out. Please check your internet connection.'));
        };

        xhr.send(formData);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Upload Avatar
  uploadAvatar: async (fileUri, fileName, mimeType) => {
    return new Promise(async (resolve, reject) => {
      try {
        const cleanName = fileName || `avatar_${Date.now()}.jpg`;
        const cleanMime = mimeType || 'image/jpeg';
        const formData = new FormData();

        if (Platform.OS === 'web') {
          if (fileUri.startsWith('blob:') || fileUri.startsWith('data:')) {
            const resp = await fetch(fileUri);
            const blob = await resp.blob();
            formData.append('avatar', blob, cleanName);
          } else {
            formData.append('avatar', { uri: fileUri, name: cleanName, type: cleanMime });
          }
        } else {
          formData.append('avatar', {
            uri: fileUri,
            name: cleanName,
            type: cleanMime,
          });
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${currentBaseUrl}/api/auth/avatar`);
        xhr.timeout = 60000;

        xhr.setRequestHeader('Accept', 'application/json');
        if (authToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resData = JSON.parse(xhr.responseText);
              resolve(resData);
            } catch (e) {
              resolve({ success: true, text: xhr.responseText });
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.error || errData.message || `Avatar upload failed (${xhr.status})`));
            } catch (e) {
              reject(new Error(`Avatar upload failed (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error uploading avatar'));
        xhr.ontimeout = () => reject(new Error('Avatar upload timed out'));

        xhr.send(formData);
      } catch (err) {
        reject(err);
      }
    });
  },

  // Profile Management
  updateProfile: (data) =>
    request('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  changePassword: (data) =>
    request('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteAccount: () =>
    request('/api/auth/delete-account', {
      method: 'DELETE',
    }),

  // Storage Requests & Announcements
  requestStorageUpgrade: (payload) =>
    request('/api/storage-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getMyStorageRequests: () => request('/api/storage-requests/my'),

  getActiveAnnouncements: () => request('/api/announcements'),

  // Collection CRUD & Actions
  duplicateCollection: (collectionId) =>
    request(`/api/collections/${collectionId}/duplicate`, {
      method: 'POST',
    }),

  deleteCollection: (collectionId) =>
    request(`/api/collections/${collectionId}`, {
      method: 'DELETE',
    }),

  updateCollection: (collectionId, payload) =>
    request(`/api/collections/${collectionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

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
