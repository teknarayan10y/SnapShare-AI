import crypto from 'crypto';
import fs from 'fs';

class AIService {
  /**
   * Generates SHA-256 hash of a file for cryptographic duplicate detection
   */
  async computeChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }

  /**
   * Smart AI categorization and tag generation
   */
  analyzeFile(originalName, category, extension, dimensions = {}) {
    const lowerName = originalName.toLowerCase();
    const tags = new Set();
    let description = '';

    // Extension-based tag
    tags.add(extension.toUpperCase());
    tags.add(category);

    // Contextual naming rules
    if (lowerName.includes('invoice') || lowerName.includes('receipt') || lowerName.includes('bill')) {
      tags.add('Finance');
      tags.add('Document');
      description = 'Financial document or receipt';
    } else if (lowerName.includes('wedding') || lowerName.includes('bride') || lowerName.includes('groom')) {
      tags.add('Wedding');
      tags.add('Event');
      description = 'Wedding ceremony or celebration media';
    } else if (lowerName.includes('birthday') || lowerName.includes('party')) {
      tags.add('Birthday');
      tags.add('Celebration');
      description = 'Birthday celebration photography';
    } else if (lowerName.includes('screenshot') || lowerName.includes('screen_shot')) {
      tags.add('Screenshot');
      description = 'Screen capture recording or snapshot';
    } else if (lowerName.includes('contract') || lowerName.includes('agreement') || lowerName.includes('legal')) {
      tags.add('Legal');
      tags.add('Agreement');
      description = 'Legal document or executed contract';
    } else if (lowerName.includes('resume') || lowerName.includes('cv')) {
      tags.add('Career');
      tags.add('Resume');
      description = 'Curriculum Vitae or professional resume';
    } else if (category === 'image') {
      if (dimensions.width && dimensions.height) {
        if (dimensions.width >= 3840 || dimensions.height >= 2160) {
          tags.add('4K Ultra HD');
        } else if (dimensions.width >= 1920 || dimensions.height >= 1080) {
          tags.add('High Definition');
        }
        if (dimensions.width === dimensions.height) {
          tags.add('Square 1:1');
        } else if (dimensions.width > dimensions.height) {
          tags.add('Landscape');
        } else {
          tags.add('Portrait');
        }
      }
      description = `${extension.toUpperCase()} image (${dimensions.width || '?'}x${dimensions.height || '?'})`;
    } else if (category === 'video') {
      tags.add('Video Stream');
      description = `High-definition ${extension.toUpperCase()} motion video`;
    } else if (category === 'audio') {
      tags.add('Audio Track');
      description = `High fidelity ${extension.toUpperCase()} audio recording`;
    } else if (category === 'code') {
      tags.add('Developer Asset');
      tags.add('Source Code');
      description = `Source file formatted for ${extension.toUpperCase()}`;
    } else if (category === 'archive') {
      tags.add('Compressed Archive');
      description = `Compressed container package`;
    } else {
      description = `Uploaded ${extension.toUpperCase()} file`;
    }

    return {
      aiCategory: category,
      aiTags: Array.from(tags),
      aiDescription: description,
    };
  }
}

export const aiService = new AIService();
