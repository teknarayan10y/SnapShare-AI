import { photobookService } from '../services/photobookService.js';

export const getPhotobook = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const userId = req.user?._id;

    if (!userId && !collectionId) {
      return res.status(400).json({
        success: false,
        error: 'Collection ID or authenticated user is required',
      });
    }

    const book = await photobookService.generatePhotobookLayout({
      collectionId,
      userId,
    });

    return res.json({
      success: true,
      photobook: book,
    });
  } catch (error) {
    console.error('[Photobook Error]:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate photobook layout',
    });
  }
};
