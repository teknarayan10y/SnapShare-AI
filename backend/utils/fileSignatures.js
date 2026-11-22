import fs from 'fs';

// Known magic byte signatures
const SIGNATURES = {
  // Images
  jpg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46], // then WEBP at offset 8
  bmp: [0x42, 0x4D],
  tiff: [0x49, 0x49, 0x2A, 0x00],
  tiff_be: [0x4D, 0x4D, 0x00, 0x2A],
  // Documents / Archives
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  zip: [0x50, 0x4B, 0x03, 0x04], // PK.. (also docx, xlsx, pptx)
  zip_empty: [0x50, 0x4B, 0x05, 0x06],
  rar: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07],
  sevenz: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C],
  tar_gz: [0x1F, 0x8B],
  // Media
  mp3_id3: [0x49, 0x44, 0x33],
  wav: [0x52, 0x49, 0x46, 0x46], // with WAVE at offset 8
  ogg: [0x4F, 0x67, 0x67, 0x53],
  flac: [0x66, 0x4C, 0x61, 0x43],
  mp4: [0x00, 0x00, 0x00], // ftyp box at offset 4
};

// Dangerous executable signatures to block unconditionally
const BLOCKED_EXECUTABLES = [
  [0x4D, 0x5A], // Windows EXE, DLL (MZ)
  [0x7F, 0x45, 0x4C, 0x46], // Linux ELF
  [0xCF, 0xFA, 0xED, 0xFE], // macOS Mach-O 64
  [0xCE, 0xFA, 0xED, 0xFE], // macOS Mach-O 32
  [0xCA, 0xFE, 0xBA, 0xBE], // Java Class / Mach-O Fat
  [0x21, 0x3C, 0x61, 0x72, 0x63, 0x68, 0x3E], // Unix ar / deb
];

/**
 * Validates the file buffer or file path to ensure it is not a disguised executable
 * and categorizes the file appropriately.
 */
export const validateFileSafety = async (filePath, originalName) => {
  const fd = await fs.promises.open(filePath, 'r');
  const buffer = Buffer.alloc(32);
  await fd.read(buffer, 0, 32, 0);
  await fd.close();

  // 1. Check for blocked executable headers
  for (const sig of BLOCKED_EXECUTABLES) {
    if (buffer.subarray(0, sig.length).equals(Buffer.from(sig))) {
      return {
        safe: false,
        reason: 'Executable binaries, DLLs, and compiled scripts are forbidden for security.',
      };
    }
  }

  // 2. Prevent path traversal in filenames
  if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
    return {
      safe: false,
      reason: 'Illegal characters or path traversal sequence detected in filename.',
    };
  }

  // 3. Determine category
  const ext = originalName.split('.').pop().toLowerCase();
  const category = categorizeExtension(ext);

  return {
    safe: true,
    category,
    extension: ext,
  };
};

export const categorizeExtension = (ext) => {
  const images = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'heic', 'bmp', 'tiff'];
  const videos = ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v'];
  const audio = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'];
  const documents = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'];
  const archives = ['zip', 'rar', '7z', 'tar', 'gz'];
  const code = ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'md', 'sql', 'py', 'java', 'c', 'cpp', 'php'];

  if (images.includes(ext)) return 'image';
  if (videos.includes(ext)) return 'video';
  if (audio.includes(ext)) return 'audio';
  if (documents.includes(ext)) return 'document';
  if (archives.includes(ext)) return 'archive';
  if (code.includes(ext)) return 'code';
  return 'other';
};
