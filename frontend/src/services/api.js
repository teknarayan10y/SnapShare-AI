import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('snapshare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token only if on a protected route
      if (!window.location.pathname.startsWith('/public') && window.location.pathname !== '/login') {
        localStorage.removeItem('snapshare_token');
        localStorage.removeItem('snapshare_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  deleteAccount: () => api.delete('/auth/delete-account'),
};

export const collectionAPI = {
  create: (data) => api.post('/collections', data),
  getAll: (params) => api.get('/collections', { params }),
  getById: (id) => api.get(`/collections/${id}`),
  update: (id, data) => api.patch(`/collections/${id}`, data),
  delete: (id) => api.delete(`/collections/${id}`),
  duplicate: (id) => api.post(`/collections/${id}/duplicate`),
};

export const fileAPI = {
  upload: (formData, onProgress) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }),
  getById: (id) => api.get(`/files/${id}`),
  deleteFile: (id) => api.delete(`/files/${id}`),
  delete: (id) => api.delete(`/files/${id}`),
  toggleFavorite: (id) => api.patch(`/files/${id}/favorite`),
  getAllFiles: (params) => api.get('/files', { params }),
  getFavorites: () => api.get('/files', { params: { favorites: 'true', limit: 100 } }),
  attachVoiceNote: (id, data) => api.post(`/files/${id}/voice-note`, data),
};

export const qrAPI = {
  generate: (collectionId, styleConfig) => api.post(`/qr/generate/${collectionId}`, styleConfig),
  get: (collectionId) => api.get(`/qr/${collectionId}`),
  revoke: (collectionId) => api.post(`/qr/${collectionId}/revoke`),
};

export const publicAPI = {
  getCollection: (shareToken, isScan = false, unlockToken = '') =>
    api.get(`/public/${shareToken}${isScan ? '?scan=true' : ''}`, {
      headers: unlockToken ? { 'x-collection-unlock-token': unlockToken } : {},
    }),
  verifyPassword: (shareToken, password) =>
    api.post(`/public/${shareToken}/verify`, { password }),
  findMyPhotos: (data) => api.post('/public/find-my-photos', data),
  attachVoiceNote: (id, data) => api.post(`/public/files/${id}/voice-note`, data),
  getPhotobook: (collectionId) => api.get(`/public/photobook/${collectionId}`),
};

export const downloadAPI = {
  prepare: (collectionId, fileIds) =>
    api.post('/downloads/prepare', { collectionId, fileIds }),
  getJobStatus: (jobId) => api.get(`/downloads/${jobId}/status`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getOverview: () => api.get('/analytics/dashboard'),
  getCollection: (id) => api.get(`/analytics/collections/${id}`),
};

export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export const aiAPI = {
  getOverview: () => api.get('/ai/overview'),
  analyzeFile: (fileId) => api.post('/ai/analyze', { fileId }),
  analyzeBulk: (fileIds, collectionId) => api.post('/ai/analyze/bulk', { fileIds, collectionId }),
  getJobs: (params) => api.get('/ai/jobs', { params }),
  retryJob: (jobId) => api.post(`/ai/jobs/${jobId}/retry`),
  cancelJob: (jobId) => api.post(`/ai/jobs/${jobId}/cancel`),
  getFolders: () => api.get('/ai/folders'),
  createFolder: (data) => api.post('/ai/folders', data),
  mergeFolders: (folderId, sourceFolderId) => api.post(`/ai/folders/${folderId}/merge`, { sourceFolderId }),
  search: (data) => api.post('/ai/search', data),
  getSuggestions: () => api.get('/ai/search/suggestions'),
  getDuplicates: () => api.get('/ai/duplicates'),
  resolveDuplicates: (groupId, data) => api.post(`/ai/duplicates/${groupId}/resolve`, data),
  previewOrganize: (fileIds) => api.post('/ai/organize/preview', { fileIds }),
  undoOrganize: (historyId) => api.post('/ai/organize/undo', { historyId }),
  getHistory: () => api.get('/ai/organization-history'),
  getSettings: () => api.get('/ai/settings'),
  updateSettings: (data) => api.patch('/ai/settings', data),

  // Face Recognition & People Management
  analyzeFace: (fileId) => api.post('/ai/faces/analyze', { fileId }),
  analyzeBulkFaces: (fileIds, collectionId) => api.post('/ai/faces/analyze/bulk', { fileIds, collectionId }),
  getFaceJobs: () => api.get('/ai/faces/jobs'),
  getPeople: () => api.get('/ai/people'),
  createPerson: (data) => api.post('/ai/people', data),
  updatePerson: (personId, data) => api.patch(`/ai/people/${personId}`, data),
  deletePerson: (personId) => api.delete(`/ai/people/${personId}`),
  mergePeople: (targetProfileId, sourceProfileIds) => api.post('/ai/people/merge', { targetProfileId, sourceProfileIds }),
  splitPerson: (data) => api.post('/ai/people/split', data),

  // Group Photo Organization
  previewGroupOrganization: (data) => api.post('/ai/groups/preview', data),
  executeGroupOrganization: (data) => api.post('/ai/groups/organize', data),
  getGroups: () => api.get('/ai/groups'),
  getGroupById: (groupId) => api.get(`/ai/groups/${groupId}`),

  // Natural Language Rule Engine
  interpretRule: (prompt) => api.post('/ai/rules/interpret', { prompt }),
  validateRule: (ruleJSON) => api.post('/ai/rules/validate', { ruleJSON }),
  createRule: (data) => api.post('/ai/rules', data),
  getRules: () => api.get('/ai/rules'),
  updateRule: (ruleId, data) => api.patch(`/ai/rules/${ruleId}`, data),
  deleteRule: (ruleId) => api.delete(`/ai/rules/${ruleId}`),

  // Organization History & Undo
  getFaceHistory: () => api.get('/ai/organization/history'),
  undoFaceOrganization: (historyId) => api.post('/ai/organization/undo', { historyId }),
  restoreFaceOrganization: (historyId) => api.post('/ai/organization/restore', { historyId }),

  // Privacy & Consent
  getPrivacy: () => api.get('/ai/privacy'),
  updatePrivacy: (data) => api.patch('/ai/privacy', data),
  purgeFaceData: () => api.delete('/ai/privacy/face-data'),

  // Feature 1: Find My Photos
  findMyPhotos: (data) => api.post('/ai/find-my-photos', data),

  // Feature 6: Photobook Curation
  getPhotobook: (collectionId) => api.get(`/ai/photobook${collectionId ? `/${collectionId}` : ''}`),
};

export default api;
