export interface MinigameInfo {
  id: string; // slug used in URL
  name: string;
  description: string;
  emoji: string;
  gradient: string;
  playCount: number;
}

export const minigames: MinigameInfo[] = [
  {
    id: 'balloonpop',
    name: 'Balloon Pop',
    description: 'Pop balloons before they escape. Fast‑paced arcade fun.',
    emoji: '🎈',
    gradient: 'linear-gradient(135deg, #ff5e62, #ff9966)',
    playCount: 0,
  },
  {
    id: 'slotmachine',
    name: 'Slot Machine',
    description: 'Spin the reels and try your luck for big wins.',
    emoji: '🎰',
    gradient: 'linear-gradient(135deg, #f12711, #f5af19)',
    playCount: 0,
  },
  {
    id: 'plinkogame',
    name: 'Plinko',
    description: 'Drop chips and watch them bounce to random prizes.',
    emoji: '🔴',
    gradient: 'linear-gradient(135deg, #11998e, #38ef7d)',
    playCount: 0,
  },
  {
    id: 'rockpaperscissors',
    name: 'Rock‑Paper‑Scissors',
    description: 'Classic hand‑gesture showdown against the computer.',
    emoji: '✊',
    gradient: 'linear-gradient(135deg, #8e2de2, #4a00e0)',
    playCount: 0,
  },
  {
    id: 'treasurechest',
    name: 'Treasure Chest',
    description: 'Open chests for random rewards and bonuses.',
    emoji: '🏴‍☠️',
    gradient: 'linear-gradient(135deg, #e55d87, #5fc3e4)',
    playCount: 0,
  },
  {
    id: 'wheel',
    name: 'Spin the Wheel',
    description: 'Spin the wheel of fortune to win coins, tickets, and mystery items.',
    emoji: '🎡',
    gradient: 'linear-gradient(135deg, #00c6ff, #0072ff)',
    playCount: 0,
  },
  {
    id: 'scratch',
    name: 'Scratch Card',
    description: 'Scratch away the golden foil to match items and win rewards.',
    emoji: '🎫',
    gradient: 'linear-gradient(135deg, #f857a6, #ff5858)',
    playCount: 0,
  },
  {
    id: 'true-false',
    name: 'True or False',
    description: 'Test your reflexes and knowledge in a rapid‑fire fact‑checking challenge.',
    emoji: '⚖️',
    gradient: 'linear-gradient(135deg, #1d976c, #93f9b9)',
    playCount: 0,
  },
  {
    id: 'image',
    name: 'Image Trivia',
    description: 'Identify visual cues and images to solve trivia questions.',
    emoji: '🖼️',
    gradient: 'linear-gradient(135deg, #f7971e, #ffd200)',
    playCount: 0,
  },
  {
    id: 'coinflip',
    name: 'Coin Flip',
    description: 'Double or nothing! Flip the coin and guess heads or tails to win big.',
    emoji: '🪙',
    gradient: 'linear-gradient(135deg, #f5af19, #e65c00)',
    playCount: 0,
  },
  {
    id: 'diceroll',
    name: 'Dice Roll',
    description: 'Roll the high-stakes dice for multipliers, doubles bonuses, and jackpots.',
    emoji: '🎲',
    gradient: 'linear-gradient(135deg, #8a2be2, #4169e1)',
    playCount: 0,
  },
  {
    id: 'riddlevault',
    name: 'Riddle Vault',
    description: 'Solve the daily cryptic riddle to unlock the vault and claim 500 Gems.',
    emoji: '🔑',
    gradient: 'linear-gradient(135deg, #373b44, #4286f4)',
    playCount: 0,
  },
];
