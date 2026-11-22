import { File } from '../models/File.js';
import { aiClient } from './aiMicroserviceClient.js';

class SemanticSearchService {
  /**
   * Universal Natural Language AI Search
   */
  async search(query, userId, filters = {}) {
    if (!query || query.trim() === '') {
      return { results: [], total: 0 };
    }

    const { category, minQuality = 0, limit = 30 } = filters;
    const cleanQuery = query.toLowerCase().trim();

    // 1. Generate query embedding from AI microservice
    const queryVector = await aiClient.getEmbeddings(cleanQuery);

    // 2. Build MongoDB query
    const mongoQuery = { ownerId: userId };
    if (category && category !== 'all') {
      mongoQuery['metadata.aiCategory'] = category;
    }
    if (minQuality > 0) {
      mongoQuery.qualityScore = { $gte: Number(minQuality) };
    }

    const files = await File.find(mongoQuery)
      .populate('smartFolderIds', 'name category color icon')
      .limit(100)
      .lean();

    // 3. Compute hybrid relevance score: Vector Cosine Similarity + Keyword Matching
    const queryTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 2);

    const scoredFiles = files.map((file) => {
      let score = 0;

      // Text / Tag keyword matching
      const targetText = [
        file.originalName,
        file.aiCaption,
        ...(file.aiTags || []),
        ...(file.detectedObjects || []),
        ...(file.sceneLabels || []),
        file.metadata?.aiCategory,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      for (const token of queryTokens) {
        if (targetText.includes(token)) {
          score += 0.25;
        }
      }

      // Cosine vector similarity if embedding exists
      if (file.embedding && file.embedding.length === queryVector.length) {
        const dotProduct = file.embedding.reduce((sum, val, i) => sum + val * queryVector[i], 0);
        score += Math.max(0, dotProduct) * 0.75;
      }

      return {
        ...file,
        relevanceScore: Math.round(score * 100),
      };
    });

    // Sort by relevance score descending
    scoredFiles.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topResults = scoredFiles.slice(0, Number(limit));

    return {
      success: true,
      query,
      total: topResults.length,
      results: topResults,
    };
  }

  /**
   * Search suggestions generator based on user's analyzed tags and categories
   */
  async getSuggestions(userId) {
    const sampleFiles = await File.find({ ownerId: userId, aiStatus: 'analyzed' })
      .select('aiTags detectedObjects sceneLabels')
      .limit(20);

    const suggestions = new Set([
      'Find all images of cars',
      'Show nature and landscape photos',
      'Find documents with financial data',
      'Screenshots containing code',
      'High-quality photos only',
    ]);

    for (const f of sampleFiles) {
      if (f.detectedObjects?.length) {
        suggestions.add(`Find photos containing ${f.detectedObjects[0]}`);
      }
      if (f.aiTags?.length) {
        suggestions.add(`Show files tagged with ${f.aiTags[0]}`);
      }
    }

    return Array.from(suggestions).slice(0, 8);
  }
}

export const semanticSearch = new SemanticSearchService();
