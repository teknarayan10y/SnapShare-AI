import React, { useState, useEffect, useCallback } from 'react';
import { aiAPI, fileAPI } from '../services/api';
import SmartFolderCard from '../components/SmartFolderCard';
import { FindMyPhotosModal } from '../components/FindMyPhotosModal';
import { PhotobookModal } from '../components/PhotobookModal';
import {
  Brain,
  Sparkles,
  Search,
  Zap,
  FolderOpen,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings,
  Layers,
  FileText,
  Sliders,
  Shield,
  Clock,
  Eye,
  Tag,
  ArrowRight,
  Filter,
  Check,
  ChevronRight,
  TrendingUp,
  Image,
  Code,
  Video,
  Music,
  ExternalLink,
  Users,
  User,
  UserCheck,
  RotateCcw,
  Terminal,
  Plus,
  Play,
  UserPlus,
  SlidersHorizontal,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  Info,
  Camera,
  BookOpen,
  ArrowUpDown,
} from 'lucide-react';

export default function AISmartOrganizerPage() {
  const [activeTab, setActiveTab] = useState('library');
  const [fileSortBy, setFileSortBy] = useState('name_asc');
  const [overview, setOverview] = useState({
    totalAnalyzed: 0,
    pendingAnalysis: 0,
    totalFolders: 0,
    duplicateGroups: 0,
    monthlyQuota: 500,
    quotaUsedThisMonth: 0,
    microserviceOnline: false,
    organizationMode: 'review',
  });

  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedFileForModal, setSelectedFileForModal] = useState(null);

  // Face Intelligence & Rule Engine State
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editingPersonName, setEditingPersonName] = useState('');
  const [commandPrompt, setCommandPrompt] = useState(
    'If a photo contains more than four people, put it in Group Photos. For exactly four, three, two, or one person, group photographs containing the same recognized members together.'
  );
  const [interpretedRule, setInterpretedRule] = useState(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [rules, setRules] = useState([]);
  const [orgPreview, setOrgPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [orgHistory, setOrgHistory] = useState([]);
  const [privacyConsent, setPrivacyConsent] = useState({
    enableFaceDetection: true,
    enableFaceMatching: false,
    faceDetectionThreshold: 0.85,
    faceMatchingThreshold: 0.95,
  });

  // AI Preferences state
  const [settings, setSettings] = useState({
    organizationMode: 'review',
    enableFaceGrouping: false,
    enableAutoOCR: true,
    confidenceThreshold: 0.75,
  });

  // Modals state
  const [showFindMyPhotos, setShowFindMyPhotos] = useState(false);
  const [showPhotobook, setShowPhotobook] = useState(false);

  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    try {
      const res = await aiAPI.getOverview();
      if (res.data?.success) {
        setOverview(res.data.stats);
      }
    } catch (err) {
      console.warn('Overview load fallback:', err.message);
    }
  }, []);

  // Load Smart Folders
  const loadFolders = useCallback(async () => {
    try {
      const res = await aiAPI.getFolders();
      if (res.data?.success) {
        setFolders(res.data.folders || []);
      }
    } catch (err) {
      console.warn('Folders load fallback:', err.message);
    }
  }, []);

  // Load Files
  const loadFiles = useCallback(async () => {
    try {
      const res = await fileAPI.getAllFiles({ limit: 500, sortBy: 'name', sortOrder: 'asc' });
      if (res.data?.success) {
        setFiles(res.data.files || []);
      }
    } catch (err) {
      console.warn('Files load fallback:', err.message);
    }
  }, []);

  // Load Duplicates
  const loadDuplicates = useCallback(async () => {
    try {
      const res = await aiAPI.getDuplicates();
      if (res.data?.success) {
        setDuplicates(res.data.duplicates || res.data.groups || []);
      }
    } catch (err) {
      console.warn('Duplicates load fallback:', err.message);
    }
  }, []);

  // Load Jobs
  const loadJobs = useCallback(async () => {
    try {
      const res = await aiAPI.getJobs({ limit: 20 });
      if (res.data?.success) {
        setJobs(res.data.jobs || []);
      }
    } catch (err) {
      console.warn('Jobs load fallback:', err.message);
    }
  }, []);

  // Load Settings
  const loadSettings = useCallback(async () => {
    try {
      const res = await aiAPI.getSettings();
      if (res.data?.success && res.data.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.warn('Settings load fallback:', err.message);
    }
  }, []);

  // Load People Profiles
  const loadPeople = useCallback(async () => {
    try {
      const res = await aiAPI.getPeople();
      if (res.data?.success) {
        setPeople(res.data.people || []);
      }
    } catch (err) {
      console.warn('People load fallback:', err.message);
    }
  }, []);

  // Load Rules
  const loadRules = useCallback(async () => {
    try {
      const res = await aiAPI.getRules();
      if (res.data?.success) {
        setRules(res.data.rules || []);
      }
    } catch (err) {
      console.warn('Rules load fallback:', err.message);
    }
  }, []);

  // Load History
  const loadFaceHistory = useCallback(async () => {
    try {
      const res = await aiAPI.getFaceHistory();
      if (res.data?.success) {
        setOrgHistory(res.data.history || []);
      }
    } catch (err) {
      console.warn('History load fallback:', err.message);
    }
  }, []);

  // Load Privacy Settings
  const loadPrivacySettings = useCallback(async () => {
    try {
      const res = await aiAPI.getPrivacy();
      if (res.data?.success && res.data.privacy) {
        setPrivacyConsent(res.data.privacy);
      }
    } catch (err) {
      console.warn('Privacy load fallback:', err.message);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadOverview(),
      loadFolders(),
      loadFiles(),
      loadDuplicates(),
      loadJobs(),
      loadSettings(),
      loadPeople(),
      loadRules(),
      loadFaceHistory(),
      loadPrivacySettings(),
    ]);
    setLoading(false);
  }, [
    loadOverview,
    loadFolders,
    loadFiles,
    loadDuplicates,
    loadJobs,
    loadSettings,
    loadPeople,
    loadRules,
    loadFaceHistory,
    loadPrivacySettings,
  ]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Periodic job queue polling
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTab === 'jobs' || overview.pendingAnalysis > 0) {
        loadJobs();
        loadOverview();
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [activeTab, overview.pendingAnalysis, loadJobs, loadOverview]);

  // Trigger Bulk Analysis
  const handleAnalyzeAll = async () => {
    try {
      setActionLoading(true);
      const unanalyzed = files.filter((f) => f.aiStatus !== 'analyzed');
      const fileIds = unanalyzed.map((f) => f._id);
      if (fileIds.length === 0) {
        showToast('All files have already been analyzed!', 'info');
        setActionLoading(false);
        return;
      }
      const res = await aiAPI.analyzeBulk(fileIds);
      if (res.data?.success) {
        showToast(`Enqueued ${res.data.enqueuedCount} file(s) for AI processing!`);
        loadJobs();
        loadOverview();
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Perform Semantic Search
  const handleSemanticSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setHasSearched(true);
      const res = await aiAPI.search({
        query: searchQuery,
        type: searchType,
        limit: 20,
      });
      if (res.data?.success) {
        setSearchResults(res.data.results || []);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Search failed', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Resolve Duplicate Action
  const handleResolveDuplicate = async (groupId, keepFileId, deleteFileIds) => {
    try {
      setActionLoading(true);
      const res = await aiAPI.resolveDuplicates(groupId, {
        keepFileId,
        deleteFileIds,
      });
      if (res.data?.success) {
        showToast(`Duplicate resolved! Reclaimed ${Math.round((res.data.reclaimedBytes || 0) / 1024)} KB.`);
        loadDuplicates();
        loadFiles();
        loadOverview();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to resolve duplicate', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (newSettings) => {
    try {
      setActionLoading(true);
      const res = await aiAPI.updateSettings(newSettings);
      if (res.data?.success) {
        setSettings(newSettings);
        showToast('AI preferences saved successfully!');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update preferences', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Interpret Natural Language Command (Section 9)
  const handleInterpretCommand = async () => {
    if (!commandPrompt.trim()) return;
    try {
      setIsInterpreting(true);
      const res = await aiAPI.interpretRule(commandPrompt);
      if (res.data?.success) {
        setInterpretedRule(res.data);
        showToast('Rule interpreted and validated against allowlist schema!');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to interpret instruction', 'error');
    } finally {
      setIsInterpreting(false);
    }
  };

  // Handle Save Interpreted Rule
  const handleSaveRule = async () => {
    if (!interpretedRule?.rule) return;
    try {
      setActionLoading(true);
      const res = await aiAPI.createRule({
        name: interpretedRule.rule.name,
        naturalLanguagePrompt: commandPrompt,
        ruleJSON: interpretedRule.rule,
        priority: (rules.length || 0) + 1,
      });
      if (res.data?.success) {
        showToast('Rule saved to active organization engine!');
        loadRules();
        setInterpretedRule(null);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save rule', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Rule
  const handleDeleteRule = async (ruleId) => {
    try {
      setActionLoading(true);
      const res = await aiAPI.deleteRule(ruleId);
      if (res.data?.success) {
        showToast('Rule deleted successfully.');
        loadRules();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete rule', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Organization Preview (Section 11)
  const handleFetchPreview = async () => {
    try {
      setIsLoadingPreview(true);
      const res = await aiAPI.previewGroupOrganization({});
      if (res.data?.success) {
        setOrgPreview(res.data.preview);
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to generate preview', 'error');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle Execute Organization
  const handleExecuteOrganization = async () => {
    try {
      setActionLoading(true);
      const res = await aiAPI.executeGroupOrganization({});
      if (res.data?.success) {
        showToast(res.data.message);
        refreshAll();
        setActiveTab('library');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Organization failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Rename Person (Section 5)
  const handleRenamePerson = async (personId, newName) => {
    if (!newName || !newName.trim()) return;
    try {
      setActionLoading(true);
      const res = await aiAPI.updatePerson(personId, { displayName: newName.trim() });
      if (res.data?.success) {
        showToast(`Renamed person to "${newName.trim()}"`);
        setEditingPersonId(null);
        loadPeople();
        loadFolders();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to rename person', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Person
  const handleDeletePerson = async (personId) => {
    if (!window.confirm('Delete this person profile? This will not delete original photos.')) return;
    try {
      setActionLoading(true);
      const res = await aiAPI.deletePerson(personId);
      if (res.data?.success) {
        showToast('Person profile removed.');
        loadPeople();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete person', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Undo Organization (Section 12)
  const handleUndoOrg = async (historyId) => {
    try {
      setActionLoading(true);
      const res = await aiAPI.undoFaceOrganization(historyId);
      if (res.data?.success) {
        showToast('Organization operation undone successfully!');
        loadFaceHistory();
        loadFolders();
        loadFiles();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Undo failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Restore Organization
  const handleRestoreOrg = async (historyId) => {
    try {
      setActionLoading(true);
      const res = await aiAPI.restoreFaceOrganization(historyId);
      if (res.data?.success) {
        showToast('Organization restored successfully!');
        loadFaceHistory();
        loadFolders();
        loadFiles();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Restore failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Save Privacy (Section 19)
  const handleSavePrivacy = async (updates) => {
    try {
      setActionLoading(true);
      const res = await aiAPI.updatePrivacy(updates);
      if (res.data?.success) {
        setPrivacyConsent(res.data.privacy);
        showToast('Privacy & Face Matching settings updated!');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update privacy settings', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Purge Face Data
  const handlePurgeFaceData = async () => {
    if (!window.confirm('PERMANENT ACTION: Are you sure you want to permanently delete all private face profiles, embeddings, and group combinations? Original photos will be preserved.')) return;
    try {
      setActionLoading(true);
      const res = await aiAPI.purgeFaceData();
      if (res.data?.success) {
        showToast(res.data.message);
        loadPeople();
        loadPrivacySettings();
        refreshAll();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to purge face data', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter files by selected smart folder.
  // IMPORTANT: Use the already-populated fileIds FROM the folder object directly.
  // Do NOT cross-reference with the separate `files` state — IDs won't match reliably
  // because one is an ObjectId and the other is a plain string.
  const rawFiltered = selectedFolder
    ? (selectedFolder.fileIds || [])
        .map((item) => {
          // fileIds may be fully populated objects (from .populate) or bare IDs
          if (typeof item === 'object' && item !== null && item._id) return item;
          // If somehow bare ID, try to find the object in the files state
          const found = files.find((f) => String(f._id) === String(item));
          return found || null;
        })
        .filter(Boolean)
    : files;

  // Natural Numerical Sorting (ensures 1, 2, ... 9, 10, ... 45 sort in order)
  const filteredFiles = [...rawFiltered].sort((a, b) => {
    const nameA = a.originalName || '';
    const nameB = b.originalName || '';
    if (fileSortBy === 'name_asc') {
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (fileSortBy === 'name_desc') {
      return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (fileSortBy === 'newest') {
      return new Date(b.uploadedAt || b.createdAt || 0) - new Date(a.uploadedAt || a.createdAt || 0);
    }
    if (fileSortBy === 'oldest') {
      return new Date(a.uploadedAt || a.createdAt || 0) - new Date(b.uploadedAt || b.createdAt || 0);
    }
    if (fileSortBy === 'quality_desc') {
      return (b.qualityScore || 0) - (a.qualityScore || 0);
    }
    if (fileSortBy === 'size_desc') {
      return (b.fileSize || 0) - (a.fileSize || 0);
    }
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all ${
            notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : notification.type === 'info'
              ? 'bg-sky-950/90 border-sky-500/50 text-sky-200'
              : 'bg-purple-950/90 border-purple-500/50 text-purple-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-950/60 via-slate-900/90 to-indigo-950/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30">
                <Brain className="w-3.5 h-3.5 text-purple-400" /> SnapShare AI Engine 2.0
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                  overview.microserviceOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${overview.microserviceOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {overview.microserviceOnline ? 'FastAPI Neural Engine Online' : 'Deterministic Heuristic Fallback'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Intelligent File Intelligence & Organizer
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Upload everything. Understand anything. Organize automatically with perceptual vision, semantic vector retrieval, automatic OCR, and duplicate detection.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setShowFindMyPhotos(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-white bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 shadow-glow-primary transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-purple-400" />
              <span>Find My Photos</span>
            </button>
            <button
              onClick={() => setShowPhotobook(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-white bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Photobook</span>
            </button>
            <button
              onClick={refreshAll}
              disabled={loading || actionLoading}
              className="p-3 rounded-2xl glass-panel border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              title="Refresh AI Database"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleAnalyzeAll}
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-glow-primary hover:shadow-glow-cyan transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze Pending ({files.filter((f) => f.aiStatus !== 'analyzed').length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Analyzed */}
        <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-white/10 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analyzed Files</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{overview.totalAnalyzed}</div>
          <p className="text-xs text-slate-500 mt-1">{overview.pendingAnalysis} pending jobs</p>
        </div>

        {/* Smart Folders */}
        <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-white/10 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Smart Folders</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{overview.totalFolders}</div>
          <p className="text-xs text-slate-500 mt-1">Autonomous semantic clusters</p>
        </div>

        {/* Duplicate Groups */}
        <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-white/10 hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Duplicates Detected</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Copy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{overview.duplicateGroups}</div>
          <p className="text-xs text-slate-500 mt-1">SHA-256 & pHash perceptual clusters</p>
        </div>

        {/* Quota Usage */}
        <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-white/10 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly AI Quota</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {overview.quotaUsedThisMonth} <span className="text-xs font-normal text-slate-500">/ {overview.monthlyQuota}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-cyan-400 h-1.5 rounded-full"
              style={{
                width: `${Math.min(100, Math.round((overview.quotaUsedThisMonth / (overview.monthlyQuota || 1)) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-panel border border-white/10 overflow-x-auto">
        {[
          { id: 'library', label: 'Smart Library', icon: FolderOpen },
          { id: 'people', label: `People Library (${people.length})`, icon: Users },
          { id: 'command', label: `Command & Rules (${rules.length})`, icon: Terminal },
          { id: 'preview', label: 'Organization Preview', icon: Eye },
          { id: 'search', label: 'Semantic Search', icon: Search },
          { id: 'duplicates', label: `Duplicate Center (${duplicates.length})`, icon: Copy },
          { id: 'history', label: `History & Undo (${orgHistory.length})`, icon: RotateCcw },
          { id: 'privacy', label: 'Privacy & Consent', icon: Shield },
          { id: 'jobs', label: `Job Pipeline (${jobs.length})`, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'preview' && !orgPreview) {
                  handleFetchPreview();
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-primary'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SMART LIBRARY & FOLDERS */}
      {/* ========================================================= */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Smart Folders Carousel / Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> AI Smart Folders
                </h2>
                <p className="text-xs text-slate-400">
                  Virtual folders generated automatically from content semantics
                </p>
              </div>

              {selectedFolder && (
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                >
                  Clear filter (Show all {files.length} files)
                </button>
              )}
            </div>

            {folders.length === 0 ? (
              <div className="p-8 text-center glass-panel border border-dashed border-white/10 rounded-2xl">
                <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No smart folders generated yet</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Upload images or documents and run AI analysis to automatically categorize them.
                </p>
                <button
                  onClick={handleAnalyzeAll}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Start Auto-Organization
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {folders.map((folder) => (
                  <SmartFolderCard
                    key={folder._id}
                    folder={folder}
                    isSelected={selectedFolder?._id === folder._id}
                    onClick={(f) => setSelectedFolder(selectedFolder?._id === f._id ? null : f)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Files Grid with AI Enhancements */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedFolder ? `Files in "${selectedFolder.name}"` : 'All Organized Files'}
                </h3>
                <p className="text-xs text-slate-400">
                  Showing {filteredFiles.length} file(s) with AI captions and metadata
                </p>
              </div>

              {/* Natural Sort Controls */}
              <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900/90 border border-white/10 px-3 py-1.5 rounded-xl shadow-sm">
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-slate-400 font-medium">Sort:</span>
                <select
                  value={fileSortBy}
                  onChange={(e) => setFileSortBy(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
                >
                  <option value="name_asc" className="bg-slate-900 text-white">Name: 1 → 45 (A–Z)</option>
                  <option value="name_desc" className="bg-slate-900 text-white">Name: 45 → 1 (Z–A)</option>
                  <option value="newest" className="bg-slate-900 text-white">Newest Upload</option>
                  <option value="oldest" className="bg-slate-900 text-white">Oldest Upload</option>
                  <option value="quality_desc" className="bg-slate-900 text-white">Quality Score</option>
                  <option value="size_desc" className="bg-slate-900 text-white">File Size</option>
                </select>
              </div>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="p-12 text-center glass-panel border border-white/5 rounded-2xl">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No files found matching criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFiles.map((file) => {
                  // Derive ext from stored field OR fallback to originalName suffix
                  const rawExt = file.fileExtension ||
                    (file.originalName ? file.originalName.split('.').pop() : '');
                  const ext = (rawExt || '').toLowerCase();
                  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext);

                  return (
                    <div
                      key={file._id}
                      onClick={() => setSelectedFileForModal(file)}
                      className="group p-4 rounded-2xl glass-panel border border-white/10 hover:border-purple-500/40 hover:bg-white/[0.06] transition-all duration-300 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Media Preview or Icon Header */}
                        <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden mb-3 flex items-center justify-center border border-white/5">
                          {isImage && file.cloudinaryUrl ? (
                            <img
                              src={file.cloudinaryUrl}
                              alt={file.originalName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500 gap-1">
                              {ext === 'pdf' || ext === 'docx' || ext === 'txt' ? (
                                <FileText className="w-8 h-8 text-blue-400" />
                              ) : ext === 'mp4' || ext === 'mov' ? (
                                <Video className="w-8 h-8 text-purple-400" />
                              ) : ext === 'mp3' || ext === 'wav' ? (
                                <Music className="w-8 h-8 text-amber-400" />
                              ) : (
                                <Code className="w-8 h-8 text-emerald-400" />
                              )}
                              <span className="text-[10px] font-bold uppercase">{ext || 'file'}</span>
                            </div>
                          )}

                          {/* Quality Score Badge */}
                          {file.qualityScore && (
                            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
                              {file.qualityScore}% Q
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-xs text-white truncate mb-1" title={file.originalName}>
                          {file.originalName}
                        </h4>

                        {/* AI Caption */}
                        <p className="text-[11px] text-slate-400 line-clamp-2 italic mb-2">
                          "{file.aiCaption || file.metadata?.aiDescription || 'AI analysis pending...'}"
                        </p>

                        {/* Tag Chips */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(file.aiTags || file.metadata?.aiTags || []).slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{Math.round((file.fileSize || 0) / 1024)} KB</span>
                        <span
                          className={`font-semibold ${
                            file.aiStatus === 'analyzed'
                              ? 'text-emerald-400'
                              : file.aiStatus === 'processing'
                              ? 'text-amber-400 animate-pulse'
                              : 'text-slate-500'
                          }`}
                        >
                          {file.aiStatus || 'unprocessed'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: PEOPLE LIBRARY (Section 5 & 13) */}
      {/* ========================================================= */}
      {activeTab === 'people' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" /> Private People Library
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Autonomous face clusters created from visual similarity embeddings. Profiles are private to your account only, never cross-referenced externally, and fully user-editable.
              </p>
            </div>
            <button
              onClick={async () => {
                const name = window.prompt('Enter private display name for new person (e.g. "Friend A", "Mom", "Self"):');
                if (name && name.trim()) {
                  try {
                    const res = await aiAPI.createPerson({ displayName: name.trim() });
                    if (res.data?.success) {
                      showToast(`Created profile "${name.trim()}"`);
                      loadPeople();
                    }
                  } catch (e) {
                    showToast(e.message, 'error');
                  }
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-glow-primary transition-all self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Person Profile</span>
            </button>
          </div>

          {people.length === 0 ? (
            <div className="p-12 text-center glass-panel border border-dashed border-white/10 rounded-3xl">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">No person profiles recognized yet</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                Enable Face Matching in Privacy settings and run AI analysis on your photos. SnapShare will automatically cluster recurring people.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab('privacy')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  <Shield className="w-3.5 h-3.5 inline mr-1.5" />
                  Configure Privacy & Consent
                </button>
                <button
                  onClick={handleAnalyzeAll}
                  className="px-4 py-2 rounded-xl text-xs font-bold glass-panel border border-white/10 text-slate-300 hover:text-white"
                >
                  Analyze Photos
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {people.map((person) => {
                const isEditing = editingPersonId === person._id;
                const isSelected = selectedPerson?._id === person._id;

                return (
                  <div
                    key={person._id}
                    className={`p-4 rounded-2xl glass-panel border transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 shadow-glow-primary'
                        : 'border-white/10 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 overflow-hidden flex items-center justify-center shrink-0">
                        {person.samplePhotoUrl ? (
                          <img
                            src={person.samplePhotoUrl}
                            alt={person.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-purple-400" />
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingPersonId(person._id);
                            setEditingPersonName(person.displayName);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                          title="Rename Person"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePerson(person._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 mb-3">
                        <input
                          type="text"
                          value={editingPersonName}
                          onChange={(e) => setEditingPersonName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-purple-500 text-white text-xs focus:outline-none"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRenamePerson(person._id, editingPersonName)}
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-600 text-white"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPersonId(null)}
                            className="px-2 py-1 rounded-md text-[10px] text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <h4 className="font-bold text-sm text-white truncate" title={person.displayName}>
                          {person.displayName}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {person.unnamedId}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
                      <span className="text-slate-400 text-[11px]">
                        {person.fileCount || 0} recognized photo(s)
                      </span>
                      <button
                        onClick={() => setSelectedPerson(isSelected ? null : person)}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300"
                      >
                        {isSelected ? 'Deselect' : 'Filter Photos'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Photos of selected person */}
          {selectedPerson && (
            <div className="p-6 rounded-3xl glass-panel border border-purple-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Photos of "{selectedPerson.displayName}"
                  </h3>
                  <p className="text-xs text-slate-400">
                    Showing photographs matching this private person profile
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                >
                  Clear Selection
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {files
                  .filter((f) => {
                    const folder = folders.find((fol) => fol.personName === selectedPerson.displayName);
                    if (folder && folder.fileIds) {
                      return folder.fileIds.some((item) => (typeof item === 'object' ? item._id : item) === f._id);
                    }
                    return false;
                  })
                  .map((f) => (
                    <div
                      key={f._id}
                      onClick={() => setSelectedFileForModal(f)}
                      className="group cursor-pointer aspect-square rounded-xl bg-slate-900 border border-white/10 overflow-hidden relative"
                    >
                      {f.cloudinaryUrl ? (
                        <img
                          src={f.cloudinaryUrl}
                          alt={f.originalName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-slate-600 m-auto" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                        <p className="text-[10px] text-white font-medium truncate">{f.originalName}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: NATURAL LANGUAGE COMMAND & RULE BUILDER (Section 9 & 10) */}
      {/* ========================================================= */}
      {activeTab === 'command' && (
        <div className="space-y-6">
          {/* AI Command Center Hero */}
          <div className="p-6 rounded-3xl glass-panel border border-purple-500/30 bg-purple-950/20 space-y-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Natural Language Organization Command Center</h2>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Describe how you want your photographs sorted in natural English. SnapShare AI translates your instructions into a strict, validated JSON rule executed deterministically by the backend.
            </p>

            {/* Quick preset suggestion pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">
                Presets:
              </span>
              {[
                'If a photo contains more than four people, put it in Group Photos.',
                'Create a separate folder for every unique group of four people.',
                'Group photos containing the same three people.',
                'Put photographs containing two recognized people together.',
                'Create individual folders for each recognized person.',
                'Do not organize photographs where face matching confidence is below 95 percent.',
                'Keep unknown people in Needs Review.',
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setCommandPrompt(preset)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-white/10 hover:border-purple-500/30 transition-all text-left"
                >
                  "{preset}"
                </button>
              ))}
            </div>

            {/* Command Input Box */}
            <div className="space-y-3 pt-2">
              <textarea
                value={commandPrompt}
                onChange={(e) => setCommandPrompt(e.target.value)}
                rows={3}
                placeholder="Type your natural language organization command here..."
                className="w-full p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Strict allowlist validator active: No arbitrary code is ever executed.
                </span>
                <button
                  onClick={handleInterpretCommand}
                  disabled={isInterpreting || !commandPrompt.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 shadow-glow-primary transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isInterpreting ? 'Interpreting Command...' : 'Interpret & Validate Rule'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interpreted Rule Preview Card */}
          {interpretedRule && (
            <div className="p-6 rounded-3xl glass-panel border border-emerald-500/40 bg-emerald-950/10 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base text-white">
                    Validated Rule: {interpretedRule.rule?.name}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Schema Validated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-purple-400 block">
                    Expected Behavior
                  </span>
                  <p className="text-slate-200 leading-relaxed">
                    {interpretedRule.expectedBehavior}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-cyan-400 block">
                    Example Scenario
                  </span>
                  <p className="text-slate-200 leading-relaxed">
                    {interpretedRule.example}
                  </p>
                </div>
              </div>

              {/* Structured JSON Schema viewer */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Structured Rule JSON (Allowlisted Actions & Conditions)
                </span>
                <pre className="p-3 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                  {JSON.stringify(interpretedRule.rule, null, 2)}
                </pre>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setInterpretedRule(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveRule}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Save to Active Organization Engine</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Rules List */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" /> Active Organization Rules ({rules.length})
            </h3>

            {rules.length === 0 ? (
              <div className="p-8 text-center glass-panel border border-white/5 rounded-2xl">
                <p className="text-xs text-slate-400">
                  Default rules are active: Master deterministic Rules A through G are governing folder allocation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule._id}
                    className="p-4 rounded-2xl glass-panel border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm text-white">{rule.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                          Priority #{rule.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 italic">
                        "{rule.naturalLanguagePrompt || 'Custom structured rule'}"
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteRule(rule._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: ORGANIZATION PREVIEW & APPROVAL (Section 11) */}
      {/* ========================================================= */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" /> Organization Preview & Approval Center
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Dry-run simulation of the deterministic member-combination engine. Inspect proposed folder structures, reused folders, and photos flagged for review before committing changes.
              </p>
            </div>

            <button
              onClick={handleFetchPreview}
              disabled={isLoadingPreview}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold glass-panel border border-white/10 text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPreview ? 'animate-spin' : ''}`} />
              <span>Refresh Dry-Run</span>
            </button>
          </div>

          {orgPreview ? (
            <div className="space-y-6">
              {/* Metric Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl glass-panel border border-white/10">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Photos</span>
                  <span className="text-xl font-black text-white mt-1 block">{orgPreview.totalFiles}</span>
                </div>
                <div className="p-3.5 rounded-2xl glass-panel border border-indigo-500/30 bg-indigo-950/20">
                  <span className="text-[10px] font-bold uppercase text-indigo-300 block">Group Photos (&gt;4)</span>
                  <span className="text-xl font-black text-white mt-1 block">{orgPreview.groupPhotosCount}</span>
                </div>
                <div className="p-3.5 rounded-2xl glass-panel border border-amber-500/30 bg-amber-950/20">
                  <span className="text-[10px] font-bold uppercase text-amber-300 block">4-Member Groups</span>
                  <span className="text-xl font-black text-white mt-1 block">{orgPreview.fourMemberCount}</span>
                </div>
                <div className="p-3.5 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-950/20">
                  <span className="text-[10px] font-bold uppercase text-emerald-300 block">3-Member Groups</span>
                  <span className="text-xl font-black text-white mt-1 block">{orgPreview.threeMemberCount}</span>
                </div>
                <div className="p-3.5 rounded-2xl glass-panel border border-blue-500/30 bg-blue-950/20">
                  <span className="text-[10px] font-bold uppercase text-blue-300 block">2-Member Pairs</span>
                  <span className="text-xl font-black text-white mt-1 block">{orgPreview.twoMemberCount}</span>
                </div>
                <div className="p-3.5 rounded-2xl glass-panel border border-rose-500/30 bg-rose-950/20">
                  <span className="text-[10px] font-bold uppercase text-rose-300 block">Needs Review</span>
                  <span className="text-xl font-black text-white mt-1 block">{orgPreview.needsReviewCount}</span>
                </div>
              </div>

              {/* Proposed Virtual Folders Table */}
              <div className="rounded-3xl glass-panel border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Proposed Virtual Folder Hierarchy</h3>
                  <span className="text-xs text-slate-400">Based on Rules A through G</span>
                </div>

                <div className="divide-y divide-white/5 text-xs">
                  {orgPreview.proposedFolders?.map((pf, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="w-4 h-4 text-purple-400" />
                        <span className="font-medium text-white">{pf.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400">{pf.count} photo(s)</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {pf.action}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution CTA Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
                <div>
                  <h4 className="font-bold text-base text-white">Ready to Execute Organization Plan?</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Original files are never duplicated or deleted. You can undo this entire job with 1 click from History.
                  </p>
                </div>

                <button
                  onClick={handleExecuteOrganization}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow-primary transition-all shrink-0"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Execute Organization</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center glass-panel border border-dashed border-white/10 rounded-3xl">
              <Eye className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Click below to generate a dry-run preview</p>
              <button
                onClick={handleFetchPreview}
                disabled={isLoadingPreview}
                className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
              >
                Generate Preview
              </button>
            </div>
          )}
        </div>
      )}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Hero Box */}
          <div className="p-6 rounded-3xl glass-panel border border-purple-500/30 bg-purple-950/20">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Multimodal Semantic Search
            </h2>
            <p className="text-xs text-slate-300 mb-6">
              Search by visual description, OCR text extracted from screenshots, detected objects, or scene environments.
            </p>

            <form onSubmit={handleSemanticSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. 'Red sports car beside modern building', 'screenshots with React code', 'sunset mountains'..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-4 py-3.5 rounded-2xl bg-slate-900 border border-white/10 text-slate-300 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="all">All File Types</option>
                <option value="image">Images Only</option>
                <option value="document">Documents Only</option>
                <option value="code">Code Only</option>
              </select>

              <button
                type="submit"
                disabled={isSearching}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 shadow-glow-primary transition-all shrink-0"
              >
                {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Semantic Query</span>
              </button>
            </form>

            {/* Query suggestions */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-[11px] text-slate-400 font-semibold">Try queries:</span>
              {[
                'Cars and vehicles',
                'Sunset landscapes',
                'Code with useState',
                'Meeting notes document',
                'High resolution portraits',
                'Green plants',
              ].map((query, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchQuery(query);
                    setTimeout(() => handleSemanticSearch(), 50);
                  }}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-white/10 transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                {hasSearched ? `Search Results (${searchResults.length})` : 'Search Overview'}
              </h3>
            </div>

            {hasSearched && searchResults.length === 0 ? (
              <div className="p-12 text-center glass-panel border border-white/5 rounded-2xl">
                <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-300 font-semibold">No semantic matches found</p>
                <p className="text-xs text-slate-500 mt-1">Try relaxing terms or using synonyms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.map((result) => {
                  const file = result.file || result;
                  const score = Math.round((result.score || 0.85) * 100);

                  return (
                    <div
                      key={file._id}
                      onClick={() => setSelectedFileForModal(file)}
                      className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden mb-3 flex items-center justify-center">
                          {file.cloudinaryUrl ? (
                            <img
                              src={file.cloudinaryUrl}
                              alt={file.originalName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-8 h-8 text-slate-500" />
                          )}
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                            {score}% Match
                          </span>
                        </div>

                        <h4 className="font-semibold text-xs text-white truncate mb-1">{file.originalName}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 italic mb-2">
                          "{file.aiCaption || file.metadata?.aiDescription || 'Match found by vector cosine similarity'}"
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-500 pt-2 border-t border-white/5 flex items-center justify-between">
                        <span>Relevance: {score}%</span>
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DUPLICATE DETECTION CENTER */}
      {/* ========================================================= */}
      {activeTab === 'duplicates' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-panel border border-rose-500/20 bg-rose-950/10">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Copy className="w-5 h-5 text-rose-400" /> Duplicate & Similarity Center
            </h2>
            <p className="text-xs text-slate-300">
              Two-tiered scan identifies byte-exact files (SHA-256) and visually identical compressed/resized versions (pHash perceptual distance ≤ 10). Reclaim wasted cloud storage safely.
            </p>
          </div>

          {duplicates.length === 0 ? (
            <div className="p-16 text-center glass-panel border border-dashed border-white/10 rounded-3xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Zero Duplicates Detected</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your storage is completely optimized. No byte-identical or perceptual clones found across your collections.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates.map((group) => {
                const primary = group.primaryFileId;
                const copies = group.duplicateFileIds || [];
                const savingsKB = Math.round((group.potentialSavingsBytes || 0) / 1024);

                return (
                  <div
                    key={group._id}
                    className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-rose-500/30 transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            group.detectionType === 'exact_hash'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {group.detectionType === 'exact_hash' ? 'Exact Byte Duplicate' : 'Perceptual Clone'}
                        </span>
                        <span className="text-xs text-slate-400">
                          Potential reclaimable: <strong className="text-white">{savingsKB} KB</strong>
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          handleResolveDuplicate(
                            group._id,
                            primary?._id,
                            copies.map((c) => c._id)
                          )
                        }
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-glow-rose transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reclaim ({copies.length} duplicates)</span>
                      </button>
                    </div>

                    {/* Side by side comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Primary Original */}
                      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-purple-300 uppercase">
                          <span>Keep (Original)</span>
                          <span>{Math.round((primary?.fileSize || 0) / 1024)} KB</span>
                        </div>
                        <div className="aspect-video rounded-lg bg-black overflow-hidden flex items-center justify-center">
                          {primary?.cloudinaryUrl ? (
                            <img src={primary.cloudinaryUrl} alt="Original" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-6 h-6 text-slate-500" />
                          )}
                        </div>
                        <p className="text-xs font-medium text-white truncate">{primary?.originalName}</p>
                      </div>

                      {/* Duplicate Copies */}
                      {copies.map((copy) => (
                        <div key={copy._id} className="p-3 rounded-xl bg-rose-950/10 border border-rose-500/20 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-bold text-rose-300 uppercase">
                            <span>Duplicate to Delete</span>
                            <span>{Math.round((copy?.fileSize || 0) / 1024)} KB</span>
                          </div>
                          <div className="aspect-video rounded-lg bg-black overflow-hidden flex items-center justify-center">
                            {copy?.cloudinaryUrl ? (
                              <img src={copy.cloudinaryUrl} alt="Duplicate" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-6 h-6 text-slate-500" />
                            )}
                          </div>
                          <p className="text-xs font-medium text-white truncate">{copy?.originalName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: JOB PIPELINE */}
      {/* ========================================================= */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" /> AI Background Execution Queue
              </h2>
              <p className="text-xs text-slate-400">
                In-memory concurrent neural pipelines executing vision captions, OCR text, and vector embeddings
              </p>
            </div>
            <button
              onClick={loadJobs}
              className="p-2 rounded-xl glass-panel border border-white/10 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Asset</th>
                    <th className="p-3.5">Pipeline Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Progress</th>
                    <th className="p-3.5">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">
                        No processing jobs in history.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job._id} className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-medium text-white truncate max-w-xs">
                          {job.fileId?.originalName || job.fileId || 'File Asset'}
                        </td>
                        <td className="p-3.5 text-slate-300">{job.jobType}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              job.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : job.status === 'processing'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                : job.status === 'failed'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-700/30 text-slate-400'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-purple-500 h-1.5 rounded-full"
                              style={{ width: `${job.progress || 0}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {new Date(job.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: ORGANIZATION HISTORY & UNDO (Section 12) */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-400" /> Organization History & 1-Click Rollback
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Every organization action is fully snapshotted. You can undo or restore any past folder allocation instantaneously without risking original files.
              </p>
            </div>
            <button
              onClick={loadFaceHistory}
              className="p-2 rounded-xl glass-panel border border-white/10 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {orgHistory.length === 0 ? (
            <div className="p-12 text-center glass-panel border border-white/5 rounded-3xl">
              <RotateCcw className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No organization operations recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Execute an AI organization job to record full snapshot history.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orgHistory.map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white capitalize">
                        {item.action?.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.isUndone
                            ? 'bg-slate-700 text-slate-400'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.isUndone ? 'Rolled Back' : 'Active'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleString()} · {item.affectedFileIds?.length || 0} file(s) affected
                    </p>

                    {item.affectedFolders?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.affectedFolders.map((f, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          >
                            📁 {f.folderName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {!item.isUndone ? (
                      <button
                        onClick={() => handleUndoOrg(item._id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600/80 hover:bg-amber-600 text-white transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Undo Operation</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestoreOrg(item._id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Restore Assignments</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: PRIVACY & CONSENT (Section 5 & 19) */}
      {/* ========================================================= */}
      {activeTab === 'privacy' && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" /> Privacy, Security & Consent Controls
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                SnapShare enforces strict privacy principles. Face analysis runs locally inside your private workspace. No real-world identities are ever resolved or queried externally.
              </p>
            </div>

            {/* Neural Face Detection Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div>
                <h4 className="text-sm font-bold text-white">Enable Deep Neural Face Detection (YuNet)</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detects human faces, bounding boxes, landmarks, and accurately counts people in photos.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPrivacyConsent({
                    ...privacyConsent,
                    enableFaceDetection: !privacyConsent.enableFaceDetection,
                  })
                }
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  privacyConsent.enableFaceDetection ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    privacyConsent.enableFaceDetection ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Explicit Consent for Face Embeddings / Matching */}
            <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-bold text-white">
                    Explicit Consent: Privacy-Conscious Face Matching & Embeddings (SFace)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPrivacyConsent({
                      ...privacyConsent,
                      enableFaceMatching: !privacyConsent.enableFaceMatching,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    privacyConsent.enableFaceMatching ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      privacyConsent.enableFaceMatching ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                By enabling this option, you grant explicit consent for SnapShare to extract 128-dimensional mathematical feature vectors to match recurring individuals across photographs. Embeddings are kept completely private to your account and never shared or sold.
              </p>
            </div>

            {/* Face Detection Confidence Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Face Detection Threshold (YuNet)
                </label>
                <span className="text-xs font-bold text-purple-400">
                  {Math.round((privacyConsent.faceDetectionThreshold || 0.85) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={privacyConsent.faceDetectionThreshold || 0.85}
                onChange={(e) =>
                  setPrivacyConsent({
                    ...privacyConsent,
                    faceDetectionThreshold: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>More Detections (50%)</span>
                <span>Recommended (85%)</span>
                <span>Ultra-Strict (95%)</span>
              </div>
            </div>

            {/* Face Identity Matching Threshold Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Identity Matching Threshold (SFace Cosine Similarity)
                </label>
                <span className="text-xs font-bold text-purple-400">
                  {Math.round((privacyConsent.faceMatchingThreshold || 0.95) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="0.98"
                step="0.02"
                value={privacyConsent.faceMatchingThreshold || 0.95}
                onChange={(e) =>
                  setPrivacyConsent({
                    ...privacyConsent,
                    faceMatchingThreshold: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Flexible (60%)</span>
                <span>Strict Precision (95%)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => handleSavePrivacy(privacyConsent)}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 shadow-glow-primary transition-all"
              >
                Save Privacy Settings
              </button>
            </div>
          </div>

          {/* DANGER ZONE: Permanent Face Data Purge */}
          <div className="p-6 rounded-3xl glass-panel border border-rose-500/30 bg-rose-950/10 space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-rose-300">Data Subject Right: Permanent Face Purge</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with privacy regulations and Section 19 of the SnapShare AI Architecture, you have the right to permanently purge all facial embeddings, recognized person profiles, face detections, and group folders from our database at any time. Original photographs in Cloudflare/Cloudinary will remain completely intact.
            </p>
            <button
              onClick={handlePurgeFaceData}
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-glow-rose transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purge All Private Face Data Now</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FILE INSPECTOR MODAL */}
      {/* ========================================================= */}
      {selectedFileForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl glass-panel bg-slate-900 border border-purple-500/30 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-base text-white truncate max-w-md">
                {selectedFileForModal.originalName}
              </h3>
              <button
                onClick={() => setSelectedFileForModal(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Image Preview */}
            {selectedFileForModal.cloudinaryUrl && (
              <div className="aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/5">
                <img
                  src={selectedFileForModal.cloudinaryUrl}
                  alt={selectedFileForModal.originalName}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* AI Insights Details */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  AI Caption & Description
                </span>
                <p className="text-sm text-slate-200 italic mt-1 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  "{selectedFileForModal.aiCaption || selectedFileForModal.metadata?.aiDescription || 'None'}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="text-white font-semibold capitalize mt-0.5 block">
                    {selectedFileForModal.metadata?.aiCategory || 'General'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Quality Rating</span>
                  <span className="text-cyan-400 font-semibold mt-0.5 block">
                    {selectedFileForModal.qualityScore ? `${selectedFileForModal.qualityScore}% (High)` : 'Standard'}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Recognized Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedFileForModal.aiTags || selectedFileForModal.metadata?.aiTags || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <a
                href={selectedFileForModal.cloudinaryUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                <span>Open Raw Cloudinary Asset</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setSelectedFileForModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature 1: Find My Photos Modal */}
      <FindMyPhotosModal
        isOpen={showFindMyPhotos}
        onClose={() => setShowFindMyPhotos(false)}
        token={localStorage.getItem('snapshare_token')}
      />

      {/* Feature 6: Curated Photobook Modal */}
      <PhotobookModal
        isOpen={showPhotobook}
        onClose={() => setShowPhotobook(false)}
      />
    </div>
  );
}
