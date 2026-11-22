import mongoose from 'mongoose';
import { File } from '../models/File.js';
import { Collection } from '../models/Collection.js';
import { SmartFolder } from '../models/SmartFolder.js';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { generateAICaption, generateDynamicSpreadCaption } from './captionService.js';

class PhotobookService {
  /**
   * Generates an algorithmically curated 2-page spread digital photobook layout
   */
  async generatePhotobookLayout({ collectionId, userId }) {
    const filter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.ownerId = userId;
    }

    let collection = null;
    if (collectionId) {
      if (!mongoose.Types.ObjectId.isValid(collectionId)) {
        return {
          title: 'SnapShare Event Photobook',
          description: 'Curated Memories',
          totalPages: 0,
          pages: [],
        };
      }
      filter.collectionId = collectionId;
      collection = await Collection.findById(collectionId).catch(() => null);
    }

    const files = await File.find(filter)
      .populate('aiAnalysisId')
      .sort({ createdAt: 1 })
      .lean();

    if (!files || files.length === 0) {
      return {
        title: collection?.name || 'SnapShare Event Photobook',
        description: collection?.description || 'Curated Memories',
        totalPages: 0,
        pages: [],
      };
    }

    // Partition photos by verified composition / category
    const soloPhotos = files.filter(
      (f) => f.personCount === 1 || f.photoComposition === 'single_person'
    );
    const pairPhotos = files.filter(
      (f) => f.personCount === 2 || f.photoComposition === 'pair'
    );
    const smallGroupPhotos = files.filter(
      (f) => [3, 4].includes(f.personCount) || ['three_person', 'four_person'].includes(f.photoComposition)
    );
    const bigGroupPhotos = files.filter(
      (f) => (f.personCount || 0) > 4 || f.photoComposition === 'group'
    );
    const sceneryPhotos = files.filter(
      (f) => (f.personCount === 0 || f.photoComposition === 'non_human')
    );

    // Pick hero cover photo (prefer highest quality group or landscape)
    const coverCandidates = [...bigGroupPhotos, ...smallGroupPhotos, ...files];
    const coverFile = coverCandidates[0] || files[0];

    const pages = [];
    const coverUrl = coverFile.cloudinaryUrl || coverFile.thumbnailKey || '';
    const usedCaptions = new Set();
    const captionFor = (f, role, idx = 0) =>
      generateAICaption(f, { usedCaptions, spreadRole: role, index: idx });

    // ----------------------------------------------------------------
    // Pre-resolve all AI captions in parallel (with timeout fallback)
    // ----------------------------------------------------------------
    // Collect all files that need captions: [file, role, index]
    const captionJobs = [];
    captionJobs.push([coverFile, 'cover', 1]);
    if (files.length >= 2) {
      captionJobs.push([files[1], 'opening', 2]);
      captionJobs.push([files[2] || files[0], 'opening', 3]);
    }
    if (soloPhotos[0]) captionJobs.push([soloPhotos[0], 'portrait', 4]);
    if (soloPhotos[1]) captionJobs.push([soloPhotos[1], 'portrait', 5]);
    if (pairPhotos[0]) captionJobs.push([pairPhotos[0], 'pair', 6]);
    if (pairPhotos[1]) captionJobs.push([pairPhotos[1], 'pair', 7]);
    const g1 = bigGroupPhotos[0] || smallGroupPhotos[0];
    if (g1) captionJobs.push([g1, 'group', 8]);
    const mosaicPool = files.length >= 4 ? [...sceneryPhotos, ...files].slice(0, 4) : [];
    mosaicPool.forEach((m, idx) => captionJobs.push([m, 'mosaic', idx + 9]));

    const captionResults = [];
    for (const [f, role, idx] of captionJobs) {
      const c = await captionFor(f, role, idx);
      captionResults.push(c);
      // Small pause if calling Gemini to stay safely within free-tier burst limits
      if (process.env.GEMINI_API_KEY && (!f.aiCaption || f.aiCaption.length < 25)) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    // Helper to retrieve pre-resolved caption by [file, role, index] key
    let cIdx = 0;
    const captionMap = new Map();
    captionJobs.forEach(([f, role, idx]) => {
      captionMap.set(`${String(f._id)}-${role}-${idx}`, captionResults[cIdx++]);
    });
    const getCaption = (f, role, idx) => captionMap.get(`${String(f._id)}-${role}-${idx}`) || '';

    // PAGE 1: Front Cover
    pages.push({
      pageNumber: 1,
      type: 'cover',
      layoutType: 'cover',
      spreadTitle: 'Cover',
      title: collection?.name || 'Event Highlights',
      subtitle: collection?.description || 'Curated Photobook by SnapShare AI',
      date: collection?.createdAt ? new Date(collection.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '2026',
      heroImage: coverUrl,
      photos: [
        {
          id: coverFile._id,
          url: coverUrl,
          caption: getCaption(coverFile, 'cover', 1),
          accentColor: coverFile.aiAnalysisId?.dominantColors?.[0] || '#8B5CF6',
        },
      ],
      accentColor: coverFile.aiAnalysisId?.dominantColors?.[0] || '#8B5CF6',
    });

    // PAGE 2: Introduction Spread (Highlights)
    if (files.length >= 2) {
      const p2Img1 = files[1];
      const p2Img2 = files[2] || files[0];
      const p2Photos = [
        {
          id: p2Img1._id,
          url: p2Img1.cloudinaryUrl || p2Img1.thumbnailKey,
          caption: getCaption(p2Img1, 'opening', 2),
          accentColor: p2Img1.aiAnalysisId?.dominantColors?.[0] || '#6366F1',
        },
        {
          id: p2Img2._id,
          url: p2Img2.cloudinaryUrl || p2Img2.thumbnailKey,
          caption: getCaption(p2Img2, 'opening', 3),
          accentColor: p2Img2.aiAnalysisId?.dominantColors?.[0] || '#A78BFA',
        },
      ];
      pages.push({
        pageNumber: 2,
        type: 'duo_spread',
        layoutType: 'duo_spread',
        spreadTitle: 'Opening Moments',
        title: 'Opening Moments',
        caption: generateDynamicSpreadCaption(p2Photos, 'duo_spread'),
        photos: p2Photos,
      });
    }

    // PAGE 3: Solo Portraits Spread
    if (soloPhotos.length > 0) {
      const s1 = soloPhotos[0];
      const s2 = soloPhotos[1];
      const pType = s2 ? 'duo_spread' : 'hero_portrait';
      const p3Photos = [s1, s2].filter(Boolean).map((s, idx) => ({
        id: s._id,
        url: s.cloudinaryUrl || s.thumbnailKey,
        caption: getCaption(s, 'portrait', idx + 4),
        accentColor: s.aiAnalysisId?.dominantColors?.[0] || '#EC4899',
        tags: s.aiTags || [],
      }));
      pages.push({
        pageNumber: pages.length + 1,
        type: pType,
        layoutType: pType,
        spreadTitle: 'Portraits & Individuals',
        title: 'Portraits & Individuals',
        caption: generateDynamicSpreadCaption(p3Photos, pType),
        photos: p3Photos,
      });
    }

    // PAGE 4: Pairs & Friends Spread
    if (pairPhotos.length > 0) {
      const p1 = pairPhotos[0];
      const p2 = pairPhotos[1];
      const p4Photos = [p1, p2].filter(Boolean).map((p, idx) => ({
        id: p._id,
        url: p.cloudinaryUrl || p.thumbnailKey,
        caption: getCaption(p, 'pair', idx + 6),
        accentColor: p.aiAnalysisId?.dominantColors?.[0] || '#06B6D4',
      }));
      pages.push({
        pageNumber: pages.length + 1,
        type: 'duo_spread',
        layoutType: 'duo_spread',
        spreadTitle: 'Together in Pairs',
        title: 'Together in Pairs',
        caption: generateDynamicSpreadCaption(p4Photos, 'duo_spread'),
        photos: p4Photos,
      });
    }

    // PAGE 5: Group & Crowd Spread
    if (g1) {
      const p5Photos = [
        {
          id: g1._id,
          url: g1.cloudinaryUrl || g1.thumbnailKey,
          caption: getCaption(g1, 'group', 8),
          accentColor: g1.aiAnalysisId?.dominantColors?.[0] || '#10B981',
        },
      ];
      pages.push({
        pageNumber: pages.length + 1,
        type: 'group_spread',
        layoutType: 'group_spread',
        spreadTitle: 'Celebration & Groups',
        title: 'Celebration & Groups',
        caption: generateDynamicSpreadCaption(p5Photos, 'group_spread'),
        photos: p5Photos,
      });
    }

    // PAGE 6: Candid Mosaic Spread (4 photos in 2x2 grid)
    if (files.length >= 4) {
      const p6Photos = mosaicPool.map((m, idx) => ({
        id: m._id,
        url: m.cloudinaryUrl || m.thumbnailKey,
        caption: getCaption(m, 'mosaic', idx + 9),
        accentColor: m.aiAnalysisId?.dominantColors?.[0] || '#F59E0B',
      }));
      pages.push({
        pageNumber: pages.length + 1,
        type: 'mosaic_spread',
        layoutType: 'mosaic_spread',
        spreadTitle: 'Atmosphere & Details',
        title: 'Atmosphere & Details',
        caption: generateDynamicSpreadCaption(p6Photos, 'mosaic_spread'),
        photos: p6Photos,
      });
    }

    // FINAL PAGE: Back Cover
    pages.push({
      pageNumber: pages.length + 1,
      type: 'back_cover',
      layoutType: 'back_cover',
      spreadTitle: 'Memory Keepsake',
      title: 'SnapShare Memory Keepsake',
      subtitle: 'Generated with SnapShare AI 2.0 • Preserving Every Moment',
      collectionQrUrl: collectionId ? `https://snapshare.ai/events/${collectionId}` : '',
      accentColor: '#8B5CF6',
    });

    return {
      title: collection?.name || 'SnapShare Event Photobook',
      description: collection?.description || 'Curated Photobook by SnapShare AI',
      coverImage: coverFile.cloudinaryUrl || coverFile.thumbnailKey,
      totalPhotos: files.length,
      totalPages: pages.length,
      pages,
    };
  }
}

export const photobookService = new PhotobookService();
