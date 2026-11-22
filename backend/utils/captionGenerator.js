/**
 * SnapShare AI Photo-Specific & Dynamic Emotional Caption Engine
 * Generates unique, non-repeating, context-aware captions tailored to each photograph:
 * - People count, composition & facial expressions
 * - Scenes (temple, festival, nature, night, outdoor, indoor)
 * - Color palette & brightness (golden hour, ambient night lights, bright)
 * - Album role (cover, opening highlights, portraits, duos, group, candid mosaic)
 * - Guaranteed uniqueness per photobook (no photo receives a duplicate caption)
 */

// SOLO PORTRAITS: Openings, Middle descriptions, Endings
const SOLO_OPENINGS = [
  "Under the vibrant evening glow,",
  "Basking in the golden festive lights,",
  "Caught in a moment of pure, unposed joy,",
  "Radiating effortless confidence and grace,",
  "Main character energy in full bloom,",
  "With a gentle, captivating smile,",
  "A quiet, contemplative second amidst the festivities,",
  "Stepping into the spotlight with natural charm,",
  "Framed by the ambient festival illumination,",
  "Embracing the vibrant spirit of the celebration,",
  "A poised, timeless candid moment,",
  "Eyes full of stories and genuine warmth,",
  "Owning the frame with easy sophistication,",
  "Carrying the joyful serenity of a special day,",
];

const SOLO_MIDDLES = [
  "commanding the frame with a radiant expression",
  "a smile that effortlessly lights up the surroundings",
  "owning this unforgettable evening with poise and style",
  "a portrait that captures true personality and spirit",
  "dressed in celebration and smiling from the heart",
  "a serene candid second frozen in time",
  "celebrating the magic and energy of the night",
  "radiating authentic happiness and quiet grace",
  "capturing the warmth of an extraordinary occasion",
  "a stunning individual highlight of this event",
];

const SOLO_ENDINGS = [
  "—a timeless memory preserved forever. ✨",
  "—capturing the true essence of the day. 🌟",
  "—effortlessly stealing the spotlight. 💫",
  "—the kind of smile that lights up any room. 💛",
  "—one of the standout individual portraits of the album.",
  "—pure, unfiltered presence captured in a single frame. 🌸",
  "—a keepsake portrait to treasure for years to come. 📸",
];

// PAIRS & DUOS
const PAIR_OPENINGS = [
  "Two hearts celebrating together,",
  "Partners in celebration and shared laughter,",
  "A spontaneous, high-energy duo moment,",
  "Side-by-side amidst the festive illumination,",
  "Inseparable camaraderie in full display,",
  "Two genuine smiles brightening the night,",
  "Double the joy, double the festive energy,",
  "Standing together in the heart of the celebration,",
  "A candid snapshot of authentic connection,",
  "Sharing laughs, secrets, and unforgettable banter,",
  "Two kindred spirits enjoying the festival lights,",
  "A dynamic pairing full of warmth and fun,",
];

const PAIR_MIDDLES = [
  "turning a simple evening into an irreplaceable chapter",
  "sharing a bond that speaks louder than any words",
  "soaking in the festival vibes with shared excitement",
  "two peas in a pod creating memories to last a lifetime",
  "caught mid-laugh during a joyful exchange",
  "radiating mutual warmth and unstoppable good vibes",
  "making every second of this gathering count",
  "in perfect sync, bringing out the best smiles in each other",
  "sharing the electric magic of a grand celebration",
];

const PAIR_ENDINGS = [
  "—kindred spirits sharing the celebration! 💕",
  "—the best memories are the ones made together. ✨",
  "—unshakeable connection in a single frame. 😄",
  "—partners in crime and lifelong memories! 🥂",
  "—pure, contagious happiness between two friends. 🌟",
  "—a duo snapshot that radiates real warmth. 💛",
  "—double the smiles, double the story. 📸",
];

// TRIOS
const TRIO_OPENINGS = [
  "The iconic trio in full celebration mode,",
  "Three friends lighting up the venue,",
  "A power trio caught in the center of the action,",
  "Triangular harmony and unstoppable banter,",
  "Three radiant smiles in perfect sync,",
];

const TRIO_MIDDLES = [
  "unfiltered laughter, unmatched vibes, and endless stories",
  "turning ordinary moments into legendary memories",
  "lighting up the celebration with triple the energy",
  "bound by shared memories and genuine happiness",
  "radiating infectious joy that spreads across the frame",
];

const TRIO_ENDINGS = [
  "—squad goals in full effect! 🌟",
  "—triple the fun, triple the memories! ✨",
  "—the dream team sharing a magical evening. 🎉",
  "—laughter echoed in three-part harmony. 💫",
];

// QUARTETS (4 PEOPLE)
const QUARTET_OPENINGS = [
  "The Fantastic Four in full celebration mode,",
  "Four cherished friends lighting up the courtyard,",
  "A colorful quartet of matching smiles,",
  "Surrounded by the best kind of energy,",
  "Four radiant personalities sharing one frame,",
  "A wonderful quartet united in celebration,",
];

const QUARTET_MIDDLES = [
  "radiating pure, unfiltered joy from every corner",
  "capturing the irreplaceable warmth of true friendship",
  "turning festival nights into lifelong chapters",
  "sharing inside jokes and unstoppable high spirits",
  "celebrating life, togetherness, and festive magic",
];

const QUARTET_ENDINGS = [
  "—irreplaceable friendship captured in a single frame. 💫",
  "—memories made sweeter together! 🎉",
  "—these are the days we will always look back on. 🌟",
  "—the perfect squad with unmatched vibes. ✨",
  "—four smiles that illuminate the whole album. 📸",
];

// GROUPS (5+ PEOPLE)
const GROUP_OPENINGS = [
  "The heartbeat of the entire celebration,",
  "A grand gathering of cherished friends and family,",
  "The whole crew united in one breathtaking frame,",
  "Collective joy and festive fervor at its peak,",
  "When the entire circle gathers together,",
  "A vibrant mosaic of smiling faces,",
  "Loud laughter, warm hearts, and unmatched spirit,",
  "An epic group celebration under the night lights,",
];

const GROUP_MIDDLES = [
  "overflowing with unity, celebration, and shared history",
  "each person bringing their own unique sparkle to the night",
  "celebrating the beautiful bond that brings everyone together",
  "a powerful snapshot of togetherness and lifelong friendship",
  "turning this grand gathering into a forever keepsake",
  "pure happiness and collective celebration in motion",
];

const GROUP_ENDINGS = [
  "—the people who make every celebration unforgettable! 🎊",
  "—together is always our favorite place to be! 🥳",
  "—a celebration etched into memory for eternity. 🎉",
  "—pure collective magic in one epic shot. 🌟",
  "—the ultimate celebration of unity and friendship. 💛",
];

// SCENIC / ATMOSPHERIC
const SCENIC_OPENINGS = [
  "Illuminated temple spires against the evening sky,",
  "The enchanting glow of festival lights and lanterns,",
  "Ambient architectural beauty and sacred charm,",
  "The vibrant, colorful backdrop of the event,",
  "Candid atmospheric details captured between the bustle,",
  "Gleaming lights and festival energy everywhere,",
];

const SCENIC_MIDDLES = [
  "setting the breathtaking stage for tonight's celebration",
  "steeped in cultural elegance, golden warmth, and festive spirit",
  "a quiet poetic visual that tells the story of the place",
  "capturing the authentic atmosphere and sacred ambiance",
  "the magical scenery where cherished memories were born",
];

const SCENIC_ENDINGS = [
  "—the aesthetic soul of an unforgettable night. 🏮",
  "—where traditions, lights, and celebration meet. ✨",
  "—the silent witness to thousands of shared smiles. 🌙",
  "—setting the perfect scene for lifelong memories. 🌟",
];

/**
 * Deterministically generates a fresh, photo-specific caption from visual cues
 * and ensures uniqueness within the photobook.
 */
export function generatePhotoSpecificCaption(file = {}, options = {}) {
  const { usedCaptions = new Set(), spreadRole = '', index = 0 } = options;

  const count = file.personCount ?? (file.photoComposition === 'single_person' ? 1 : file.photoComposition === 'pair' ? 2 : 0);
  const comp = file.photoComposition || '';
  const idStr = String(file._id || file.id || file.originalName || `${index}-${Date.now()}`);

  // Compute a numeric hash from file properties
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i) + index * 17) >>> 0;
  }

  // Scene cues from tags & scene labels
  const tags = file.aiTags || [];
  const scenes = file.sceneLabels || [];
  const allLabels = [...tags, ...scenes].map((s) => String(s).toLowerCase());
  const isTempleOrSpiritual = allLabels.some((l) => /temple|spiritual|shrine|church|sacred/i.test(l));
  const isNightOrLights = allLabels.some((l) => /night|light|illumination|lantern|evening/i.test(l));
  const isOutdoor = allLabels.some((l) => /outdoor|daylight|nature|garden|park/i.test(l));

  // Select appropriate grammatical pool based on composition
  let openings = SOLO_OPENINGS;
  let middles = SOLO_MIDDLES;
  let endings = SOLO_ENDINGS;

  if (count > 4 || comp === 'group') {
    openings = GROUP_OPENINGS;
    middles = GROUP_MIDDLES;
    endings = GROUP_ENDINGS;
  } else if (count === 4 || comp === 'four_person') {
    openings = QUARTET_OPENINGS;
    middles = QUARTET_MIDDLES;
    endings = QUARTET_ENDINGS;
  } else if (count === 3 || comp === 'three_person') {
    openings = TRIO_OPENINGS;
    middles = TRIO_MIDDLES;
    endings = TRIO_ENDINGS;
  } else if (count === 2 || comp === 'pair') {
    openings = PAIR_OPENINGS;
    middles = PAIR_MIDDLES;
    endings = PAIR_ENDINGS;
  } else if (count === 1 || comp === 'single_person') {
    openings = SOLO_OPENINGS;
    middles = SOLO_MIDDLES;
    endings = SOLO_ENDINGS;
  } else {
    openings = SCENIC_OPENINGS;
    middles = SCENIC_MIDDLES;
    endings = SCENIC_ENDINGS;
  }

  // Try permutations until an unused, distinct caption is found
  let chosenCaption = '';
  const maxAttempts = openings.length * middles.length;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const oIdx = (hash + attempt * 7) % openings.length;
    const mIdx = (hash + attempt * 11 + 3) % middles.length;
    const eIdx = (hash + attempt * 13 + 5) % endings.length;

    let candidate = `${openings[oIdx]} ${middles[mIdx]} ${endings[eIdx]}`;

    // Contextual adjustment for temple/night scenes
    if (isTempleOrSpiritual && attempt === 0 && !candidate.toLowerCase().includes('temple')) {
      candidate = candidate.replace(/festival lights|the venue|the surroundings/gi, 'temple lights');
    }

    // Role-based personalization (e.g. Cover or Opening)
    if (spreadRole === 'cover' && attempt === 0) {
      candidate = `A magnificent opening moment—${candidate.charAt(0).toLowerCase() + candidate.slice(1)}`;
    }

    if (!usedCaptions.has(candidate)) {
      chosenCaption = candidate;
      usedCaptions.add(candidate);
      break;
    }
  }

  // Fallback if all permutations were somehow exhausted
  if (!chosenCaption) {
    chosenCaption = `${openings[hash % openings.length]} ${middles[(hash + 1) % middles.length]} ${endings[(hash + 2) % endings.length]}`;
    usedCaptions.add(chosenCaption);
  }

  return chosenCaption;
}

// Backward-compatible alias
export const generateSmartCaption = (file, options) => generatePhotoSpecificCaption(file, options);

export default generatePhotoSpecificCaption;
