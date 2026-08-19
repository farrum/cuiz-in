import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { HeroDashboardCard, HeroData } from '@/components/gamification/HeroDashboardCard';
import { MysteryBoxOpener } from '@/components/gamification/MysteryBoxOpener';
import { DailyHangman } from '@/components/gamification/DailyHangman';
import { minigames } from '@/components/gamification/minigamesData';
import { MiniGameCard } from '@/components/gamification/MiniGameCard';
import { fetchQuizQuestions } from '@/utils/quizDataService';
import { QuizQuestion } from '@/utils/types';
import { updateTotalStars, logStarsEarned } from '@/utils/rewardService';
import { STORAGE_KEYS } from '@/utils/constants';
import { addNotification } from '@/utils/notificationManager';
import { 
  Shield, Star, Sparkles, Coins, Swords, Landmark, MapPin, 
  HelpCircle, Timer, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Lock,
  Trophy, Crown, Play, Award, Zap, ChevronRight, Check, RefreshCw, UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioManager } from '@/utils/audioManager';
import { cn } from '@/lib/utils';
import { TopBannerAd } from '@/mobile/ads/TopBannerAd';
import { InterstitialAd } from '@/mobile/ads/InterstitialAd';

export interface QuestStage {
  id: string;
  stageNumber: number;
  sectorId: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Legendary';
  category: string;
  rules: string;
  entryCost: number;
  rewardType: 'bronze' | 'gold' | 'legendary';
  rewardLabel: string;
  emoji: string;
  requiredPrevStars: number;
}

export interface QuestSector {
  id: string;
  sectorNumber: number;
  title: string;
  subtitle: string;
  badgeEmoji: string;
  stages: QuestStage[];
  milestones: { starsRequired: number; rewardType: 'bronze' | 'gold' | 'legendary'; label: string }[];
}

const QUEST_SECTORS: QuestSector[] = [
  {
    id: 'sector_1',
    sectorNumber: 1,
    title: "Sector I: Frontier Citadel",
    subtitle: "The entry grounds to the Empire. Prove your foundational knowledge.",
    badgeEmoji: "🏰",
    milestones: [
      { starsRequired: 4, rewardType: 'bronze', label: 'Bronze Vault' },
      { starsRequired: 8, rewardType: 'gold', label: 'Golden Chest' },
      { starsRequired: 12, rewardType: 'legendary', label: 'Citadel Crown' }
    ],
    stages: [
      {
        id: 'st_1_1',
        stageNumber: 1,
        sectorId: 'sector_1',
        name: "Citadel Gates",
        description: "The opening trial. Answer general knowledge questions to gain entry.",
        difficulty: "Easy",
        category: "General",
        rules: "Standard Mode: 15s per question",
        entryCost: 0,
        rewardType: "bronze",
        rewardLabel: "Bronze Chest",
        emoji: "🚪",
        requiredPrevStars: 0
      },
      {
        id: 'st_1_2',
        stageNumber: 2,
        sectorId: 'sector_1',
        name: "Scribe's Courtyard",
        description: "Navigate ancient records of Indian and world history.",
        difficulty: "Easy",
        category: "History",
        rules: "Speed Run: 12s per question",
        entryCost: 0,
        rewardType: "bronze",
        rewardLabel: "Bronze Chest + 25 Tickets",
        emoji: "📜",
        requiredPrevStars: 2
      },
      {
        id: 'st_1_3',
        stageNumber: 3,
        sectorId: 'sector_1',
        name: "Watchtower Riddles",
        description: "Solve sharp mental puzzles atop the watchtower.",
        difficulty: "Medium",
        category: "Riddles",
        rules: "No Lifelines allowed on this tower",
        entryCost: 10,
        rewardType: "bronze",
        rewardLabel: "Bronze Chest + 35 Tickets",
        emoji: "🗼",
        requiredPrevStars: 4
      },
      {
        id: 'st_1_4',
        stageNumber: 4,
        sectorId: 'sector_1',
        name: "Alchemist Vault",
        description: "Test your scientific precision to brew victory.",
        difficulty: "Medium",
        category: "Science",
        rules: "Double Shard Chance on completion",
        entryCost: 15,
        rewardType: "gold",
        rewardLabel: "Golden Vault",
        emoji: "🧪",
        requiredPrevStars: 7
      },
      {
        id: 'st_1_5',
        stageNumber: 5,
        sectorId: 'sector_1',
        name: "Frontier Overlord",
        description: "Boss Stage! Defeat the citadel warlord with zero errors.",
        difficulty: "Hard",
        category: "General",
        rules: "Sudden Death: 1 wrong answer defeats you",
        entryCost: 25,
        rewardType: "legendary",
        rewardLabel: "Overlord's Crown Chest",
        emoji: "⚔️",
        requiredPrevStars: 10
      }
    ]
  },
  {
    id: 'sector_2',
    sectorNumber: 2,
    title: "Sector II: Imperial Core",
    subtitle: "Navigate the bustling heart of the realm and its rich lore.",
    badgeEmoji: "🏛️",
    milestones: [
      { starsRequired: 5, rewardType: 'bronze', label: 'Imperial Chest' },
      { starsRequired: 10, rewardType: 'gold', label: 'Gold Relic Vault' },
      { starsRequired: 15, rewardType: 'legendary', label: 'Emperor Chest' }
    ],
    stages: [
      {
        id: 'st_2_1',
        stageNumber: 6,
        sectorId: 'sector_2',
        name: "Whispering Library",
        description: "Deep historical lore and ancient manuscripts.",
        difficulty: "Medium",
        category: "History",
        rules: "Standard Mode: 15s timer",
        entryCost: 20,
        rewardType: "bronze",
        rewardLabel: "Bronze Chest",
        emoji: "📚",
        requiredPrevStars: 12
      },
      {
        id: 'st_2_2',
        stageNumber: 7,
        sectorId: 'sector_2',
        name: "Celestial Observatory",
        description: "Explore physical laws, astronomy, and advanced science.",
        difficulty: "Hard",
        category: "Science",
        rules: "Rapid Pulse: 10s per question",
        entryCost: 30,
        rewardType: "gold",
        rewardLabel: "Golden Vault",
        emoji: "🔭",
        requiredPrevStars: 15
      },
      {
        id: 'st_2_3',
        stageNumber: 8,
        sectorId: 'sector_2',
        name: "Mythic Amphitheater",
        description: "Unravel ancient mythology and epic tales of heroes.",
        difficulty: "Medium",
        category: "Mythology",
        rules: "Hero Boost: Lifeline cost reduced",
        entryCost: 35,
        rewardType: "gold",
        rewardLabel: "Golden Vault",
        emoji: "🏟️",
        requiredPrevStars: 18
      },
      {
        id: 'st_2_4',
        stageNumber: 9,
        sectorId: 'sector_2',
        name: "Grand Cartographer",
        description: "Conquer world geography and continental borders.",
        difficulty: "Hard",
        category: "Geography",
        rules: "No Hints Mode",
        entryCost: 45,
        rewardType: "gold",
        rewardLabel: "Golden Vault",
        emoji: "🗺️",
        requiredPrevStars: 21
      },
      {
        id: 'st_2_5',
        stageNumber: 10,
        sectorId: 'sector_2',
        name: "Imperial General",
        description: "Sector Boss! A grueling test across all domains.",
        difficulty: "Legendary",
        category: "General",
        rules: "Perfect Victory Required (5/5)",
        entryCost: 60,
        rewardType: "legendary",
        rewardLabel: "Imperial General Chest",
        emoji: "👑",
        requiredPrevStars: 25
      }
    ]
  },
  {
    id: 'sector_3',
    sectorNumber: 3,
    title: "Sector III: Mystic Sanctuary",
    subtitle: "Sacred grounds of high wisdom and legendary trials.",
    badgeEmoji: "🔮",
    milestones: [
      { starsRequired: 5, rewardType: 'bronze', label: 'Mystic Vault' },
      { starsRequired: 10, rewardType: 'gold', label: 'Arcane Chest' },
      { starsRequired: 15, rewardType: 'legendary', label: 'Sanctuary Relic' }
    ],
    stages: [
      {
        id: 'st_3_1',
        stageNumber: 11,
        sectorId: 'sector_3',
        name: "Oracle's Sanctum",
        description: "Decipher mysterious riddles and hidden meanings.",
        difficulty: "Hard",
        category: "Riddles",
        rules: "Strict 10s Timer",
        entryCost: 70,
        rewardType: "gold",
        rewardLabel: "Golden Vault",
        emoji: "🔮",
        requiredPrevStars: 28
      },
      {
        id: 'st_3_2',
        stageNumber: 12,
        sectorId: 'sector_3',
        name: "Temple of Antiquity",
        description: "Sacred historical events and royal dynasties.",
        difficulty: "Hard",
        category: "History",
        rules: "Standard 15s Timer",
        entryCost: 80,
        rewardType: "gold",
        rewardLabel: "Golden Vault",
        emoji: "⛩️",
        requiredPrevStars: 32
      },
      {
        id: 'st_3_3',
        stageNumber: 13,
        sectorId: 'sector_3',
        name: "Astral Spire",
        description: "Master level science and natural phenomenon.",
        difficulty: "Legendary",
        category: "Science",
        rules: "Double Shard Rate",
        entryCost: 90,
        rewardType: "legendary",
        rewardLabel: "Emperor Chest",
        emoji: "🌌",
        requiredPrevStars: 36
      },
      {
        id: 'st_3_4',
        stageNumber: 14,
        sectorId: 'sector_3',
        name: "Dragon's Arch",
        description: "Face intense multi-topic general questions.",
        difficulty: "Legendary",
        category: "General",
        rules: "Sudden Death Mode",
        entryCost: 100,
        rewardType: "legendary",
        rewardLabel: "Emperor Chest",
        emoji: "🐉",
        requiredPrevStars: 40
      },
      {
        id: 'st_3_5',
        stageNumber: 15,
        sectorId: 'sector_3',
        name: "Sanctuary Archmage",
        description: "Boss Stage! Defeat the archmage of the mystic realm.",
        difficulty: "Legendary",
        category: "General",
        rules: "Perfect Score Needed",
        entryCost: 120,
        rewardType: "legendary",
        rewardLabel: "Archmage Tomb",
        emoji: "🧙",
        requiredPrevStars: 44
      }
    ]
  },
  {
    id: 'sector_4',
    sectorNumber: 4,
    title: "Sector IV: Celestial Apex",
    subtitle: "The ultimate pinnacle of knowledge for true Quiz Grandmasters.",
    badgeEmoji: "💎",
    milestones: [
      { starsRequired: 3, rewardType: 'gold', label: 'Apex Vault' },
      { starsRequired: 6, rewardType: 'legendary', label: 'Grandmaster Crown' }
    ],
    stages: [
      {
        id: 'st_4_1',
        stageNumber: 16,
        sectorId: 'sector_4',
        name: "Emperor's Trial",
        description: "The pinnacle trial of speed and precision.",
        difficulty: "Legendary",
        category: "General",
        rules: "Speed Run: 8s timer",
        entryCost: 140,
        rewardType: "legendary",
        rewardLabel: "Emperor Chest",
        emoji: "👑",
        requiredPrevStars: 48
      },
      {
        id: 'st_4_2',
        stageNumber: 17,
        sectorId: 'sector_4',
        name: "Zenith Vault",
        description: "Complex riddles and intricate logical challenges.",
        difficulty: "Legendary",
        category: "Riddles",
        rules: "No Lifelines",
        entryCost: 160,
        rewardType: "legendary",
        rewardLabel: "Emperor Chest",
        emoji: "💎",
        requiredPrevStars: 52
      },
      {
        id: 'st_4_3',
        stageNumber: 18,
        sectorId: 'sector_4',
        name: "Crown of the Realm",
        description: "The final showdown. Claim the supreme realm crown!",
        difficulty: "Legendary",
        category: "General",
        rules: "Grandmaster Challenge: 5/5 Perfect",
        entryCost: 200,
        rewardType: "legendary",
        rewardLabel: "Supreme Realm Trophy",
        emoji: "🏆",
        requiredPrevStars: 56
      }
    ]
  }
];

export default function EmpireQuestsPage() {
  const [activeTab, setActiveTab] = useState<'quests' | 'hangman' | 'chests' | 'heroes'>('quests');
  const [userId, setUserId] = useState<string | null>(null);
  const [userStars, setUserStars] = useState(0); // Ticket Balance
  const [userGems, setUserGems] = useState(0);
  const [heroes, setHeroes] = useState<HeroData[]>([]);
  const [loading, setLoading] = useState(true);

  // Sector and Stage Progression State
  const [activeSectorId, setActiveSectorId] = useState<string>('sector_1');
  const [stageStarData, setStageStarData] = useState<{ [stageId: string]: { stars: number; maxScore: number } }>({});
  const [clearedStageIds, setClearedStageIds] = useState<string[]>([]);
  const [selectedPrepStage, setSelectedPrepStage] = useState<QuestStage | null>(null);
  const [selectedCouncilHero, setSelectedCouncilHero] = useState<HeroData | null>(null);

  // Mystery Box Opener state
  const [openerOpen, setOpenerOpen] = useState(false);
  const [selectedBoxTier, setSelectedBoxTier] = useState<'bronze' | 'gold' | 'legendary' | null>(null);

  // Ad states for Quests & Tavern battles
  const [interstitialOpen, setInterstitialOpen] = useState(false);
  const [adSeed, setAdSeed] = useState(0);

  // Active Gameplay state
  const [activeStage, setActiveStage] = useState<QuestStage | null>(null);
  const [questQuestions, setQuestQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(15);
  const [gameplayStatus, setGameplayStatus] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Active Hero State for Lifelines in Game
  const [socratesUsed, setSocratesUsed] = useState(false);
  const [aryabhataUsed, setAryabhataUsed] = useState(false);
  const [chanakyaUsed, setChanakyaUsed] = useState(false);
  const [ramanujanUsed, setRamanujanUsed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [smartClue, setSmartClue] = useState<string | null>(null);
  const [isShieldActive, setIsShieldActive] = useState(false);

  // Correct answer reveal and explanation states
  const [revealedCorrectAnswer, setRevealedCorrectAnswer] = useState<string | null>(null);
  const [revealedExplanation, setRevealedExplanation] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameplayStatusRef = useRef<'idle' | 'playing' | 'ended'>('idle');
  const { toast } = useToast();
  const haptics = useHaptics();

  // Load User Data & Progress
  const fetchUserData = async () => {
    try {
      // Local Storage Progress
      const localCleared = localStorage.getItem('cleared_stations');
      const clearedList = localCleared ? localCleared.split(',') : [];

      const rawStageStars = localStorage.getItem('quest_stage_stars');
      let parsedStageStars: { [key: string]: { stars: number; maxScore: number } } = {};
      if (rawStageStars) {
        try {
          parsedStageStars = JSON.parse(rawStageStars);
        } catch (e) {
          parsedStageStars = {};
        }
      } else {
        clearedList.forEach(stId => {
          parsedStageStars[stId] = { stars: 3, maxScore: 5 };
        });
      }

      setClearedStageIds(clearedList);
      setStageStarData(parsedStageStars);

      // Read local fallback currency first
      const localGems = Number(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || '100');
      const localStars = Number(localStorage.getItem(STORAGE_KEYS.USER_STARS) || '50');
      setUserGems(localGems);
      setUserStars(localStars);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        const staticHeroes: HeroData[] = [
          {
            id: 'socrates',
            name: "King Socrates",
            emoji: "🏛️",
            gradient: "from-blue-600 to-cyan-500",
            title: "The Philosopher King",
            abilityName: "Philosophical 50/50",
            abilityDesc: "Eliminates two incorrect options from the question.",
            starCost: 15,
            level: Number(localStorage.getItem('hero_socrates_level') || '1'),
            shards: Number(localStorage.getItem('hero_socrates_shards') || '10'),
          },
          {
            id: 'aryabhata',
            name: "King Aryabhata",
            emoji: "📐",
            gradient: "from-amber-600 to-yellow-500",
            title: "Master of Zero & Time",
            abilityName: "Astronomical Time Shift",
            abilityDesc: "Adds +15 seconds to the question timer.",
            starCost: 15,
            level: Number(localStorage.getItem('hero_aryabhata_level') || '1'),
            shards: Number(localStorage.getItem('hero_aryabhata_shards') || '5'),
          },
          {
            id: 'chanakya',
            name: "King Chanakya",
            emoji: "📜",
            gradient: "from-purple-600 to-indigo-500",
            title: "The Royal Strategist",
            abilityName: "Diplomatic Shield",
            abilityDesc: "Deploys a shield that absorbs 1 incorrect answer.",
            starCost: 20,
            level: Number(localStorage.getItem('hero_chanakya_level') || '1'),
            shards: Number(localStorage.getItem('hero_chanakya_shards') || '8'),
          },
          {
            id: 'ramanujan',
            name: "King Ramanujan",
            emoji: "♾️",
            gradient: "from-emerald-600 to-teal-500",
            title: "The Mathematical Visionary",
            abilityName: "Infinite Insight",
            abilityDesc: "Reveals direct mathematical clues and rationale.",
            starCost: 20,
            level: Number(localStorage.getItem('hero_ramanujan_level') || '1'),
            shards: Number(localStorage.getItem('hero_ramanujan_shards') || '12'),
          }
        ];
        setHeroes(staticHeroes);
      } else {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('points, stars')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const remoteStars = profile.stars ?? localStars;
          const remoteGems = profile.points ?? localGems;
          setUserStars(remoteStars);
          setUserGems(remoteGems);
          localStorage.setItem(STORAGE_KEYS.USER_STARS, remoteStars.toString());
          localStorage.setItem(STORAGE_KEYS.USER_GEMS, remoteGems.toString());
        }

        // Fetch Heroes
        const { data: userHeroes } = await (supabase as any)
          .from('user_heroes')
          .select('*')
          .eq('user_id', session.user.id);

        const heroList: HeroData[] = [
          {
            id: 'socrates',
            name: "King Socrates",
            emoji: "🏛️",
            gradient: "from-blue-600 to-cyan-500",
            title: "The Philosopher King",
            abilityName: "Philosophical 50/50",
            abilityDesc: "Eliminates two incorrect options.",
            starCost: 15,
            level: userHeroes?.find((h: any) => h.hero_id === 'socrates')?.level || 1,
            shards: userHeroes?.find((h: any) => h.hero_id === 'socrates')?.shards || 0,
          },
          {
            id: 'aryabhata',
            name: "King Aryabhata",
            emoji: "📐",
            gradient: "from-amber-600 to-yellow-500",
            title: "Master of Zero & Time",
            abilityName: "Astronomical Time Shift",
            abilityDesc: "Adds +15 seconds to the question timer.",
            starCost: 15,
            level: userHeroes?.find((h: any) => h.hero_id === 'aryabhata')?.level || 1,
            shards: userHeroes?.find((h: any) => h.hero_id === 'aryabhata')?.shards || 0,
          },
          {
            id: 'chanakya',
            name: "King Chanakya",
            emoji: "📜",
            gradient: "from-purple-600 to-indigo-500",
            title: "The Royal Strategist",
            abilityName: "Diplomatic Shield",
            abilityDesc: "Deploys a shield absorbing 1 incorrect answer.",
            starCost: 20,
            level: userHeroes?.find((h: any) => h.hero_id === 'chanakya')?.level || 1,
            shards: userHeroes?.find((h: any) => h.hero_id === 'chanakya')?.shards || 0,
          },
          {
            id: 'ramanujan',
            name: "King Ramanujan",
            emoji: "♾️",
            gradient: "from-emerald-600 to-teal-500",
            title: "The Mathematical Visionary",
            abilityName: "Infinite Insight",
            abilityDesc: "Reveals direct mathematical clues and rationale.",
            starCost: 20,
            level: userHeroes?.find((h: any) => h.hero_id === 'ramanujan')?.level || 1,
            shards: userHeroes?.find((h: any) => h.hero_id === 'ramanujan')?.shards || 0,
          }
        ];
        setHeroes(heroList);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    gameplayStatusRef.current = 'idle';
    // Reward events (gemsUpdated / starsUpdated) fire several times in a row
    // when a quest ends. Refetching on each one re-rendered the whole board
    // repeatedly, which reads as the screen blinking. Debounce them, and never
    // refetch while a stage is being played — exitGameplay() refreshes anyway.
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const handleGemsUpdate = () => {
      if (gameplayStatusRef.current !== 'idle') return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => fetchUserData(), 800);
    };
    window.addEventListener('gemsUpdated', handleGemsUpdate);
    window.addEventListener('starsUpdated', handleGemsUpdate);

    return () => {
      if (debounce) clearTimeout(debounce);
      window.removeEventListener('gemsUpdated', handleGemsUpdate);
      window.removeEventListener('starsUpdated', handleGemsUpdate);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Keep the ref in sync so the reward-event listener can read it.
  useEffect(() => {
    gameplayStatusRef.current = gameplayStatus;
  }, [gameplayStatus]);

  // Compute Total Star Ratings Earned across all stages
  const totalEarnedStars = React.useMemo(() => {
    return Object.values(stageStarData).reduce((sum, item) => sum + (item.stars || 0), 0);
  }, [stageStarData]);

  // Flat array of all stages across all sectors
  const ALL_STAGES_FLAT = React.useMemo(() => {
    return QUEST_SECTORS.flatMap(sec => sec.stages);
  }, []);

  // Stage Unlocking Calculation Logic
  const getStageStatus = (stage: QuestStage, indexInSector: number, allStagesFlat: QuestStage[]) => {
    const isCleared = clearedStageIds.includes(stage.id) || (stageStarData[stage.id]?.stars || 0) > 0;
    const earnedStars = stageStarData[stage.id]?.stars || 0;

    if (stage.id === 'st_1_1') {
      return { isUnlocked: true, isCleared, earnedStars, lockReason: null };
    }

    const currentIndex = allStagesFlat.findIndex(s => s.id === stage.id);
    const prevStage = currentIndex > 0 ? allStagesFlat[currentIndex - 1] : null;

    const prevStageCleared = prevStage ? (clearedStageIds.includes(prevStage.id) || (stageStarData[prevStage.id]?.stars || 0) > 0) : true;
    const starRequirementMet = totalEarnedStars >= stage.requiredPrevStars;

    const isUnlocked = prevStageCleared && starRequirementMet;

    let lockReason = null;
    if (!isUnlocked) {
      if (!prevStageCleared) {
        lockReason = `Clear Stage ${prevStage?.stageNumber} (${prevStage?.name}) first`;
      } else if (!starRequirementMet) {
        lockReason = `Requires ${stage.requiredPrevStars} Total Stars (You have ${totalEarnedStars}★)`;
      }
    }

    return { isUnlocked, isCleared, earnedStars, lockReason };
  };

  // Purchase Chest
  const handleBuyChest = (tier: 'bronze' | 'gold' | 'legendary') => {
    let cost = 50;
    if (tier === 'gold') cost = 150;
    else if (tier === 'legendary') cost = 400;

    if (userStars < cost) {
      toast({
        title: "Treasury Empty!",
        description: `You need ${cost} Tickets to buy this chest. Play Quest stages to earn Tickets!`,
        variant: "destructive"
      });
      return;
    }

    setSelectedBoxTier(tier);
    setOpenerOpen(true);
  };

  // Launch Stage Quest
  const handleLaunchQuest = async (stage: QuestStage) => {
    if (stage.entryCost > 0 && userStars < stage.entryCost) {
      toast({
        title: "Entry Denied!",
        description: `Embarking on this stage costs ${stage.entryCost} Tickets. Earn more Tickets first.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setSelectedPrepStage(null);

    try {
      if (stage.entryCost > 0) {
        await updateTotalStars(-stage.entryCost, userId || undefined);
        setUserStars(prev => Math.max(0, prev - stage.entryCost));
      }

      const q = await fetchQuizQuestions();
      const shuffled = [...q].sort(() => 0.5 - Math.random()).slice(0, 5); // 5 questions per stage
      
      setQuestQuestions(shuffled);
      setActiveStage(stage);
      setCurrentQIndex(0);
      setScore(0);
      setGameplayStatus('playing');
      setFeedbackMsg(`Stage ${stage.stageNumber}: ${stage.name} - Battle Initiated!`);
      
      // Reset Lifelines
      setSocratesUsed(false);
      setAryabhataUsed(false);
      setChanakyaUsed(false);
      setRamanujanUsed(false);
      setEliminatedOptions([]);
      setSmartClue(null);
      setIsShieldActive(false);
      setRevealedCorrectAnswer(null);
      setRevealedExplanation(null);

      startTimer(stage);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error Loading Stage",
        description: "Could not fetch quiz questions. Please check connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (stage: QuestStage) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let startVal = 15;
    if (stage.rules.toLowerCase().includes('12s')) startVal = 12;
    if (stage.rules.toLowerCase().includes('10s')) startVal = 10;
    if (stage.rules.toLowerCase().includes('8s')) startVal = 8;
    setTimer(startVal);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeOut = () => {
    haptics('warning');
    setHasAnswered(true);
    setIsCorrect(false);
    setFeedbackMsg("⏳ Time expired!");
    
    if (activeStage?.rules.toLowerCase().includes('sudden death')) {
      setTimeout(() => {
        endQuest(false, score);
      }, 1500);
    }
  };

  // Hero Lifeline Handlers
  const handleUseSocrates = async () => {
    const soc = heroes.find(h => h.id === 'socrates');
    if (!soc || soc.level === 0) {
      toast({ title: "Hero Locked", description: "Unlock Socrates from chests first!", variant: "destructive" });
      return;
    }
    if (socratesUsed) return;
    if (userStars < soc.starCost) {
      toast({ title: "No Tickets", description: "Not enough Tickets for Socrates lifeline.", variant: "destructive" });
      return;
    }

    haptics('medium');
    await updateTotalStars(-soc.starCost, userId || undefined);
    setUserStars(prev => Math.max(0, prev - soc.starCost));
    setSocratesUsed(true);

    const question = questQuestions[currentQIndex];
    const wrongAnswers = question.options.filter(o => o !== question.correctAnswer);
    const shuffledWrong = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 2);
    setEliminatedOptions(shuffledWrong);

    toast({
      title: "Socrates' Wisdom",
      description: "Two incorrect options eliminated from the scroll.",
    });
  };

  const handleUseAryabhata = async () => {
    const ary = heroes.find(h => h.id === 'aryabhata');
    if (!ary || ary.level === 0) {
      toast({ title: "Hero Locked", description: "Unlock Aryabhata from chests first!", variant: "destructive" });
      return;
    }
    if (aryabhataUsed) return;
    if (userStars < ary.starCost) {
      toast({ title: "No Tickets", description: "Not enough Tickets.", variant: "destructive" });
      return;
    }

    haptics('medium');
    await updateTotalStars(-ary.starCost, userId || undefined);
    setUserStars(prev => Math.max(0, prev - ary.starCost));
    setAryabhataUsed(true);

    setTimer(prev => prev + 15);
    toast({
      title: "Astronomical Shift",
      description: "Aryabhata added +15 seconds to your timer!",
    });
  };

  const handleUseChanakya = async () => {
    const chan = heroes.find(h => h.id === 'chanakya');
    if (!chan || chan.level === 0) {
      toast({ title: "Hero Locked", description: "Unlock Chanakya first!", variant: "destructive" });
      return;
    }
    if (chanakyaUsed) return;
    if (userStars < chan.starCost) {
      toast({ title: "No Tickets", description: "Not enough Tickets.", variant: "destructive" });
      return;
    }

    haptics('medium');
    await updateTotalStars(-chan.starCost, userId || undefined);
    setUserStars(prev => Math.max(0, prev - chan.starCost));
    setChanakyaUsed(true);
    setIsShieldActive(true);

    toast({
      title: "Chanakya's Diplomacy",
      description: "Imperial Shield active! Next incorrect answer will be blockaded.",
    });
  };

  const handleUseRamanujan = async () => {
    const ram = heroes.find(h => h.id === 'ramanujan');
    if (!ram || ram.level === 0) {
      toast({ title: "Hero Locked", description: "Unlock Ramanujan first!", variant: "destructive" });
      return;
    }
    if (ramanujanUsed) return;
    if (userStars < ram.starCost) {
      toast({ title: "No Tickets", description: "Not enough Tickets.", variant: "destructive" });
      return;
    }

    haptics('medium');
    await updateTotalStars(-ram.starCost, userId || undefined);
    setUserStars(prev => Math.max(0, prev - ram.starCost));
    setRamanujanUsed(true);

    const question = questQuestions[currentQIndex];
    setSmartClue(`Mathematical Hint: "${question.correctAnswer}". ${question.explanation || 'Analyzed via Ramanujan logic.'}`);

    toast({
      title: "Ramanujan's Equation",
      description: "The mathematical truth has been revealed!",
    });
  };

  const handleSelectAnswer = async (option: string) => {
    if (hasAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(option);
    setHasAnswered(true);

    const currentQuestion = questQuestions[currentQIndex];
    
    let checkCorrect = false;
    let correctAns = '';
    let expl = '';
    try {
      const { data, error } = await supabase.functions.invoke('validate-quiz-answer', {
        body: { question_id: currentQuestion.id, selected_answer: option }
      });
      if (!error && data) {
        checkCorrect = !!data.is_correct;
        correctAns = data.correct_answer || '';
        expl = data.explanation || '';
      } else {
        correctAns = currentQuestion.correctAnswer || '';
        expl = currentQuestion.explanation || '';
        checkCorrect = option.toLowerCase().trim() === correctAns.toLowerCase().trim();
      }
    } catch (err) {
      correctAns = currentQuestion.correctAnswer || '';
      expl = currentQuestion.explanation || '';
      checkCorrect = option.toLowerCase().trim() === correctAns.toLowerCase().trim();
    }

    setRevealedCorrectAnswer(correctAns);
    setRevealedExplanation(expl);
    setIsCorrect(checkCorrect);

    if (checkCorrect) {
      haptics('success');
      audioManager.playSFX('victory_laughter');
      setScore(prev => prev + 1);
      setFeedbackMsg("⚔️ Excellent! Direct strike!");
    } else {
      if (isShieldActive) {
        haptics('success');
        setIsShieldActive(false);
        setIsCorrect(true);
        setFeedbackMsg("🛡️ Chanakya Shield Absorbed! You survived the strike.");
        toast({ title: "Shield Absorbed", description: "Your streak was saved by Chanakya's diplomacy!" });
      } else {
        haptics('error');
        audioManager.playSFX('royal_sadness');
        setFeedbackMsg(`❌ Incorrect! Correct answer: ${correctAns}`);
        
        if (activeStage?.rules.toLowerCase().includes('sudden death')) {
          setTimeout(() => {
            endQuest(false, score);
          }, 1800);
          return;
        }
      }
    }
  };

  const handleNextQuestion = () => {
    setHasAnswered(false);
    setSelectedOption(null);
    setEliminatedOptions([]);
    setSmartClue(null);
    setRevealedCorrectAnswer(null);
    setRevealedExplanation(null);

    const nextIndex = currentQIndex + 1;
    if (nextIndex < questQuestions.length) {
      setCurrentQIndex(nextIndex);
      startTimer(activeStage!);
      setFeedbackMsg(`Question ${nextIndex + 1}/${questQuestions.length}`);
    } else {
      const finalScore = score + (isCorrect ? 0 : 0);
      const passed = finalScore >= 3;
      endQuest(passed, finalScore);
    }
  };

  const endQuest = async (passed: boolean, finalScore: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameplayStatus('ended');

    if (passed && activeStage) {
      haptics('success');
      window.dispatchEvent(new CustomEvent('baronTaskAction', { detail: { type: 'quests' } }));
      confetti({ particleCount: 100, spread: 70 });
      
      let earnedStars = 1;
      if (finalScore >= 5) earnedStars = 3;
      else if (finalScore >= 4) earnedStars = 2;

      let ticketReward = 20 + earnedStars * 10;
      if (activeStage.difficulty === 'Hard') ticketReward += 15;
      if (activeStage.difficulty === 'Legendary') ticketReward += 30;

      await logStarsEarned(ticketReward, userId || undefined);
      setUserStars(prev => prev + ticketReward);

      const updatedCleared = [...clearedStageIds];
      if (!updatedCleared.includes(activeStage.id)) {
        updatedCleared.push(activeStage.id);
        setClearedStageIds(updatedCleared);
        localStorage.setItem('cleared_stations', updatedCleared.join(','));
      }

      const updatedStageStars = {
        ...stageStarData,
        [activeStage.id]: {
          stars: Math.max(stageStarData[activeStage.id]?.stars || 0, earnedStars),
          maxScore: Math.max(stageStarData[activeStage.id]?.maxScore || 0, finalScore)
        }
      };
      setStageStarData(updatedStageStars);
      localStorage.setItem('quest_stage_stars', JSON.stringify(updatedStageStars));

      setSelectedBoxTier(activeStage.rewardType);
      setOpenerOpen(true);

      // Trigger App Notification
      addNotification(
        'quest_unlock',
        `✨ ${activeStage.name} Conquered!`,
        `Achieved ${earnedStars}-Star rating (Score ${finalScore}/5) and earned +${ticketReward} Tickets!`,
        '/empire-quests',
        '🏰'
      );

      toast({
        title: `✨ ${activeStage.name} CONQUERED!`,
        description: `Achieved ${earnedStars} Star Rating (Score ${finalScore}/5)! Earned ${ticketReward} Tickets.`,
      });
    } else {
      haptics('error');
      toast({
        title: "Trial Failed",
        description: "You need at least 3 correct answers (or 60%) to pass this level. Try again!",
        variant: "destructive"
      });
    }
  };

  const exitGameplay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameplayStatus('idle');
    setActiveStage(null);
    setQuestQuestions([]);
    setRevealedCorrectAnswer(null);
    setRevealedExplanation(null);
    fetchUserData();

    // Trigger interstitial ad between quest trials
    setAdSeed((s) => s + 1);
    setInterstitialOpen(true);
  };

  const currentSector = QUEST_SECTORS.find(s => s.id === activeSectorId) || QUEST_SECTORS[0];

  return (
    <PageLayout>
      <div className="min-h-screen stone-wall text-foreground pb-16">
        
        {/* REDESIGNED IMPERIAL HEADER & BATTLE COUNCIL BAR */}
        <div className="bg-slate-950/95 border-b border-amber-500/30 py-4 px-4 md:px-6 relative z-30 shadow-2xl backdrop-blur-md">
          <div className="max-w-6xl mx-auto space-y-4">
            
            {/* Top Bar: Title & Currencies */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-inner">
                  <Landmark className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-base md:text-lg font-black tracking-tight text-white uppercase font-serif">Empire Quest Board</h1>
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Conquest Campaign & Council Chambers</p>
                </div>
              </div>

              {/* Currency Stat Badges */}
              <div className="flex gap-2.5 items-center">
                <div className="bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-inner">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  <div>
                    <span className="text-[8px] font-extrabold text-slate-400 block uppercase leading-none">Total Stars</span>
                    <span className="text-xs font-black text-amber-400">{totalEarnedStars} ★</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-yellow-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-inner">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <div>
                    <span className="text-[8px] font-extrabold text-slate-400 block uppercase leading-none">Tickets</span>
                    <span className="text-xs font-black text-yellow-400">{userStars}</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-cyan-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-inner">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-[8px] font-extrabold text-slate-400 block uppercase leading-none">Gems</span>
                    <span className="text-xs font-black text-cyan-300">{userGems}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE BATTLE COUNCIL BAR */}
            <div className="bg-slate-900/90 border border-amber-500/25 p-3 rounded-2xl shadow-inner">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  Battle Council
                  <span className="text-[9px] text-slate-400 font-bold ml-1 hidden sm:inline">(Tap counselor to view powers & recruit)</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {heroes.map((hero) => (
                  <button
                    key={hero.id}
                    onClick={() => {
                      haptics('light');
                      setSelectedCouncilHero(hero);
                    }}
                    className="bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/60 p-2 rounded-xl text-left flex items-center gap-2 transition-all group active:scale-95"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{hero.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-white truncate">{hero.name.replace('King ', '')}</span>
                        <span className="text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/30">Lvl {hero.level}</span>
                      </div>
                      <span className="text-[9px] text-amber-300/80 truncate block font-medium">{hero.abilityName}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading && gameplayStatus === 'idle' ? (
          <div className="flex flex-col items-center justify-center p-24">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Consulting the Grand Scribes...</p>
          </div>
        ) : gameplayStatus === 'playing' ? (
          
          /* ACTIVE IMMERSIVE STAGE PLAY INTERFACE */
          <div className="max-w-4xl mx-auto px-4 mt-8">
            <div className="w-full bg-slate-950 border-4 border-amber-500/30 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden text-white">
              
              {isShieldActive && (
                <div className="absolute inset-0 border-4 border-indigo-500/40 pointer-events-none animate-pulse rounded-2xl" />
              )}

              {/* Progress and Timer header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                <Button variant="ghost" size="sm" onClick={exitGameplay} className="text-slate-400 hover:text-white hover:bg-slate-800 uppercase tracking-wider text-[10px] font-black">
                  🏳️ Retreat
                </Button>

                <div className="text-center">
                  <span className="text-xs font-black uppercase text-amber-400 tracking-widest block">
                    Stage {activeStage?.stageNumber}: {activeStage?.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Question {currentQIndex + 1} of {questQuestions.length}
                  </span>
                </div>

                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs border",
                  timer <= 3 ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-bounce" : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                )}>
                  <Timer className="w-3.5 h-3.5" />
                  <span>{timer}s</span>
                </div>
              </div>

              {/* Hero Lifeline Bar */}
              <div className="flex justify-center items-center gap-2 sm:gap-3 mb-6 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 overflow-x-auto">
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 mr-1 hidden sm:inline">Lifelines:</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={socratesUsed || hasAnswered}
                  onClick={handleUseSocrates}
                  className="bg-slate-950 border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs font-bold gap-1 rounded-xl"
                >
                  🏛️ Socrates 50/50
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={aryabhataUsed || hasAnswered}
                  onClick={handleUseAryabhata}
                  className="bg-slate-950 border-amber-500/30 hover:border-amber-400 text-amber-300 text-xs font-bold gap-1 rounded-xl"
                >
                  📐 +15s Time
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={chanakyaUsed || isShieldActive || hasAnswered}
                  onClick={handleUseChanakya}
                  className="bg-slate-950 border-purple-500/30 hover:border-purple-400 text-purple-300 text-xs font-bold gap-1 rounded-xl"
                >
                  🛡️ Shield
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={ramanujanUsed || hasAnswered}
                  onClick={handleUseRamanujan}
                  className="bg-slate-950 border-emerald-500/30 hover:border-emerald-400 text-emerald-300 text-xs font-bold gap-1 rounded-xl"
                >
                  ♾️ Clue
                </Button>
              </div>

              {/* Smart Clue Banner */}
              {smartClue && (
                <div className="bg-emerald-950/80 border border-emerald-500/30 p-3 rounded-2xl mb-6 text-xs text-emerald-200 font-medium">
                  {smartClue}
                </div>
              )}

              {/* Question Text Box */}
              {questQuestions[currentQIndex] && (
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-inner text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block mb-3">
                      {questQuestions[currentQIndex].category || activeStage?.category}
                    </span>
                    <h3 className="text-base md:text-lg font-extrabold text-white leading-relaxed">
                      {questQuestions[currentQIndex].question || (questQuestions[currentQIndex] as any).text}
                    </h3>
                  </div>

                  {/* Question Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {questQuestions[currentQIndex].options.map((opt, idx) => {
                      const isEliminated = eliminatedOptions.includes(opt);
                      const isSelected = selectedOption === opt;
                      const isOptionCorrect = revealedCorrectAnswer ? opt.toLowerCase().trim() === revealedCorrectAnswer.toLowerCase().trim() : false;

                      let btnStyle = "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800";
                      if (hasAnswered) {
                        if (isOptionCorrect) {
                          btnStyle = "bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/50";
                        } else if (isSelected) {
                          btnStyle = "bg-rose-600 text-white border-rose-400";
                        } else {
                          btnStyle = "bg-slate-900/50 text-slate-500 border-slate-800 opacity-50";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-amber-600 text-white border-amber-400";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={hasAnswered || isEliminated}
                          onClick={() => handleSelectAnswer(opt)}
                          className={cn(
                            "p-4 rounded-2xl border text-left text-sm font-bold transition-all flex items-center justify-between",
                            btnStyle,
                            isEliminated && "opacity-20 cursor-not-allowed line-through"
                          )}
                        >
                          <span>{opt}</span>
                          {hasAnswered && isOptionCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-200" />}
                          {hasAnswered && isSelected && !isOptionCorrect && <XCircle className="w-5 h-5 text-rose-200" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback and Explanation */}
                  {hasAnswered && (
                    <div className="space-y-4 pt-4 border-t border-slate-800 animate-in fade-in duration-300">
                      <div className={cn(
                        "p-4 rounded-2xl text-center text-xs font-black uppercase tracking-wider",
                        isCorrect ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30" : "bg-rose-950/80 text-rose-300 border border-rose-500/30"
                      )}>
                        {feedbackMsg}
                      </div>

                      {revealedExplanation && (
                        <p className="text-xs text-slate-400 bg-slate-900 p-4 rounded-2xl border border-slate-800 leading-relaxed">
                          💡 <span className="font-bold text-amber-400">Explanation:</span> {revealedExplanation}
                        </p>
                      )}

                      <Button
                        onClick={handleNextQuestion}
                        className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm btn-3d btn-3d-primary gap-2"
                      >
                        {currentQIndex < questQuestions.length - 1 ? 'Next Question →' : 'Complete Stage'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MAIN QUEST BOARD VIEW */
          <div className="max-w-6xl mx-auto px-4 mt-6">
            
            {/* REDESIGNED COMPACT NAVIGATION TABS - NO SCROLLBAR, FULL FIT ON MOBILE */}
            <div className="flex justify-center mb-6 px-1">
              <div className="bg-slate-950 border border-amber-500/20 p-1 md:p-1.5 rounded-2xl flex gap-1 shadow-lg w-full sm:w-auto overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setActiveTab('quests')}
                  className={cn(
                    "px-2.5 sm:px-4 md:px-6 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial",
                    activeTab === 'quests' ? "btn-3d btn-3d-primary text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Quest Board</span>
                  <span className="sm:hidden">Board</span>
                </button>
                <button
                  onClick={() => setActiveTab('hangman')}
                  className={cn(
                    "px-2.5 sm:px-4 md:px-6 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial",
                    activeTab === 'hangman' ? "btn-3d btn-3d-primary text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  <span>🎯</span>
                  <span className="hidden sm:inline">Word Duel</span>
                  <span className="sm:hidden">Duel</span>
                </button>
                <button
                  onClick={() => setActiveTab('chests')}
                  className={cn(
                    "px-2.5 sm:px-4 md:px-6 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial",
                    activeTab === 'chests' ? "btn-3d btn-3d-primary text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  <span>📦</span>
                  <span className="hidden sm:inline">Treasury Shop</span>
                  <span className="sm:hidden">Shop</span>
                </button>
                <button
                  onClick={() => setActiveTab('heroes')}
                  className={cn(
                    "px-2.5 sm:px-4 md:px-6 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial",
                    activeTab === 'heroes' ? "btn-3d btn-3d-primary text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  <span>🏛️</span>
                  <span className="hidden sm:inline">Intellectual Counsel</span>
                  <span className="sm:hidden">Counsel</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: QUEST BOARD */}
            {activeTab === 'quests' && (
              <div className="space-y-6">
                
                {/* SECTOR SELECTOR TABS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {QUEST_SECTORS.map((sector) => {
                    const isActive = sector.id === activeSectorId;
                    const sectorEarnedStars = sector.stages.reduce((acc, st) => acc + (stageStarData[st.id]?.stars || 0), 0);
                    const sectorMaxStars = sector.stages.length * 3;

                    return (
                      <button
                        key={sector.id}
                        onClick={() => {
                          haptics('light');
                          setActiveSectorId(sector.id);
                        }}
                        className={cn(
                          "quest-sector-tab p-3.5 rounded-2xl text-left border flex flex-col justify-between relative overflow-hidden",
                          isActive
                            ? "active bg-amber-600/90 text-white border-amber-300 shadow-lg ring-2 ring-amber-400/40"
                            : "bg-slate-950/80 text-slate-300 border-slate-800 hover:border-amber-500/40"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xl">{sector.badgeEmoji}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/40 text-amber-300">
                            {sectorEarnedStars}/{sectorMaxStars} ★
                          </span>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs tracking-tight text-white leading-tight">
                            {sector.title}
                          </h4>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* ACTIVE SECTOR HEADER BANNER & MILESTONE BAR */}
                <div className="quest-board-container p-6 text-white relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-6 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-3xl">{currentSector.badgeEmoji}</span>
                        <h2 className="text-2xl font-black uppercase tracking-widest text-amber-400 font-serif">
                          {currentSector.title}
                        </h2>
                      </div>
                      <p className="text-xs font-medium text-slate-300 max-w-xl">
                        {currentSector.subtitle}
                      </p>
                    </div>

                    {/* Sector Star Milestone Chests */}
                    <div className="bg-slate-950/80 border border-amber-500/30 p-4 rounded-2xl flex flex-col justify-center gap-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-amber-400 gap-4">
                        <span>Sector Milestone Rewards</span>
                        <span>{currentSector.stages.reduce((acc, st) => acc + (stageStarData[st.id]?.stars || 0), 0)} Stars Earned</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {currentSector.milestones.map((m, idx) => {
                          const currentStars = currentSector.stages.reduce((acc, st) => acc + (stageStarData[st.id]?.stars || 0), 0);
                          const isUnlocked = currentStars >= m.starsRequired;

                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (isUnlocked) {
                                  setSelectedBoxTier(m.rewardType);
                                  setOpenerOpen(true);
                                } else {
                                  toast({
                                    title: "Milestone Locked",
                                    description: `Earn ${m.starsRequired} stars in ${currentSector.title} to unlock ${m.label}.`,
                                  });
                                }
                              }}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all",
                                isUnlocked 
                                  ? "bg-amber-500/20 border-amber-400 text-amber-300 hover:bg-amber-500/30 animate-pulse" 
                                  : "bg-slate-900 border-slate-800 text-slate-500 opacity-60"
                              )}
                            >
                              <span>{m.rewardType === 'bronze' ? '📦' : m.rewardType === 'gold' ? '🏆' : '👑'}</span>
                              <span>{m.starsRequired}★ {m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* QUEST BOARD STAGE GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                    {currentSector.stages.map((stage, idx) => {
                      const { isUnlocked, isCleared, earnedStars, lockReason } = getStageStatus(stage, idx, ALL_STAGES_FLAT);

                      return (
                        <div
                          key={stage.id}
                          onClick={() => {
                            haptics('light');
                            if (isUnlocked) {
                              setSelectedPrepStage(stage);
                            } else {
                              toast({
                                title: "🔒 Stage Locked",
                                description: lockReason || "Clear previous stages to unlock.",
                                variant: "destructive"
                              });
                            }
                          }}
                          className={cn(
                            "quest-node-card rounded-2xl p-5 border relative flex flex-col justify-between cursor-pointer select-none",
                            isCleared && "cleared",
                            isUnlocked && !isCleared && "active-unlocked bg-slate-900/90 text-white border-amber-500",
                            !isUnlocked && "locked"
                          )}
                        >
                          {/* Top Card Bar */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-sm">
                                {stage.stageNumber}
                              </span>
                              <span className="text-2xl">{stage.emoji}</span>
                            </div>

                            {/* Status & Star Rating Badges */}
                            <div>
                              {isCleared ? (
                                <div className="flex items-center gap-1 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-400/40 text-amber-300 text-xs font-black">
                                  <span>{'★'.repeat(earnedStars)}{'☆'.repeat(3 - earnedStars)}</span>
                                </div>
                              ) : isUnlocked ? (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full animate-pulse">
                                  UNLOCKED
                                </span>
                              ) : (
                                <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
                                  <Lock className="w-3 h-3 text-slate-400" /> LOCKED
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stage Title and Details */}
                          <div className="space-y-1 mb-4">
                            <h3 className="font-black text-base text-white tracking-tight leading-snug">
                              {stage.name}
                            </h3>
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                              {stage.description}
                            </p>
                          </div>

                          {/* Card Footer */}
                          <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                              stage.difficulty === 'Easy' ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                              stage.difficulty === 'Medium' ? "bg-amber-950 text-amber-300 border border-amber-800" :
                              stage.difficulty === 'Hard' ? "bg-rose-950 text-rose-300 border border-rose-800" :
                              "bg-purple-950 text-purple-300 border border-purple-800"
                            )}>
                              {stage.difficulty}
                            </span>

                            <div className="flex items-center gap-1 text-slate-300 font-bold text-xs">
                              {isUnlocked ? (
                                <span className="text-amber-400 flex items-center gap-1 font-black">
                                  {isCleared ? 'Replay' : 'Play'} <ChevronRight className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px] font-bold">
                                  Req {stage.requiredPrevStars}★
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: HANGMAN */}
            {activeTab === 'hangman' && (
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="text-center max-w-md mx-auto">
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 font-black uppercase tracking-widest">
                      Featured Tavern Game
                    </span>
                    <h2 className="text-lg font-black uppercase tracking-widest text-white mt-2">Word Guessing Duel</h2>
                    <p className="text-xs text-slate-400 mt-1">Defeat the hangman to claim raw gems and unlock key campaign tokens.</p>
                  </div>
                  <DailyHangman userId={userId} onRefreshBalances={fetchUserData} />
                </div>

                <hr className="border-slate-800" />

                <div className="space-y-6">
                  <div className="text-center max-w-md mx-auto">
                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-400">Tavern Mini-Games</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Try your luck or test your swift reflexes to gain coins & resources.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {minigames.map((game) => (
                      <MiniGameCard
                        key={game.id}
                        id={game.id}
                        name={game.name}
                        description={game.description}
                        emoji={game.emoji}
                        gradient={game.gradient}
                        playCount={game.playCount}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CHESTS */}
            {activeTab === 'chests' && (
              <div className="space-y-6">
                <div className="text-center max-w-md mx-auto mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-widest text-amber-400">Empire Treasury Shop</h2>
                  <p className="text-sm font-bold text-slate-400 mt-1">Exchange your gathered Tickets to purchase mystery reward vaults.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Bronze Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-md relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-700 to-amber-500 flex items-center justify-center text-5xl mb-4 shadow-inner border border-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                      📦
                    </div>
                    <h3 className="font-black text-white text-lg tracking-tight mb-1">Bronze Chest</h3>
                    <p className="text-slate-400 font-medium text-xs leading-relaxed mb-6 max-w-[200px]">
                      Contains minor Gems & Tickets. Socrates/Aryabhata shards.
                    </p>
                    <Button 
                      onClick={() => handleBuyChest('bronze')}
                      className="w-full btn-3d bg-slate-900 border border-amber-500/30 text-amber-300 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800"
                    >
                      50 Tickets
                    </Button>
                  </div>

                  {/* Gold Card */}
                  <div className="bg-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-lg relative group">
                    <span className="absolute -top-3 bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                      Highly Popular
                    </span>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-600 via-amber-500 to-yellow-500 flex items-center justify-center text-5xl mb-4 shadow-inner border border-yellow-400/20 group-hover:scale-105 transition-transform duration-300">
                      🏆
                    </div>
                    <h3 className="font-black text-white text-lg tracking-tight mb-1">Golden Vault</h3>
                    <p className="text-slate-400 font-medium text-xs leading-relaxed mb-6 max-w-[200px]">
                      Excellent value. Medium gems, Tickets. High chance of Chanakya shards.
                    </p>
                    <Button 
                      onClick={() => handleBuyChest('gold')}
                      className="w-full btn-3d btn-3d-primary font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-widest"
                    >
                      150 Tickets
                    </Button>
                  </div>

                  {/* Legendary Card */}
                  <div className="bg-slate-950 border border-purple-500/40 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-md relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-800 via-indigo-600 to-purple-600 flex items-center justify-center text-5xl mb-4 shadow-inner border border-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                      👑
                    </div>
                    <h3 className="font-black text-white text-lg tracking-tight mb-1">Emperor's Tomb</h3>
                    <p className="text-slate-400 font-medium text-xs leading-relaxed mb-6 max-w-[200px]">
                      Legendary drops. Major Gems & Tickets. High shards count for any hero.
                    </p>
                    <Button 
                      onClick={() => handleBuyChest('legendary')}
                      className="w-full btn-3d bg-slate-900 border border-purple-500/40 text-purple-300 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-purple-950"
                    >
                      400 Tickets
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: HEROES */}
            {activeTab === 'heroes' && (
              <div className="space-y-6">
                <div className="text-center max-w-md mx-auto mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-widest text-amber-400">Intellectual Counsel</h2>
                  <p className="text-sm font-bold text-slate-400 mt-1">Unlock and upgrade historical counselors. Leveling up boosts their lifeline powers.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {heroes.map((hero) => (
                    <HeroDashboardCard
                      key={hero.id}
                      hero={hero}
                      userId={userId}
                      onRefresh={fetchUserData}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* COUNCIL HERO INSPECTION & RECRUITMENT MODAL */}
      {selectedCouncilHero && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="bg-slate-950 border-2 border-amber-500/40 rounded-3xl p-5 md:p-6 max-w-md w-full text-white shadow-2xl relative space-y-4 my-auto"
            >
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedCouncilHero.emoji}</span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      Level {selectedCouncilHero.level} Counselor
                    </span>
                    <h3 className="text-lg font-black text-white tracking-tight mt-1">
                      {selectedCouncilHero.name}
                    </h3>
                    <p className="text-xs text-amber-300 font-medium">{selectedCouncilHero.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCouncilHero(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs md:text-sm">
                <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Special Battle Lifeline</span>
                  <span className="font-bold text-white text-sm block">{selectedCouncilHero.abilityName}</span>
                  <p className="text-slate-300 text-xs leading-relaxed">{selectedCouncilHero.abilityDesc}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[9px] font-black text-slate-400 uppercase block">Battle Cost</span>
                    <span className="font-bold text-yellow-400">{selectedCouncilHero.starCost} Tickets / Use</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[9px] font-black text-slate-400 uppercase block">Hero Shards</span>
                    <span className="font-bold text-cyan-300">{selectedCouncilHero.shards} / 20 Shards</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedCouncilHero(null);
                    setActiveTab('heroes');
                  }}
                  className="w-full py-3 rounded-xl font-black uppercase text-xs btn-3d btn-3d-primary tracking-wider"
                >
                  Manage Counselors in Hall →
                </Button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* STAGE PREPARATION MODAL / DRAWER */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedPrepStage && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                className="bg-slate-950 border-2 border-amber-500/40 rounded-3xl p-5 md:p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto text-white shadow-2xl relative space-y-4 custom-scrollbar my-auto"
              >
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl md:text-4xl">{selectedPrepStage.emoji}</span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                        Stage {selectedPrepStage.stageNumber} • {selectedPrepStage.category}
                      </span>
                      <h3 className="text-lg md:text-xl font-black text-white tracking-tight mt-1">
                        {selectedPrepStage.name}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPrepStage(null)}
                    className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3.5 text-sm">
                  <p className="text-slate-300 leading-relaxed bg-slate-900 p-3.5 rounded-2xl border border-slate-800 text-xs md:text-sm">
                    "{selectedPrepStage.description}"
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Ruleset</span>
                      <span className="text-xs font-bold text-amber-300">{selectedPrepStage.rules}</span>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                      <span className="text-[9px] font-black text-slate-400 block uppercase font-mono">Entry Cost</span>
                      <span className="text-xs font-bold text-yellow-400">
                        {selectedPrepStage.entryCost > 0 ? `${selectedPrepStage.entryCost} Tickets` : 'FREE'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-black text-amber-400 block uppercase tracking-widest">Star Rating Targets</span>
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>★★★ (3 Stars)</span>
                      <span className="text-amber-400">5/5 Score (100%)</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>★★☆ (2 Stars)</span>
                      <span className="text-amber-400">4/5 Score (80%)</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>★☆☆ (1 Star)</span>
                      <span className="text-amber-400">3/5 Score (60%)</span>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-slate-950/95 pt-3 pb-1 border-t border-slate-800/80 backdrop-blur-sm z-10 flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedPrepStage(null)}
                    className="w-1/3 py-3 rounded-xl font-bold uppercase text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleLaunchQuest(selectedPrepStage)}
                    className="w-2/3 py-3 rounded-xl font-black uppercase text-xs btn-3d btn-3d-primary tracking-wider"
                  >
                    Embark Quest →
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MYSTERY BOX REVEAL ANIMATOR SYSTEM */}
      <MysteryBoxOpener
        isOpen={openerOpen}
        onClose={() => {
          setOpenerOpen(false);
          setSelectedBoxTier(null);
          fetchUserData();
        }}
        boxTier={selectedBoxTier}
        userId={userId}
        onSuccess={fetchUserData}
      />

      {/* BANNER AD PLACEMENT */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-auto">
        <TopBannerAd />
      </div>

      {/* INTERSTITIAL AD OVERLAY */}
      <InterstitialAd
        open={interstitialOpen}
        onClose={() => setInterstitialOpen(false)}
        seed={adSeed}
      />
    </PageLayout>
  );
}
