import gemmyHappy from '@/mobile/assets/mascots/gemmy/happy.png';
import gemmyNeutral from '@/mobile/assets/mascots/gemmy/neutral.png';
import gemmySad from '@/mobile/assets/mascots/gemmy/sad.png';
import foxyHappy from '@/mobile/assets/mascots/foxy/happy.png';
import foxyNeutral from '@/mobile/assets/mascots/foxy/neutral.png';
import foxySad from '@/mobile/assets/mascots/foxy/sad.png';
import owlieHappy from '@/mobile/assets/mascots/owlie/happy.png';
import owlieNeutral from '@/mobile/assets/mascots/owlie/neutral.png';
import owlieSad from '@/mobile/assets/mascots/owlie/sad.png';
import roboHappy from '@/mobile/assets/mascots/robo/happy.png';
import roboNeutral from '@/mobile/assets/mascots/robo/neutral.png';
import roboSad from '@/mobile/assets/mascots/robo/sad.png';
import mochiHappy from '@/mobile/assets/mascots/mochi/happy.png';
import mochiNeutral from '@/mobile/assets/mascots/mochi/neutral.png';
import mochiSad from '@/mobile/assets/mascots/mochi/sad.png';
import dracoHappy from '@/mobile/assets/mascots/draco/happy.png';
import dracoNeutral from '@/mobile/assets/mascots/draco/neutral.png';
import dracoSad from '@/mobile/assets/mascots/draco/sad.png';
import pandiHappy from '@/mobile/assets/mascots/pandi/happy.png';
import pandiNeutral from '@/mobile/assets/mascots/pandi/neutral.png';
import pandiSad from '@/mobile/assets/mascots/pandi/sad.png';
import zorpHappy from '@/mobile/assets/mascots/zorp/happy.png';
import zorpNeutral from '@/mobile/assets/mascots/zorp/neutral.png';
import zorpSad from '@/mobile/assets/mascots/zorp/sad.png';

export type CharacterId = 'gemmy' | 'foxy' | 'owlie' | 'robo' | 'mochi' | 'draco' | 'pandi' | 'zorp';

/** Base sprite expression — additional moods are derived via Motion variants. */
export type SpriteMood = 'happy' | 'neutral' | 'sad';

/** Semantic mood used across the app. Maps to SpriteMood + a motion preset. */
export type Mood = 'cheer' | 'excited' | 'hype' | 'neutral' | 'sad' | 'upset' | 'angry' | 'forgive';

export interface Character {
  id: CharacterId;
  name: string;
  accent: string; // tailwind color hint for halo/glow
  sprites: Record<SpriteMood, string>;
}

export const CHARACTERS: Character[] = [
  { id: 'gemmy', name: 'Gemmy', accent: 'from-fuchsia-400/40 to-purple-500/40', sprites: { happy: gemmyHappy, neutral: gemmyNeutral, sad: gemmySad } },
  { id: 'foxy', name: 'Foxy', accent: 'from-orange-400/40 to-red-500/40', sprites: { happy: foxyHappy, neutral: foxyNeutral, sad: foxySad } },
  { id: 'owlie', name: 'Owlie', accent: 'from-amber-400/40 to-amber-700/40', sprites: { happy: owlieHappy, neutral: owlieNeutral, sad: owlieSad } },
  { id: 'robo', name: 'Robo', accent: 'from-emerald-400/40 to-teal-500/40', sprites: { happy: roboHappy, neutral: roboNeutral, sad: roboSad } },
  { id: 'mochi', name: 'Mochi', accent: 'from-pink-300/40 to-rose-400/40', sprites: { happy: mochiHappy, neutral: mochiNeutral, sad: mochiSad } },
  { id: 'draco', name: 'Draco', accent: 'from-teal-400/40 to-cyan-500/40', sprites: { happy: dracoHappy, neutral: dracoNeutral, sad: dracoSad } },
  { id: 'pandi', name: 'Pandi', accent: 'from-slate-300/40 to-slate-600/40', sprites: { happy: pandiHappy, neutral: pandiNeutral, sad: pandiSad } },
  { id: 'zorp', name: 'Zorp', accent: 'from-violet-400/40 to-purple-600/40', sprites: { happy: zorpHappy, neutral: zorpNeutral, sad: zorpSad } },
];

export const CHARACTER_MAP: Record<CharacterId, Character> =
  CHARACTERS.reduce((acc, c) => { acc[c.id] = c; return acc; }, {} as Record<CharacterId, Character>);

/** Map semantic mood → which base sprite to render. */
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

/** Mood for the "mascot mirror" on profile / hub based on rolling accuracy 0..1. */
export function moodFromAccuracy(accuracy: number, sample: number): Mood {
  if (sample === 0) return 'neutral';
  if (accuracy >= 0.8) return 'excited';
  if (accuracy >= 0.6) return 'cheer';
  if (accuracy >= 0.4) return 'neutral';
  if (accuracy >= 0.2) return 'sad';
  return 'angry';
}

/** Stable pseudo-random pick that avoids repeating the previous id. */
export function pickCharacter(exclude?: CharacterId | null): Character {
  const pool = exclude ? CHARACTERS.filter((c) => c.id !== exclude) : CHARACTERS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** "Mascot of the day" — deterministic per calendar day. */
export function characterOfTheDay(): Character {
  const d = new Date();
  const key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return CHARACTERS[key % CHARACTERS.length];
}