import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CATEGORY_THEMES = {
  'Group Photos': { color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)', border: '#4F46E5', icon: 'people' },
  'Four Member Groups': { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: '#D97706', icon: 'grid' },
  'Three People': { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: '#059669', icon: 'people-outline' },
  'Two People': { color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)', border: '#0891B2', icon: 'person-add' },
  'Individual Photos': { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', border: '#DB2777', icon: 'person' },
  'People': { color: '#E11D48', bg: 'rgba(225, 29, 72, 0.12)', border: '#BE123C', icon: 'folder-outline' },
  'Needs Review': { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: '#DC2626', icon: 'alert-circle' },
  default: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', border: '#7C3AED', icon: 'folder' },
};

export const FolderCard = ({ folder, isSelected, onPress, isGrid = false }) => {
  const theme = CATEGORY_THEMES[folder.category] || CATEGORY_THEMES[folder.name] || CATEGORY_THEMES.default;
  const count = folder.fileIds?.length ?? folder.fileCount ?? folder.totalFiles ?? 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isGrid && styles.cardGrid,
        { backgroundColor: theme.bg, borderColor: isSelected ? theme.color : 'rgba(255,255,255,0.08)' },
        isSelected && styles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: theme.color }]}>
          <Ionicons name={theme.icon} size={16} color="#FFFFFF" />
        </View>
        <View style={[styles.aiPill, { borderColor: theme.color }]}>
          <Text style={[styles.aiPillText, { color: theme.color }]}>✨ AI</Text>
        </View>
      </View>

      <Text style={styles.folderName} numberOfLines={1}>{folder.name}</Text>
      <Text style={styles.folderCategory} numberOfLines={1}>{folder.category || folder.name || 'Virtual Folder'}</Text>

      <View style={styles.bottomRow}>
        <Text style={[styles.countText, { color: theme.color }]}>{count} file{count === 1 ? '' : 's'}</Text>
        <Ionicons name="chevron-forward" size={14} color="#64748B" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    borderWidth: 1.5,
    backgroundColor: '#131B2E',
  },
  cardGrid: {
    width: '48.5%',
    marginRight: 0,
    marginBottom: 10,
  },
  cardSelected: {
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 0.8,
  },
  aiPillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  folderName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  folderCategory: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
