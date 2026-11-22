/**
 * SnapShare AI Multimodal Caption Engine
 * Powered by Google Gemini 3.8 Flash Vision API
 *
 * Analyzes the actual photograph: people, facial expressions, attire,
 * emotion, setting, lighting, and album narrative role.
 *
 * Produces touching, joyful, heartfelt, and unique captions for every photo and spread.
 * Includes automatic collision avoidance, database persistence, and smart local fallback.
 */

import { generatePhotoSpecificCaption } from '../utils/captionGenerator.js';
import { File } from '../models/File.js';

const GEMINI_MODELS = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash'];
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const FETCH_TIMEOUT_MS = 25000;

/**
 * Optimizes an image URL for vision LLM transmission.
 * Cloudinary URLs get a fast w_600,q_70,f_jpg transformation for ultra-fast download.
 */
function getOptimizedImageUrl(url) {
  if (!url) return '';
  if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
    // Insert w_600,q_70,f_jpg transformation for sub-100ms fetch
    return url.replace('/image/upload/', '/image/upload/w_600,q_70,f_jpg/');
  }
  return url;
}

/**
 * Downloads image buffer and converts to base64 for Gemini inlineData
 */
async function fetchImageAsBase64(url, timeoutMs = 12000) {
  if (!url || !url.startsWith('http')) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;

    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const mime = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
    return {
      base64Data: buffer.toString('base64'),
      mimeType: mime,
    };
  } catch (err) {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Constructs a role-aware prompt for Gemini Vision
 */
function buildVisionPrompt(spreadRole, personCount, composition) {
  let roleContext = '';
  switch (spreadRole) {
    case 'cover':
      roleContext = 'This is the main COVER photo of a curated memory photobook. Write an evocative, inspiring headline-level caption that celebrates this grand highlight.';
      break;
    case 'opening':
      roleContext = 'This photo appears in the OPENING MOMENTS spread of the photobook. Capture the excitement, welcoming warmth, and anticipation of the gathering.';
      break;
    case 'portrait':
      roleContext = 'This is a SOLO PORTRAIT in the photobook. Focus on their genuine smile, personality, outfit, and radiant individual presence.';
      break;
    case 'pair':
      roleContext = 'This is a DUO/FRIENDS spread. Capture the authentic bond, shared laughter, and warmth between these two kindred spirits.';
      break;
    case 'group':
      roleContext = 'This is a GROUP CELEBRATION spread. Capture the unity, high spirits, loud laughter, and shared joy of the whole crew together.';
      break;
    case 'mosaic':
      roleContext = 'This photo is part of a CANDID ATMOSPHERE spread. Highlight the colorful atmosphere, cultural elegance, festival lights, or spontaneous joy.';
      break;
    default:
      roleContext = 'This photo is a featured memory in an event photobook.';
  }

  return `You are an empathetic, poetic storyteller writing for a luxury photobook.
${roleContext}
Analyze the visual details of this photo: the people, their genuine expressions and smiles, their attire/colors, body language, the surroundings, and lighting.
Write ONE natural, emotional, vibrant caption (1 to 2 sentences, 14–26 words).
Tone guidelines:
- Be warm, personal, emotional, or fun—as if written by someone who deeply treasures this memory.
- Highlight real visible details (e.g. glowing temple lights, traditional attire, proud smiles, candid laughter, playful gestures).
- Strictly avoid robotic phrasing like "A photo of", "This image shows", "captured here", or "featuring people".
- Return ONLY the caption text. No quotation marks, no hashtags.`;
}

/**
 * Call Gemini Vision API with image bytes, with multi-model fallback on quota/rate limits
 */
async function callGeminiVision(apiKey, base64Data, mimeType, prompt) {
  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64Data } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.85,
            topP: 0.95,
            maxOutputTokens: 120,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.status === 429 || res.status === 404) {
        // Quota limit hit or model unavailable, try next model
        console.warn(`[Gemini Vision] Model ${model} returned ${res.status}, trying next model...`);
        continue;
      }

      if (!res.ok) {
        const errBody = await res.text();
        console.warn(`[Gemini Vision] API error ${res.status} on ${model}:`, errBody.slice(0, 150));
        continue;
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanText = rawText.replace(/^["'\s]+|["'\s]+$/g, '').trim();
      if (cleanText) return cleanText;
    } catch (err) {
      clearTimeout(timer);
      console.warn(`[Gemini Vision] Call to ${model} failed:`, err.message);
    }
  }

  return null;
}

/**
 * Generate an AI-powered caption for a single photograph.
 *
 * @param {Object} file - File document
 * @param {Object} opts - { usedCaptions: Set, spreadRole: string, index: number }
 * @returns {Promise<string>}
 */
export async function generateAICaption(file = {}, opts = {}) {
  const { usedCaptions = new Set(), spreadRole = 'mosaic', index = 0 } = opts;
  const apiKey = process.env.GEMINI_API_KEY;

  // If file already has a high-quality human/AI caption that isn't a generic old template,
  // and hasn't been used on another page in this photobook, reuse it!
  const existing = (file.aiCaption || '').trim();
  const isGenericOldTemplate = !existing || 
    existing.startsWith('A bright ') || 
    existing.startsWith('A moody ') || 
    existing.includes('featuring one person') || 
    existing.includes('featuring two people') ||
    existing.includes('visual capture featuring');

  if (!isGenericOldTemplate && existing.length >= 25 && !usedCaptions.has(existing)) {
    usedCaptions.add(existing);
    return existing;
  }

  const rawUrl = file.cloudinaryUrl || file.thumbnailKey || '';
  const optUrl = getOptimizedImageUrl(rawUrl);
  const personCount = file.personCount ?? 0;
  const composition = file.photoComposition || 'non_human';

  let generatedCaption = '';

  // 1. Try real Multimodal Gemini Vision if API key is present
  if (apiKey && optUrl && optUrl.startsWith('http')) {
    try {
      const imgData = await fetchImageAsBase64(optUrl);
      if (imgData) {
        const prompt = buildVisionPrompt(spreadRole, personCount, composition);
        const aiText = await callGeminiVision(apiKey, imgData.base64Data, imgData.mimeType, prompt);

        if (aiText && aiText.length >= 15) {
          generatedCaption = aiText;

          // Collision prevention across the photobook
          if (usedCaptions.has(generatedCaption)) {
            generatedCaption = `${generatedCaption} ✨`;
          }
          usedCaptions.add(generatedCaption);

          // Persist to File record for future recall so new user / repeat visits are instant
          if (file._id) {
            File.updateOne({ _id: file._id }, { aiCaption: generatedCaption }).catch(() => null);
          }

          return generatedCaption;
        }
      }
    } catch (e) {
      console.warn('[CaptionService] Gemini vision flow failed, using fallback:', e.message);
    }
  }

  // 2. Fallback to combinatorial grammar engine
  generatedCaption = generatePhotoSpecificCaption(file, { usedCaptions, spreadRole, index });
  usedCaptions.add(generatedCaption);
  return generatedCaption;
}

/**
 * Dynamically synthesizes an emotional spread footer caption for an entire page
 * based on the actual photos present on that page.
 *
 * @param {Array} pagePhotos - Array of photo objects on that page
 * @param {string} spreadType - e.g. 'cover', 'duo_spread', 'group_spread', 'mosaic_spread'
 * @returns {string} Natural summary caption for the spread footer
 */
export function generateDynamicSpreadCaption(pagePhotos = [], spreadType = '') {
  if (!pagePhotos || pagePhotos.length === 0) {
    return 'Cherished moments frozen in time.';
  }

  const captions = pagePhotos.map((p) => p.caption).filter(Boolean);
  const hasTemple = captions.some((c) => /temple|sacred|blessed|lights|divine|shrine/i.test(c));
  const hasJoy = captions.some((c) => /laugh|smile|joy|fun|glow|radiant|happy/i.test(c));
  const hasFriends = captions.some((c) => /friend|together|bond|crew|unite|camaraderie/i.test(c));

  switch (spreadType) {
    case 'cover':
      return hasTemple
        ? 'A grand festival journey of devotion, smiles, and timeless celebration.'
        : 'The unforgettable story of our celebration, preserved in vivid light.';

    case 'duo_spread':
      return hasFriends
        ? 'Shared smiles, unstoppable laughter, and memories made even sweeter side-by-side.'
        : 'Two hearts sharing the joy and warmth of an extraordinary occasion.';

    case 'hero_portrait':
      return 'Radiant individual highlights captured in their truest, most authentic light.';

    case 'group_spread':
      return 'When everyone gathers together, every laugh echoes louder and every moment turns into history.';

    case 'mosaic_spread':
      if (hasTemple) {
        return 'Under the glowing festival canopy—reverence, laughter, and candid magic in every corner.';
      }
      return hasJoy
        ? 'Unfiltered energy, spontaneous laughter, and the vibrant heartbeat of the celebration.'
        : 'Candid glimpses of a memorable day that will warm our hearts for years to come.';

    default:
      return 'Irreplaceable memories woven together by love and celebration.';
  }
}

export default generateAICaption;
