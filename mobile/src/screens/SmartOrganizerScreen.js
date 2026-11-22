import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { FolderCard } from '../components/FolderCard';
import { PhotoDetailModal } from './PhotoDetailModal';
import { SelfieSearchModal } from './SelfieSearchModal';
import { PhotobookModal } from './PhotobookModal';

export const SmartOrganizerScreen = () => {
  // Organizer sub-tabs matching the web: 'library' | 'search' | 'duplicates' | 'rules' | 'jobs'
  const [activeSubTab, setActiveSubTab] = useState('library');

  // New Feature Modals
  const [showSelfie, setShowSelfie] = useState(false);
  const [showPhotobook, setShowPhotobook] = useState(false);

  // Library State
  const [folders, setFolders] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const [analyzingPending, setAnalyzingPending] = useState(false);

  // Overview Stats (Parity with Web Dashboard)
  const [overview, setOverview] = useState({
    totalAnalyzed: 0,
    pendingAnalysis: 0,
    totalFolders: 0,
    duplicateGroups: 0,
    monthlyQuota: 500,
    quotaUsedThisMonth: 0,
    microserviceOnline: true,
    organizationMode: 'review',
  });

  // Semantic Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Duplicate Center State
  const [duplicates, setDuplicates] = useState([]);
  const [resolvingDuplicate, setResolvingDuplicate] = useState(false);

  // Natural Language Rule State
  const [rulePrompt, setRulePrompt] = useState(
    'If a photo contains more than four people, put it in Group Photos. For exactly four, three, two, or one person, group photographs containing the same recognized members together.'
  );
  const [interpretedRule, setInterpretedRule] = useState(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [orgPreview, setOrgPreview] = useState(null);
  const [orgHistory, setOrgHistory] = useState([]);

  // Job Pipeline State
  const [jobs, setJobs] = useState([]);

  const loadData = async () => {
    try {
      const [overviewData, foldersData, filesData, dupData, jobsData, historyData] = await Promise.all([
        api.getAIOverview().catch(() => ({ stats: {} })),
        api.getSmartFolders().catch(() => []),
        api.getFiles().catch(() => ({ files: [] })),
        api.getDuplicates().catch(() => ({ duplicates: [] })),
        api.getJobs().catch(() => ({ jobs: [] })),
        api.getOrganizationHistory().catch(() => ({ history: [] })),
      ]);

      if (overviewData?.stats) {
        setOverview(overviewData.stats);
      }
      setFolders(Array.isArray(foldersData) ? foldersData : (foldersData.folders || []));
      setAllFiles(Array.isArray(filesData) ? filesData : (filesData.files || []));
      setDuplicates(dupData.duplicates || dupData.groups || []);
      setJobs(jobsData.jobs || []);
      setOrgHistory(historyData.history || []);
    } catch (err) {
      console.warn('Failed to load organizer data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAnalyzeAll = async () => {
    const unanalyzed = allFiles.filter((f) => f.aiStatus !== 'analyzed');
    const fileIds = unanalyzed.map((f) => f._id || f.id).filter(Boolean);
    if (fileIds.length === 0) {
      Alert.alert('All Caught Up', 'All photographs have already been analyzed by the AI engine!');
      return;
    }
    setAnalyzingPending(true);
    try {
      const res = await api.analyzeBulk(fileIds);
      Alert.alert(
        'AI Queue Dispatched',
        `Enqueued ${res.enqueuedCount || fileIds.length} file(s) for neural face & scene analysis!`
      );
      loadData();
    } catch (err) {
      Alert.alert('Analysis Error', err.message || 'Failed to dispatch AI analysis jobs');
    } finally {
      setAnalyzingPending(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // 1. Semantic Search Handler
  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await api.searchAI(searchQuery.trim());
      setSearchResults(res.results || []);
    } catch (err) {
      Alert.alert('Search Error', err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // 2. Duplicate Resolution Handler
  const handleResolveDuplicate = async (groupId, keepFileId, deleteFileIds) => {
    setResolvingDuplicate(true);
    try {
      await api.resolveDuplicates(groupId, keepFileId, deleteFileIds);
      Alert.alert('Resolved', 'Duplicate photo resolved and storage reclaimed.');
      loadData();
    } catch (err) {
      Alert.alert('Resolution Error', err.message);
    } finally {
      setResolvingDuplicate(false);
    }
  };

  // 3. Natural Language Rule Interpretation Handler
  const handleInterpretRule = async () => {
    if (!rulePrompt.trim()) return;
    setIsInterpreting(true);
    try {
      const res = await api.interpretRule(rulePrompt.trim());
      setInterpretedRule(res.rule || res);
      // Fetch preview
      const prev = await api.previewGroupOrganization({ rule: res.rule || res }).catch(() => null);
      if (prev?.preview) setOrgPreview(prev.preview);
      Alert.alert('Rule Validated ✨', 'Natural language prompt converted into structured AST rule.');
    } catch (err) {
      Alert.alert('Interpretation Failed', err.message);
    } finally {
      setIsInterpreting(false);
    }
  };

  // Execute Rule
  const handleExecuteRule = async () => {
    setOrganizing(true);
    try {
      await api.executeGroupOrganization({ rule: interpretedRule });
      Alert.alert('Organization Applied', 'Folders created & photos classified deterministically.');
      setInterpretedRule(null);
      setOrgPreview(null);
      setActiveSubTab('library');
      loadData();
    } catch (err) {
      Alert.alert('Execution Failed', err.message);
    } finally {
      setOrganizing(false);
    }
  };

  // Undo / Rollback
  const handleUndo = async (historyId) => {
    try {
      await api.undoOrganization(historyId);
      Alert.alert('Rolled Back', 'Previous organization action undone successfully.');
      loadData();
    } catch (err) {
      Alert.alert('Undo Failed', err.message);
    }
  };

  // Retry background job
  const handleRetryJob = async (jobId) => {
    try {
      await api.retryJob(jobId);
      Alert.alert('Job Retried', 'Re-dispatched job to queue.');
      loadData();
    } catch (err) {
      Alert.alert('Retry Failed', err.message);
    }
  };

  // Filter files by selected smart folder
  const displayedFiles = selectedFolder
    ? (selectedFolder.fileIds || [])
        .map((item) => {
          if (typeof item === 'object' && item !== null && (item._id || item.id)) return item;
          const found = allFiles.find((f) => String(f._id || f.id) === String(item));
          return found || null;
        })
        .filter(Boolean)
    : allFiles;

  const renderPhotoItem = ({ item }) => {
    const url = item.cloudinaryUrl || item.url || item.thumbnailUrl;
    const faceCount = item.faceCount || item.aiAnalysis?.faceCount || 0;
    const caption = item.aiAnalysis?.caption || item.caption || '';
    const tags = item.aiAnalysis?.tags || item.tags || [];

    return (
      <TouchableOpacity
        style={styles.photoCard}
        onPress={() => setActivePhoto(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageWrap}>
          {url ? (
            <Image source={{ uri: url }} style={styles.photoImg} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image-outline" size={28} color="#64748B" />
            </View>
          )}

          {faceCount > 0 ? (
            <View style={styles.faceBadge}>
              <Ionicons name="person" size={10} color="#FFFFFF" />
              <Text style={styles.faceBadgeText}>{faceCount} {faceCount === 1 ? 'Person' : 'People'}</Text>
            </View>
          ) : (
            <View style={[styles.faceBadge, styles.sceneryBadge]}>
              <Ionicons name="image" size={10} color="#FFFFFF" />
              <Text style={styles.faceBadgeText}>Scenery</Text>
            </View>
          )}

          <View style={styles.qualityPill}>
            <Text style={styles.qualityText}>100% Q</Text>
          </View>

          {item.voiceNote?.url && (
            <View style={styles.voiceNoteBadge}>
              <Ionicons name="mic" size={10} color="#C084FC" />
            </View>
          )}
        </View>

        <View style={styles.photoMeta}>
          <Text style={styles.fileName} numberOfLines={1}>{item.originalName || item.filename || 'Photograph'}</Text>
          {caption ? (
            <Text style={styles.photoCaption} numberOfLines={2}>{caption}</Text>
          ) : null}

          <View style={styles.tagRow}>
            {tags.slice(0, 2).map((t, i) => (
              <View key={i} style={styles.tagChip}>
                <Text style={styles.tagChipText}>#{t.replace(/^#/, '')}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="AI Smart Organizer"
        subtitle="Face intelligence, semantic search & rule engine"
        rightAction
        rightIcon="refresh"
        onRightAction={handleRefresh}
      />

      {/* Sub-Tab Navigation Bar (Matching Website Tabs) */}
      <View style={styles.subTabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabScroll}>
          {/* Feature 1: Find My Photos */}
          <TouchableOpacity
            style={[styles.subTabItem, { backgroundColor: '#7C3AED' }]}
            onPress={() => setShowSelfie(true)}
          >
            <Ionicons name="camera" size={14} color="#FFFFFF" />
            <Text style={[styles.subTabText, { color: '#FFFFFF', fontWeight: '700' }]}>
              Find My Photos
            </Text>
          </TouchableOpacity>

          {/* Feature 6: Auto-Curated Photobook */}
          <TouchableOpacity
            style={[styles.subTabItem, { backgroundColor: 'rgba(124, 58, 237, 0.25)', borderColor: '#A855F7' }]}
            onPress={() => setShowPhotobook(true)}
          >
            <Ionicons name="book-outline" size={14} color="#C084FC" />
            <Text style={[styles.subTabText, { color: '#C084FC', fontWeight: '700' }]}>
              Photobook
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'library' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('library')}
          >
            <Ionicons name="folder" size={14} color={activeSubTab === 'library' ? '#A78BFA' : '#94A3B8'} />
            <Text style={[styles.subTabText, activeSubTab === 'library' && styles.subTabTextActive]}>
              Smart Library
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'search' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('search')}
          >
            <Ionicons name="search" size={14} color={activeSubTab === 'search' ? '#A78BFA' : '#94A3B8'} />
            <Text style={[styles.subTabText, activeSubTab === 'search' && styles.subTabTextActive]}>
              Semantic Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'duplicates' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('duplicates')}
          >
            <Ionicons name="copy-outline" size={14} color={activeSubTab === 'duplicates' ? '#A78BFA' : '#94A3B8'} />
            <Text style={[styles.subTabText, activeSubTab === 'duplicates' && styles.subTabTextActive]}>
              Duplicates ({duplicates.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'rules' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('rules')}
          >
            <Ionicons name="terminal-outline" size={14} color={activeSubTab === 'rules' ? '#A78BFA' : '#94A3B8'} />
            <Text style={[styles.subTabText, activeSubTab === 'rules' && styles.subTabTextActive]}>
              Rule Console
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'jobs' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('jobs')}
          >
            <Ionicons name="time-outline" size={14} color={activeSubTab === 'jobs' ? '#A78BFA' : '#94A3B8'} />
            <Text style={[styles.subTabText, activeSubTab === 'jobs' && styles.subTabTextActive]}>
              Jobs ({jobs.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* TAB 1: SMART LIBRARY */}
      {activeSubTab === 'library' && (
        <FlatList
          data={displayedFiles}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          numColumns={2}
          renderItem={renderPhotoItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8B5CF6" />
          }
          ListHeaderComponent={
            <View style={styles.headerArea}>
              {/* AI Engine Hero Banner (Matching Website) */}
              <View style={styles.heroCard}>
                <View style={styles.engineBadgeRow}>
                  <View style={styles.engineBadge}>
                    <Ionicons name="sparkles" size={12} color="#C084FC" />
                    <Text style={styles.engineBadgeText}>SnapShare AI Engine 2.0</Text>
                  </View>
                  <View style={styles.engineOnlineBadge}>
                    <View
                      style={[
                        styles.pulseDot,
                        { backgroundColor: overview.microserviceOnline ? '#10B981' : '#F59E0B' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.engineOnlineText,
                        { color: overview.microserviceOnline ? '#34D399' : '#FBBF24' },
                      ]}
                    >
                      {overview.microserviceOnline
                        ? 'FastAPI Neural Engine Online'
                        : 'Deterministic Fallback'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.heroTitle}>Intelligent File Intelligence & Organizer</Text>
                <Text style={styles.heroSub}>
                  Upload everything. Understand anything. Organize automatically with perceptual vision, semantic vector retrieval, automatic OCR, and duplicate detection.
                </Text>

                <View style={styles.heroActionsRow}>
                  <TouchableOpacity
                    style={styles.heroBtnPrimary}
                    onPress={handleAnalyzeAll}
                    disabled={analyzingPending}
                    activeOpacity={0.8}
                  >
                    {analyzingPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                        <Text style={styles.heroBtnPrimaryText}>
                          Analyze Pending ({allFiles.filter((f) => f.aiStatus !== 'analyzed').length})
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.heroBtnSecondary}
                    onPress={() => setShowSelfie(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={14} color="#C084FC" />
                    <Text style={styles.heroBtnSecondaryText}>Find My Photos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.heroBtnSecondary}
                    onPress={() => setShowPhotobook(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="book-outline" size={14} color="#C084FC" />
                    <Text style={styles.heroBtnSecondaryText}>Photobook</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 4 KPI Stats Row (Matching Website) */}
              <View style={styles.kpiContainer}>
                {/* Row 1 */}
                <View style={styles.kpiRow}>
                  <View style={styles.kpiCard}>
                    <View style={styles.kpiHeader}>
                      <Text style={styles.kpiLabel}>Analyzed Files</Text>
                      <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                        <Ionicons name="checkmark-circle-outline" size={15} color="#C084FC" />
                      </View>
                    </View>
                    <Text style={styles.kpiValue}>{overview.totalAnalyzed}</Text>
                    <Text style={styles.kpiSub}>{overview.pendingAnalysis} pending jobs</Text>
                  </View>

                  <View style={styles.kpiCard}>
                    <View style={styles.kpiHeader}>
                      <Text style={styles.kpiLabel}>Smart Folders</Text>
                      <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                        <Ionicons name="folder-open-outline" size={15} color="#818CF8" />
                      </View>
                    </View>
                    <Text style={styles.kpiValue}>{overview.totalFolders}</Text>
                    <Text style={styles.kpiSub}>Autonomous clusters</Text>
                  </View>
                </View>

                {/* Row 2 */}
                <View style={styles.kpiRow}>
                  <View style={styles.kpiCard}>
                    <View style={styles.kpiHeader}>
                      <Text style={styles.kpiLabel}>Duplicates</Text>
                      <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                        <Ionicons name="copy-outline" size={15} color="#FB7185" />
                      </View>
                    </View>
                    <Text style={styles.kpiValue}>{overview.duplicateGroups}</Text>
                    <Text style={styles.kpiSub}>SHA-256 & pHash</Text>
                  </View>

                  <View style={styles.kpiCard}>
                    <View style={styles.kpiHeader}>
                      <Text style={styles.kpiLabel}>Monthly AI Quota</Text>
                      <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                        <Ionicons name="flash-outline" size={15} color="#22D3EE" />
                      </View>
                    </View>
                    <Text style={styles.kpiValue}>
                      {overview.quotaUsedThisMonth}{' '}
                      <Text style={styles.kpiSubTotal}>/ {overview.monthlyQuota}</Text>
                    </Text>
                    <View style={styles.quotaBarBg}>
                      <View
                        style={[
                          styles.quotaBarFill,
                          {
                            width: `${Math.min(
                              100,
                              Math.round((overview.quotaUsedThisMonth / (overview.monthlyQuota || 1)) * 100)
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Section Header: Smart Folders */}
              <View style={styles.sectionTitleBlock}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="sparkles" size={14} color="#C084FC" />
                  <Text style={styles.sectionMainTitle}>AI Smart Folders ({folders.length})</Text>
                </View>
                <Text style={styles.sectionSubTitle}>
                  Virtual folders generated automatically from content semantics
                </Text>
              </View>

              {/* 2-Column Responsive Folder Grid (Matching Website Cards) */}
              <View style={styles.foldersGridContainer}>
                <TouchableOpacity
                  style={[
                    styles.allFolderCardGrid,
                    !selectedFolder && styles.allFolderCardActive,
                  ]}
                  onPress={() => setSelectedFolder(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.allFolderTopRow}>
                    <View style={styles.allFolderIconWrap}>
                      <Ionicons name="apps" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.allFolderBadge}>
                      <Text style={styles.allFolderBadgeText}>Default</Text>
                    </View>
                  </View>
                  <Text style={styles.allFolderGridTitle} numberOfLines={1}>All Photos</Text>
                  <Text style={styles.allFolderGridSub} numberOfLines={1}>Unfiltered Vault</Text>
                  <View style={styles.allFolderBottomRow}>
                    <Text style={styles.allFolderCountText}>{allFiles.length} files</Text>
                    <Ionicons name="chevron-forward" size={14} color="#64748B" />
                  </View>
                </TouchableOpacity>

                {folders.map((f) => (
                  <FolderCard
                    key={f._id || f.id || f.name}
                    folder={f}
                    isGrid
                    isSelected={selectedFolder?._id === f._id}
                    onPress={() => setSelectedFolder(selectedFolder?._id === f._id ? null : f)}
                  />
                ))}
              </View>

              <View style={styles.filterBar}>
                <View>
                  <Text style={styles.filterTitle}>
                    {selectedFolder ? `Files in "${selectedFolder.name}"` : 'All Organized Files'}
                  </Text>
                  <Text style={styles.filterText}>
                    Showing {displayedFiles.length} file(s) with AI captions and metadata
                  </Text>
                </View>
                {selectedFolder ? (
                  <TouchableOpacity onPress={() => setSelectedFolder(null)}>
                    <Text style={styles.clearFilterText}>Clear Filter</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="images-outline" size={48} color="#475569" />
              <Text style={styles.emptyTitle}>No matching photographs</Text>
              <Text style={styles.emptySubtitle}>
                Upload event photos to see automatic AI face grouping.
              </Text>
            </View>
          }
        />
      )}

      {/* TAB 2: SEMANTIC SEARCH */}
      {activeSubTab === 'search' && (
        <View style={styles.tabContainer}>
          <View style={styles.searchBarWrap}>
            <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="e.g. portrait of two friends, night lights..."
              placeholderTextColor="#64748B"
              returnKeyType="search"
              onSubmitEditing={handleSemanticSearch}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSemanticSearch}>
              {isSearching ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.searchBtnText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item._id || item.id || String(Math.random())}
            numColumns={2}
            renderItem={renderPhotoItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="sparkles-outline" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>
                  {hasSearched ? 'No matching images found' : 'Natural Language Semantic Search'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {hasSearched
                    ? 'Try searching with different descriptive terms or tags.'
                    : 'Search across all photographs using natural human descriptions.'}
                </Text>
              </View>
            }
          />
        </View>
      )}

      {/* TAB 3: DUPLICATE CENTER */}
      {activeSubTab === 'duplicates' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.sectionHeaderCard}>
            <Ionicons name="copy" size={20} color="#F59E0B" />
            <View style={styles.sectionHeaderTextWrap}>
              <Text style={styles.sectionHeaderTitle}>Duplicate Resolution Center</Text>
              <Text style={styles.sectionHeaderSub}>
                Perceptual hash (pHash) and exact match deduplication.
              </Text>
            </View>
          </View>

          {duplicates.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="checkmark-done-circle-outline" size={54} color="#10B981" />
              <Text style={styles.emptyTitle}>No Duplicates Detected</Text>
              <Text style={styles.emptySubtitle}>
                Your library is completely clean. All uploaded photos are distinct.
              </Text>
            </View>
          ) : (
            duplicates.map((group, gIdx) => (
              <View key={gIdx} style={styles.duplicateGroupCard}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupHeaderTitle}>
                    Group #{gIdx + 1} • {group.files?.length || 2} Potential Duplicates
                  </Text>
                  <Text style={styles.similarityText}>
                    Similarity: {group.similarity ? `${Math.round(group.similarity * 100)}%` : 'Exact Match'}
                  </Text>
                </View>

                <View style={styles.dupFilesRow}>
                  {(group.files || []).map((file, fIdx) => (
                    <View key={fIdx} style={styles.dupFileItem}>
                      <Image source={{ uri: file.cloudinaryUrl || file.url }} style={styles.dupImg} />
                      <Text style={styles.dupFileName} numberOfLines={1}>{file.originalName}</Text>
                      <TouchableOpacity
                        style={styles.keepBtn}
                        onPress={() =>
                          handleResolveDuplicate(
                            group._id || group.id || gIdx,
                            file._id || file.id,
                            (group.files || []).filter((f) => f._id !== file._id).map((f) => f._id)
                          )
                        }
                      >
                        <Text style={styles.keepBtnText}>Keep This</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* TAB 4: NATURAL LANGUAGE RULES */}
      {activeSubTab === 'rules' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.sectionHeaderCard}>
            <Ionicons name="terminal" size={20} color="#8B5CF6" />
            <View style={styles.sectionHeaderTextWrap}>
              <Text style={styles.sectionHeaderTitle}>Natural Language Rule Console</Text>
              <Text style={styles.sectionHeaderSub}>
                Type instructions in plain English. The AI parses and validates them deterministically.
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Organization Instruction Prompt</Text>
          <TextInput
            style={styles.rulePromptInput}
            value={rulePrompt}
            onChangeText={setRulePrompt}
            multiline
            numberOfLines={4}
            placeholder="Type your instruction..."
            placeholderTextColor="#64748B"
          />

          <TouchableOpacity
            style={styles.interpretBtn}
            onPress={handleInterpretRule}
            disabled={isInterpreting}
          >
            {isInterpreting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                <Text style={styles.interpretBtnText}>Interpret & Validate AST</Text>
              </View>
            )}
          </TouchableOpacity>

          {interpretedRule && (
            <View style={styles.astPreviewCard}>
              <Text style={styles.astTitle}>Validated Rule Output</Text>
              <Text style={styles.astJson}>
                {JSON.stringify(interpretedRule, null, 2)}
              </Text>

              <TouchableOpacity
                style={styles.executeRuleBtn}
                onPress={handleExecuteRule}
                disabled={organizing}
              >
                {organizing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.executeRuleBtnText}>Execute Rule Atomically</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Rollback & History */}
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Organization History & Rollback</Text>
            {orgHistory.length === 0 ? (
              <Text style={styles.noHistoryText}>No past executions yet.</Text>
            ) : (
              orgHistory.map((h, i) => (
                <View key={i} style={styles.historyItem}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyAction}>{h.action || 'Auto Organization'}</Text>
                    <Text style={styles.historyDate}>{new Date(h.createdAt).toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.undoBtn}
                    onPress={() => handleUndo(h._id || h.id)}
                  >
                    <Ionicons name="arrow-undo" size={14} color="#EF4444" />
                    <Text style={styles.undoBtnText}>Undo</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* TAB 5: JOB PIPELINE */}
      {activeSubTab === 'jobs' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.sectionHeaderCard}>
            <Ionicons name="server" size={20} color="#06B6D4" />
            <View style={styles.sectionHeaderTextWrap}>
              <Text style={styles.sectionHeaderTitle}>Async Job Pipeline</Text>
              <Text style={styles.sectionHeaderSub}>
                Live tracking of background computer vision & neural embedding tasks.
              </Text>
            </View>
          </View>

          {jobs.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="checkmark-circle-outline" size={54} color="#10B981" />
              <Text style={styles.emptyTitle}>All Jobs Completed</Text>
              <Text style={styles.emptySubtitle}>No background tasks are waiting in the queue.</Text>
            </View>
          ) : (
            jobs.map((j, idx) => (
              <View key={idx} style={styles.jobCard}>
                <View style={styles.jobTopRow}>
                  <Text style={styles.jobType}>{j.type || 'AI Face Analysis'}</Text>
                  <View style={[styles.jobStatusPill, j.status === 'completed' && styles.statusCompleted]}>
                    <Text style={styles.jobStatusText}>{j.status}</Text>
                  </View>
                </View>
                <Text style={styles.jobIdText}>ID: {j._id || j.id}</Text>
                {j.status === 'failed' && (
                  <TouchableOpacity style={styles.retryBtn} onPress={() => handleRetryJob(j._id || j.id)}>
                    <Ionicons name="refresh" size={12} color="#C4B5FD" />
                    <Text style={styles.retryBtnText}>Retry Task</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Photo Detail Modal */}
      {activePhoto && (
        <PhotoDetailModal
          visible={!!activePhoto}
          photo={activePhoto}
          onClose={() => setActivePhoto(null)}
        />
      )}

      {/* Feature 1: Selfie Search Modal */}
      <SelfieSearchModal
        visible={showSelfie}
        onClose={() => setShowSelfie(false)}
        onPhotoSelect={(p) => {
          setShowSelfie(false);
          setActivePhoto(p);
        }}
      />

      {/* Feature 6: Photobook Modal */}
      <PhotobookModal
        visible={showPhotobook}
        onClose={() => setShowPhotobook(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  subTabBar: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  subTabScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  subTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subTabItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  subTabTextActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  tabContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  listContent: {
    padding: 12,
    paddingBottom: 120,
  },
  headerArea: {
    marginBottom: 16,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    marginBottom: 14,
  },
  engineBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    gap: 5,
  },
  engineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C084FC',
  },
  engineOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  engineOnlineText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#34D399',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 14,
  },
  heroActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  heroBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  heroBtnSecondaryText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#C084FC',
  },
  kpiContainer: {
    marginBottom: 14,
    gap: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  kpiIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  kpiSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  kpiSubTotal: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  quotaBarBg: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  quotaBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  sectionTitleBlock: {
    marginBottom: 6,
    marginTop: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sectionMainTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  sectionSubTitle: {
    fontSize: 11,
    color: '#64748B',
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  foldersGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  allFolderCardGrid: {
    width: '48.5%',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#1E293B',
  },
  allFolderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  allFolderIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allFolderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  allFolderBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  allFolderGridTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  allFolderGridSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginBottom: 8,
  },
  allFolderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  allFolderCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A78BFA',
  },
  foldersCarousel: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  allFolderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  allFolderCardActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
  },
  allFolderText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  allFolderTextActive: {
    color: '#C4B5FD',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  filterText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A78BFA',
  },
  photoCard: {
    flex: 1,
    margin: 5,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  imageWrap: {
    height: 130,
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  sceneryBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
  },
  faceBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qualityPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  qualityText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#34D399',
  },
  voiceNoteBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  photoMeta: {
    padding: 10,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  photoCaption: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tagChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagChipText: {
    fontSize: 9,
    color: '#A78BFA',
    fontWeight: '600',
  },
  emptyWrap: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  // Search Styles
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#FFFFFF',
    fontSize: 13,
  },
  searchBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Duplicates Styles
  sectionHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  sectionHeaderTextWrap: {
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  duplicateGroupCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  similarityText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },
  dupFilesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dupFileItem: {
    flex: 1,
    alignItems: 'center',
  },
  dupImg: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    marginBottom: 6,
  },
  dupFileName: {
    fontSize: 11,
    color: '#CBD5E1',
    marginBottom: 6,
  },
  keepBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  keepBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  // Rules Styles
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  rulePromptInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 18,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  interpretBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  interpretBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  astPreviewCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 16,
  },
  astTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C4B5FD',
    marginBottom: 8,
  },
  astJson: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  executeRuleBtn: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  executeRuleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  historySection: {
    marginTop: 10,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#CBD5E1',
    marginBottom: 10,
  },
  noHistoryText: {
    fontSize: 12,
    color: '#64748B',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyInfo: {
    flex: 1,
  },
  historyAction: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  historyDate: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  undoBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  // Jobs Styles
  jobCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  jobTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  jobStatusPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  jobStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CBD5E1',
    textTransform: 'uppercase',
  },
  jobIdText: {
    fontSize: 11,
    color: '#64748B',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginTop: 8,
  },
  retryBtnText: {
    fontSize: 11,
    color: '#C4B5FD',
    fontWeight: '600',
  },
});
