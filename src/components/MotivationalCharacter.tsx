import React, { useState, useEffect, useMemo } from 'react';

interface MotivationalCharacterProps {
  mood?: 'happy' | 'sad' | 'neutral';
  message?: string;
  showMessage?: boolean;
}

interface RoyalCharacter {
  id: string;
  name: string;
  avatar: string;
}

const ROYAL_CHARACTERS: RoyalCharacter[] = [
  { id: 'king', name: 'King', avatar: '/medieval/king.png' },
  { id: 'queen', name: 'Queen', avatar: '/medieval/queen.png' },
  { id: 'prince', name: 'Prince', avatar: '/medieval/prince.png' },
  { id: 'princess', name: 'Princess', avatar: '/medieval/princess.png' },
  { id: 'knight', name: 'Knight', avatar: '/medieval/knight.png' },
  { id: 'baron', name: 'Baron', avatar: '/medieval/baron.png' },
];

const getRoyalPhrase = (charId: string, mood: 'happy' | 'sad' | 'neutral'): string => {
  const phrases: Record<string, Record<'happy' | 'sad' | 'neutral', string[]>> = {
    king: {
      happy: [
        "By my decree, a flawless victory! The treasury rejoices!",
        "Superb execution! You bring great honor to the royal crest."
      ],
      sad: [
        "A momentary lapse in strategy. Stand tall, double your resolve!",
        "The battlefield demands focus. Learn from this defeat and push forward."
      ],
      neutral: [
        "Knowledge is the greatest shield of our realm.",
        "A true ruler never stops learning."
      ]
    },
    queen: {
      happy: [
        "Splendidly done, my champion. Your intellect shines like the crown jewels.",
        "Ah, such grace! You make victory look effortless, my sweet champion."
      ],
      sad: [
        "Fret not, my brave soul. Even the grandest empires have their rainy days.",
        "My heart aches to see you stumble, but I know you will rise again."
      ],
      neutral: [
        "May wisdom guide your path, noble adventurer.",
        "Let us discover the truths of the kingdom together."
      ]
    },
    prince: {
      happy: [
        "Ha! A crushing blow to the quiz. That's how a true heir wins!",
        "Flawless. You fight with the fire of a dragon. Keep striking!"
      ],
      sad: [
        "Weakness has no place in our ranks. Dust yourself off and fight harder!",
        "A minor setback. Failure is just training for the ultimate victory!"
      ],
      neutral: [
        "The throne will be mine, but your wisdom shall aid my reign.",
        "Every challenge is another fortress to conquer."
      ]
    },
    princess: {
      happy: [
        "A perfect answer! You make my heart flutter with your wisdom, noble hero!",
        "Magnificent! I knew you would solve this riddle just for me!"
      ],
      sad: [
        "Oh dear... that wasn't it, but I still believe in your noble spirit!",
        "Don't worry, my hero! You will conquer the next challenge, I just know it!"
      ],
      neutral: [
        "Do you believe in magic, or is it just your brilliant mind?",
        "I love hearing your stories of victory."
      ]
    },
    knight: {
      happy: [
        "Victory is ours! Honor and glory guide your hand, soldier!",
        "A masterclass in combat. Your focus is an inspiration to the garrison."
      ],
      sad: [
        "Shields up! Defeat is merely an opportunity to steel your armor.",
        "Keep your eyes on the enemy! We retreat, we regroup, and we win!"
      ],
      neutral: [
        "Duty and honor above all else.",
        "Stay vigilant. The trial has only just begun."
      ]
    },
    baron: {
      happy: [
        "A profitable venture. That answer pays handsomely in gold and gems.",
        "Excellent calculations. Efficiency is the key to conquering these lands."
      ],
      sad: [
        "That mistake will cost us resources. Refocus before we lose the campaign!",
        "A sloppy move. Recalibrate your tactics or we will lose our commission."
      ],
      neutral: [
        "Everything has a price. What is the value of your next choice?",
        "Let us expand our influence step by step."
      ]
    }
  };

  const charPhrases = phrases[charId] || phrases.king;
  const pool = charPhrases[mood];
  return pool[Math.floor(Math.random() * pool.length)];
};

const MotivationalCharacter: React.FC<MotivationalCharacterProps> = ({
  mood = 'neutral',
  message,
  showMessage = true
}) => {
  const [selectedChar, setSelectedChar] = useState<RoyalCharacter | null>(null);

  useEffect(() => {
    const randomChar = ROYAL_CHARACTERS[Math.floor(Math.random() * ROYAL_CHARACTERS.length)];
    setSelectedChar(randomChar);
  }, []);

  const displayMessage = useMemo(() => {
    if (!selectedChar) return '';
    if (message) return message;
    return getRoyalPhrase(selectedChar.id, mood);
  }, [selectedChar, message, mood]);

  if (!selectedChar || !showMessage) return null;

  return (
    <div className="flex items-center gap-4 bg-stone-900/90 border-4 border-double border-amber-500/25 rounded-3xl p-4 shadow-xl max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/30 flex-shrink-0 bg-stone-950">
        <img 
          src={selectedChar.avatar} 
          alt={selectedChar.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-black uppercase text-center text-amber-400 py-0.5">
          {selectedChar.name}
        </div>
      </div>
      
      <div className="text-left flex-1 min-w-0">
        <span className="font-extrabold uppercase text-[9px] tracking-widest text-amber-500 block mb-0.5">
          {selectedChar.name}'s Decree
        </span>
        <p className="italic text-slate-300 leading-relaxed text-[11.5px] font-semibold">
          "{displayMessage}"
        </p>
      </div>
    </div>
  );
};

export default MotivationalCharacter;
