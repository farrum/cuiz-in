export interface MinigameInfo {
  id: string; // slug used in URL
  name: string;
  description: string;
  thumbnail: string; // relative path to image asset
  playCount: number;
}

export const minigames: MinigameInfo[] = [
  {
    id: 'balloonpop',
    name: 'Balloon Pop',
    description: 'Pop balloons before they escape. Fast‑paced arcade fun.',
    thumbnail: '/assets/mini_game_card_thumbnail.png',
    playCount: 0,
  },
  {
    id: 'slotmachine',
    name: 'Slot Machine',
    description: 'Spin the reels and try your luck for big wins.',
    thumbnail: '/assets/mini_game_card_thumbnail.png',
    playCount: 0,
  },
  {
    id: 'plinkogame',
    name: 'Plinko',
    description: 'Drop chips and watch them bounce to random prizes.',
    thumbnail: '/assets/mini_game_card_thumbnail.png',
    playCount: 0,
  },
  {
    id: 'rockpaperscissors',
    name: 'Rock‑Paper‑Scissors',
    description: 'Classic hand‑gesture showdown against the computer.',
    thumbnail: '/assets/mini_game_card_thumbnail.png',
    playCount: 0,
  },
  {
    id: 'treasurechest',
    name: 'Treasure Chest',
    description: 'Open chests for random rewards and bonuses.',
    thumbnail: '/assets/mini_game_card_thumbnail.png',
    playCount: 0,
  },
  // Add additional games here following the same structure
];
