export type CharacterId = 'king' | 'queen' | 'prince' | 'princess' | 'knight' | 'baron';

/** Base sprite expression */
export type SpriteMood = 'happy' | 'neutral' | 'sad';

/** Semantic mood used across the app */
export type Mood = 'cheer' | 'excited' | 'hype' | 'neutral' | 'sad' | 'upset' | 'angry' | 'forgive';

export interface Character {
  id: CharacterId;
  name: string;
  accent: string; // tailwind color hint for halo/glow
  sprites: Record<SpriteMood, string>;
}

export const CHARACTERS: Character[] = [
  { id: 'king', name: 'King', accent: 'from-yellow-400/40 to-amber-600/40', sprites: { happy: '/medieval/king.png', neutral: '/medieval/king.png', sad: '/medieval/king.png' } },
  { id: 'queen', name: 'Queen', accent: 'from-pink-400/40 to-rose-600/40', sprites: { happy: '/medieval/queen.png', neutral: '/medieval/queen.png', sad: '/medieval/queen.png' } },
  { id: 'prince', name: 'Prince', accent: 'from-blue-400/40 to-indigo-600/40', sprites: { happy: '/medieval/prince.png', neutral: '/medieval/prince.png', sad: '/medieval/prince.png' } },
  { id: 'princess', name: 'Princess', accent: 'from-fuchsia-400/40 to-purple-650/40', sprites: { happy: '/medieval/princess.png', neutral: '/medieval/princess.png', sad: '/medieval/princess.png' } },
  { id: 'knight', name: 'Knight', accent: 'from-slate-400/40 to-zinc-600/40', sprites: { happy: '/medieval/knight.png', neutral: '/medieval/knight.png', sad: '/medieval/knight.png' } },
  { id: 'baron', name: 'Baron', accent: 'from-amber-400/40 to-amber-750/40', sprites: { happy: '/medieval/baron.png', neutral: '/medieval/baron.png', sad: '/medieval/baron.png' } },
];

export const CHARACTER_MAP: Record<CharacterId, Character> =
  CHARACTERS.reduce((acc, c) => { acc[c.id] = c; return acc; }, {} as Record<CharacterId, Character>);

/** Map semantic mood → base sprite */
export function spriteForMood(mood: Mood): SpriteMood {
  switch (mood) {
    case 'cheer':
    case 'excited':
    case 'hype':
    case 'forgive':
      return 'happy';
    case 'sad':
    case 'upset':
    case 'angry':
      return 'sad';
    case 'neutral':
    default:
      return 'neutral';
  }
}

/** Mood based on accuracy */
export function moodFromAccuracy(accuracy: number, sample: number): Mood {
  if (sample === 0) return 'neutral';
  if (accuracy >= 0.8) return 'excited';
  if (accuracy >= 0.6) return 'cheer';
  if (accuracy >= 0.4) return 'neutral';
  if (accuracy >= 0.2) return 'sad';
  return 'angry';
}

/** Pick a character */
export function pickCharacter(exclude?: CharacterId | null): Character {
  const pool = exclude ? CHARACTERS.filter((c) => c.id !== exclude) : CHARACTERS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Deterministic daily character */
export function characterOfTheDay(): Character {
  const d = new Date();
  const key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return CHARACTERS[key % CHARACTERS.length];
}