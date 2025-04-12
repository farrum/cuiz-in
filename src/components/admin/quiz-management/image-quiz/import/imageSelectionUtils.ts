
/**
 * Utility functions for selecting appropriate images for trivia questions
 */

// Map of category-specific images
const categoryImages: Record<string, string[]> = {
  'Science': [
    'https://images.unsplash.com/photo-1517976487492-5750f3195933',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d',
    'https://images.unsplash.com/photo-1564325724739-bae0bd08762c'
  ],
  'History': [
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1',
    'https://images.unsplash.com/photo-1491555103944-7c647fd857e6',
    'https://images.unsplash.com/photo-1566378246598-5b11a0d486cc'
  ],
  'Geography': [
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef'
  ],
  'Entertainment': [
    'https://images.unsplash.com/photo-1603190287605-e6ade32fa852',
    'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0',
    'https://images.unsplash.com/photo-1585699324551-a6f1d4b934f1'
  ],
  'Sports': [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e'
  ],
  'Art': [
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5',
    'https://images.unsplash.com/photo-1578926288207-a90a5366759d',
    'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1'
  ]
};

// Default images when no category match is found
const defaultImages = [
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04',
  'https://images.unsplash.com/photo-1546521343-4eb2c01aa44b',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1'
];

/**
 * Get a random image that matches the given category
 */
export const getRandomImageForCategory = (category: string): string => {
  let imageList = defaultImages;
  
  for (const [key, images] of Object.entries(categoryImages)) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      imageList = images;
      break;
    }
  }
  
  return imageList[Math.floor(Math.random() * imageList.length)];
};
