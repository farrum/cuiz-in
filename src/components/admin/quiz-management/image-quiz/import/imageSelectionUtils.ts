
/**
 * Utility functions for selecting appropriate images for trivia questions
 * Uses reliable direct image URLs from Unsplash and Picsum
 */

// Category-specific images using direct Unsplash CDN URLs (always work)
const categoryImages: Record<string, string[]> = {
  'science': [
    'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=600&h=400&fit=crop',
  ],
  'history': [
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1566378246598-5b11a0d486cc?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1524397057410-1e775ed476f3?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1608425849567-a3a52e9d0052?w=600&h=400&fit=crop',
  ],
  'geography': [
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?w=600&h=400&fit=crop',
  ],
  'entertainment': [
    'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=400&fit=crop',
  ],
  'sports': [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1461896836934-bd45ba8b2cda?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&h=400&fit=crop',
  ],
  'art': [
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1578926288207-a90a5366759d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=400&fit=crop',
  ],
  'animal': [
    'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1518882174711-1de40238921b?w=600&h=400&fit=crop',
  ],
  'vehicle': [
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&h=400&fit=crop',
  ],
  'music': [
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
  ],
  'computer': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop',
  ],
  'mathematics': [
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&h=400&fit=crop',
  ],
  'mythology': [
    'https://images.unsplash.com/photo-1608346128025-1896b97a6fa7?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1584810359583-96fc3448beaa?w=600&h=400&fit=crop',
  ],
  'politics': [
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=600&h=400&fit=crop',
  ],
  'book': [
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop',
  ],
  'food': [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
  ],
  'nature': [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&h=400&fit=crop',
  ],
};

// Simple hash for consistent image selection per question
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

/**
 * Get a relevant image URL for a trivia question
 * Uses category matching with direct Unsplash CDN URLs (reliable, no API key needed)
 * Falls back to picsum.photos for unmatched categories
 */
export const getRandomImageForCategory = (category: string, question?: string): string => {
  const categoryLower = category.toLowerCase();
  
  // Find matching category images
  let matchedImages: string[] | null = null;
  for (const [key, images] of Object.entries(categoryImages)) {
    if (categoryLower.includes(key)) {
      matchedImages = images;
      break;
    }
  }

  if (matchedImages && matchedImages.length > 0) {
    // Use question hash for consistent but varied selection
    const seed = question ? simpleHash(question) : Math.floor(Math.random() * 1000);
    return matchedImages[seed % matchedImages.length];
  }

  // Fallback: use picsum.photos with a question-based seed for variety
  const seed = question ? simpleHash(question) % 1000 : Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${seed}/600/400`;
};
