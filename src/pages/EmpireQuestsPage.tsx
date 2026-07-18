import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
import { updateTotalStars, logStarsEarned, updateTotalGems } from '@/utils/rewardService';
import { 
  Shield, Star, Sparkles, Coins, Swords, Landmark, MapPin, 
  HelpCircle, Timer, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioManager } from '@/utils/audioManager';
import { cn } from '@/lib/utils';

// Static Campaign Definitions
interface RailwayRoute {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Legendary';
  category: string;
  rules: string;
  entryCost: number;
  rewardType: 'bronze' | 'gold' | 'legendary';
  rewardLabel: string;
  emoji: string;
}

const ROUTES: RailwayRoute[] = [
  {
    id: 'st_mumbai',
    name: "Mumbai Central",
    description: "The journey begins! A bustling metropolis. Answer questions rapidly to catch the express train.",
    difficulty: "Easy",
    category: "General",
    rules: "Time Attack: 6 seconds per question",
    entryCost: 0,
    rewardType: "bronze",
    rewardLabel: "Bronze Chest",
    emoji: "🚂"
  },
  {
    id: 'st_london',
    name: "London King's Cross",
    description: "Navigate the underground riddles. Lifelines are disabled on this historic platform.",
    difficulty: "Medium",
    category: "Riddles",
    rules: "No lifelines permitted",
    entryCost: 20,
    rewardType: "bronze",
    rewardLabel: "Bronze Chest + 30 Tickets",
    emoji: "🎫"
  },
  {
    id: 'st_jaipur',
    name: "Jaipur Junction",
    description: "The Pink City awaits. Prove your scientific knowledge to unlock the palace gates.",
    difficulty: "Legendary",
    category: "Science",
    rules: "Advanced content, double shard drop chance",
    entryCost: 40,
    rewardType: "legendary",
    rewardLabel: "Emperor's Tomb",
    emoji: "🔬"
  },
  {
    id: 'st_grandcentral',
    name: "Grand Central Terminal",
    description: "The heart of New York. Make no mistakes to cross this iconic station.",
    difficulty: "Hard",
    category: "History",
    rules: "Sudden Death: 1 wrong answer defeats you",
    entryCost: 60,
    rewardType: "gold",
    rewardLabel: "Golden Vault",
    emoji: "🏛️"
  },
  {
    id: 'st_chennai',
    name: "Chennai Egmore",
    description: "Southern express route. Navigate the mythological tales of ancient India.",
    difficulty: "Medium",
    category: "Mythology",
    rules: "Express Mode: Half time limit",
    entryCost: 80,
    rewardType: "gold",
    rewardLabel: "Golden Vault",
    emoji: "🕌"
  },
  {
    id: 'st_garedunord',
    name: "Gare du Nord",
    description: "Eurostar challenge! A challenging geography route across the continent.",
    difficulty: "Medium",
    category: "Geography",
    rules: "Turbulence Mode: Question text shakes occasionally",
    entryCost: 100,
    rewardType: "bronze",
    rewardLabel: "Bronze Chest + 40 Tickets",
    emoji: "🌍"
  },
  {
    id: 'st_howrah',
    name: "Howrah Junction",
    description: "Cross the great bridge and defend your ticket under heavy scrutiny.",
    difficulty: "Hard",
    category: "History",
    rules: "Ticket Check: Lose double tickets on defeat",
    entryCost: 120,
    rewardType: "gold",
    rewardLabel: "Golden Vault",
    emoji: "🌉"
  },
  {
    id: 'st_tokyo',
    name: "Tokyo Station",
    description: "The Shinkansen bullet train! Speed and precision are essential on this high-speed route.",
    difficulty: "Hard",
    category: "General",
    rules: "Bullet Train: Rapid question timer",
    entryCost: 140,
    rewardType: "gold",
    rewardLabel: "Golden Vault",
    emoji: "🚅"
  },
  {
    id: 'st_newdelhi',
    name: "New Delhi",
    description: "The capital junction. Solve the complex riddles of the old city streets.",
    difficulty: "Legendary",
    category: "Riddles",
    rules: "Capital Challenge: No advisor aid allowed",
    entryCost: 160,
    rewardType: "legendary",
    rewardLabel: "Emperor's Tomb",
    emoji: "🧩"
  },
  {
    id: 'st_zurich',
    name: "Zürich Hauptbahnhof",
    description: "A scenic alpine route. Enjoy the view but stay sharp on mythology.",
    difficulty: "Easy",
    category: "Mythology",
    rules: "Swiss Precision: Free first mistake",
    entryCost: 180,
    rewardType: "bronze",
    rewardLabel: "Bronze Chest + 60 Tickets",
    emoji: "⛰️"
  },
  {
    id: 'st_csmt',
    name: "Chhatrapati Shivaji Maharaj Terminus",
    description: "The ultimate terminus! Master the global railway network.",
    difficulty: "Legendary",
    category: "General",
    rules: "Station Master: Complete 15 perfect questions",
    entryCost: 200,
    rewardType: "legendary",
    rewardLabel: "Golden Locomotive Chest",
    emoji: "🚉"
  }
];



export default function EmpireQuestsPage() {
  const [activeTab, setActiveTab] = useState<'quests' | 'hangman' | 'chests' | 'heroes'>('quests');
  const [userId, setUserId] = useState<string | null>(null);
  const [userStars, setUserStars] = useState(0);
  const [userGems, setUserGems] = useState(0);
  const [heroes, setHeroes] = useState<HeroData[]>([]);
  const [loading, setLoading] = useState(true);

  // Mystery Box Opener state
  const [openerOpen, setOpenerOpen] = useState(false);
  const [selectedBoxTier, setSelectedBoxTier] = useState<'bronze' | 'gold' | 'legendary' | null>(null);

  // Active Gameplay state
  const [activeRoute, setActiveQuest] = useState<RailwayRoute | null>(null);
  const [selectedRoute, setSelectedMapQuest] = useState<RailwayRoute | null>(null);
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
  const [clearedStations, setCompletedRoutes] = useState<string[]>([]);

  // Railway map — fixed track/train, scrolling stations
  const railwayScrollRef = useRef<HTMLDivElement | null>(null);
  const [trainHidden, setTrainHidden] = useState(false);
  const RAILWAY_PAD_TOP = 150;
  const RAILWAY_STATION_H = 300;
  const RAILWAY_STOP_Y = 260; // y-pixel within the map viewport where the train "stops"
  const isProgrammaticScrollRef = useRef(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const haptics = useHaptics();

  const fetchUserData = async () => {
    try {
      // Load completed Routes from localStorage
      const localCompleted = localStorage.getItem('cleared_stations');
      const completedList = localCompleted ? localCompleted.split(',') : [];
      setCompletedRoutes(completedList);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // Guest local storage fallback
        const localGems = Number(localStorage.getItem('quiz_app_user_gems') || '100');
        const localStars = Number(localStorage.getItem('quiz_app_user_stars') || '50');
        setUserGems(localGems);
        setUserStars(localStars);

        const staticHeroes: HeroData[] = [
          {
            id: 'socrates',
            name: "King Socrates",
            emoji: "🏛️",
            gradient: "from-blue-600 to-cyan-500",
            title: "The Philosopher King",
            abilityName: "Philosophical 50/50",
            abilityDesc: "Uses Socratic questioning to eliminate two incorrect options from the question.",
            starCost: 15,
            level: Number(localStorage.getItem('hero_socrates_level') || '0'),
            shards: Number(localStorage.getItem('hero_socrates_shards') || '10'),
          },
          {
            id: 'aryabhata',
            name: "King Aryabhata",
            emoji: "📐",
            gradient: "from-yellow-600 to-amber-500",
            title: "The Astronomer King",
            abilityName: "Cosmic Time Freeze",
            abilityDesc: "Pauses the cosmic orbits, adding +15 seconds to the quiz timer.",
            starCost: 20,
            level: Number(localStorage.getItem('hero_aryabhata_level') || '0'),
            shards: Number(localStorage.getItem('hero_aryabhata_shards') || '0'),
          },
          {
            id: 'chanakya',
            name: "Emperor Chanakya",
            emoji: "📜",
            gradient: "from-red-650 to-orange-500",
            title: "The Strategist Emperor",
            abilityName: "Strategist's Shield",
            abilityDesc: "Protects your empire: prevents streak loss and penalty on an incorrect answer.",
            starCost: 25,
            level: Number(localStorage.getItem('hero_chanakya_level') || '0'),
            shards: Number(localStorage.getItem('hero_chanakya_shards') || '0'),
          },
          {
            id: 'ramanujan',
            name: "Prince Ramanujan",
            emoji: "🧠",
            gradient: "from-purple-700 to-pink-500",
            title: "The Prince of Numbers",
            abilityName: "Intuitive Equation",
            abilityDesc: "Applies raw genius to highlight the correct option and show its mathematical truth.",
            starCost: 35,
            level: Number(localStorage.getItem('hero_ramanujan_level') || '0'),
            shards: Number(localStorage.getItem('hero_ramanujan_shards') || '0'),
          }
        ];
        setHeroes(staticHeroes);
        setLoading(false);
        return;
      }
      setUserId(session.user.id);

      // Fetch points (gems) and Tickets
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('gems:points, Tickets')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        let currentGems = profile.gems || 0;
        let currentStars = profile.Tickets || 0;

        // Auto onboarding grant if user is completely empty
        if (currentGems === 0 && currentStars === 0) {
          currentGems = 50;
          currentStars = 20; // Enough to buy a bronze chest or launch Persia campaign
          await (supabase as any)
            .from('profiles')
            .update({ points: 50, Tickets: 20 })
            .eq('id', session.user.id);
          
          // Inject 10 Socrates shards so they can recruit him immediately
          await (supabase as any)
            .from('user_characters')
            .insert({
              user_id: session.user.id,
              character_id: 'socrates',
              level: 0,
              shards_collected: 10
            });
        }

        setUserGems(currentGems);
        setUserStars(currentStars);
        localStorage.setItem('quiz_app_user_gems', String(currentGems));
        localStorage.setItem('quiz_app_user_stars', String(currentStars));
      }

      // Fetch user characters
      const { data: chars } = await (supabase as any)
        .from('user_characters')
        .select('*')
        .eq('user_id', session.user.id);

      // Make sure they have socrates shards if it is empty
      const dbCharsMap = new Map<string, any>();
      chars?.forEach(c => {
        dbCharsMap.set(c.character_id, c);
      });
      if (chars?.length === 0) {
        dbCharsMap.set('socrates', { level: 0, shards_collected: 10 });
      }

      // Default static characters list
      const staticHeroes: HeroData[] = [
        {
          id: 'socrates',
          name: "King Socrates",
          emoji: "🏛️",
          gradient: "from-blue-600 to-cyan-500",
          title: "The Philosopher King",
          abilityName: "Philosophical 50/50",
          abilityDesc: "Uses Socratic questioning to eliminate two incorrect options from the question.",
          starCost: 15,
          level: dbCharsMap.get('socrates')?.level ?? 0,
          shards: dbCharsMap.get('socrates')?.shards_collected ?? 0,
        },
        {
          id: 'aryabhata',
          name: "King Aryabhata",
          emoji: "📐",
          gradient: "from-yellow-600 to-amber-500",
          title: "The Astronomer King",
          abilityName: "Cosmic Time Freeze",
          abilityDesc: "Pauses the cosmic orbits, adding +15 seconds to the quiz timer.",
          starCost: 20,
          level: dbCharsMap.get('aryabhata')?.level ?? 0,
          shards: dbCharsMap.get('aryabhata')?.shards_collected ?? 0,
        },
        {
          id: 'chanakya',
          name: "Emperor Chanakya",
          emoji: "📜",
          gradient: "from-red-650 to-orange-500",
          title: "The Strategist Emperor",
          abilityName: "Strategist's Shield",
          abilityDesc: "Protects your empire: prevents streak loss and penalty on an incorrect answer.",
          starCost: 25,
          level: dbCharsMap.get('chanakya')?.level ?? 0,
          shards: dbCharsMap.get('chanakya')?.shards_collected ?? 0,
        },
        {
          id: 'ramanujan',
          name: "Prince Ramanujan",
          emoji: "🧠",
          gradient: "from-purple-700 to-pink-500",
          title: "The Prince of Numbers",
          abilityName: "Intuitive Equation",
          abilityDesc: "Applies raw genius to highlight the correct option and show its mathematical truth.",
          starCost: 35,
          level: dbCharsMap.get('ramanujan')?.level ?? 0,
          shards: dbCharsMap.get('ramanujan')?.shards_collected ?? 0,
        }
      ];

      setHeroes(staticHeroes);
    } catch (err) {
      console.error("Error loading user characters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    const handleGemsUpdate = () => fetchUserData();
    window.addEventListener('gemsUpdated', handleGemsUpdate);
    window.addEventListener('starsUpdated', handleGemsUpdate);

    return () => {
      window.removeEventListener('gemsUpdated', handleGemsUpdate);
      window.removeEventListener('starsUpdated', handleGemsUpdate);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Purchase Chest using Tickets
  const handleBuyChest = (tier: 'bronze' | 'gold' | 'legendary') => {
    if (!userId) {
      toast({
        title: "Login required",
        description: "Please sign in to buy chests.",
        variant: "destructive"
      });
      return;
    }

    let cost = 0;
    if (tier === 'bronze') cost = 50;
    else if (tier === 'gold') cost = 150;
    else if (tier === 'legendary') cost = 400;

    if (userStars < cost) {
      toast({
        title: "Treasury Empty!",
        description: `You need ${cost} Tickets to buy this chest. Play Quests to earn Tickets!`,
        variant: "destructive"
      });
      return;
    }

    // Trigger purchase animation opener
    setSelectedBoxTier(tier);
    setOpenerOpen(true);
  };

  // Launch Campaign Station
  const handleLaunchQuest = async (Station: RailwayRoute) => {
    if (Station.entryCost > 0 && userStars < Station.entryCost) {
      toast({
        title: "Invasion Prevented!",
        description: `Embarking costs ${Station.entryCost} Tickets. Earn more Tickets first.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Deduct entry fee
      if (Station.entryCost > 0) {
        await updateTotalStars(-Station.entryCost, userId || undefined);
        if (!userId) {
          setUserStars(prev => prev - Station.entryCost);
        }
      }

      // Fetch questions
      const q = await fetchQuizQuestions();
      const shuffled = [...q].sort(() => 0.5 - Math.random()).slice(0, 5); // 5 questions for Station
      
      setQuestQuestions(shuffled);
      setActiveQuest(Station);
      setCurrentQIndex(0);
      setScore(0);
      setGameplayStatus('playing');
      setFeedbackMsg("The invasion begins! Solve the cards.");
      
      // Reset Hero parameters
      setSocratesUsed(false);
      setAryabhataUsed(false);
      setChanakyaUsed(false);
      setRamanujanUsed(false);
      setEliminatedOptions([]);
      setSmartClue(null);
      setIsShieldActive(false);
      setRevealedCorrectAnswer(null);
      setRevealedExplanation(null);

      startTimer(Station);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Could not establish server connection to load cards.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (Station: RailwayRoute) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const startVal = 15;
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
    setFeedbackMsg("⏳ Time has expired! Siege engines breached!");
    
    // Alexander campaign is Sudden Death: time out = failure
    if (activeRoute?.id === 'alexander_conquest') {
      setTimeout(() => {
        endQuest(false);
      }, 1500);
    }
  };

  // Use Socrates Lifeline (50/50)
  const handleUseSocrates = async () => {
    const soc = heroes.find(h => h.id === 'socrates');
    if (!soc || soc.level === 0) {
      toast({ title: "Hero Locked", description: "Unlock Socrates from chests first!", variant: "destructive" });
      return;
    }
    if (socratesUsed) return;
    if (userStars < soc.starCost) {
      toast({ title: "No Tickets", description: "Not enough Tickets to recruit lifeline.", variant: "destructive" });
      return;
    }

    haptics('medium');
    await updateTotalStars(-soc.starCost, userId);
    setSocratesUsed(true);

    const question = questQuestions[currentQIndex];
    // Find wrong answers
    const wrongAnswers = question.options.filter(o => o !== question.correctAnswer);
    // Randomly pick two to eliminate
    const shuffledWrong = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 2);
    setEliminatedOptions(shuffledWrong);

    toast({
      title: "Socrates' Wisdom",
      description: "Two illogical options eliminated from the scroll.",
    });
  };

  // Use Aryabhata Lifeline (Time Freeze)
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
    await updateTotalStars(-ary.starCost, userId);
    setAryabhataUsed(true);

    // Boost timer by 15 seconds
    setTimer(prev => prev + 15);
    toast({
      title: "Astronomical Shift",
      description: "Aryabhata aligned the Tickets to add +15 seconds!",
    });
  };

  // Use Chanakya Lifeline (Shield)
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
    await updateTotalStars(-chan.starCost, userId);
    setChanakyaUsed(true);
    setIsShieldActive(true);

    toast({
      title: "Chanakya's Diplomacy",
      description: "Imperial Shield active! Next incorrect answer will be blockaded.",
    });
  };

  // Use Ramanujan Lifeline (Smart Hint)
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
    await updateTotalStars(-ram.starCost, userId);
    setRamanujanUsed(true);

    const question = questQuestions[currentQIndex];
    setSmartClue(`The correct equation outcome is: "${question.correctAnswer}". Reason: ${question.explanation || 'It fits the logic.'}`);

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
    
    // Call server validator
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
        // Local fallback
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
      setFeedbackMsg("⚔️ Victory! Siege tower advanced.");
    } else {
      if (isShieldActive) {
        haptics('success');
        setIsShieldActive(false);
        setIsCorrect(true); // Treat as correct for game progression
        setFeedbackMsg("🛡️ Chanakya Shield Absorbed! You survived the strike.");
        toast({ title: "Shield Absorbed", description: "Your streak was saved by Chanakya's diplomacy!" });
      } else {
        haptics('error');
        audioManager.playSFX('royal_sadness');
        setFeedbackMsg(`❌ Defeat! Correct answer: ${correctAns}`);
        
        // Alexander campaign is Sudden Death: fail immediately
        if (activeRoute?.id === 'alexander_conquest') {
          setTimeout(() => {
            endQuest(false);
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
      startTimer(activeRoute!);
      setFeedbackMsg(`Question ${nextIndex + 1}/${questQuestions.length}`);
    } else {
      // Finished all questions!
      const minPass = activeRoute?.id === 'alexander_conquest' ? 5 : 3;
      const passed = score >= minPass;
      endQuest(passed);
    }
  };

  const endQuest = async (passed: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameplayStatus('ended');

    if (passed && activeRoute) {
      haptics('success');
      window.dispatchEvent(new CustomEvent('baronTaskAction', { detail: { type: 'quests' } }));
      confetti({ particleCount: 100, spread: 70 });
      
      // Earn Tickets
      let starReward = 20;
      if (activeRoute.id === 'persia_trial') starReward = 50;
      else if (activeRoute.id === 'alexander_conquest') starReward = 80;
      else if (activeRoute.id === 'gupta_library') starReward = 150;

      await logStarsEarned(starReward, userId);

      // Add to completed Routes
      const updatedCompleted = [...clearedStations];
      if (!updatedCompleted.includes(activeRoute.id)) {
        updatedCompleted.push(activeRoute.id);
        setCompletedRoutes(updatedCompleted);
        localStorage.setItem('cleared_stations', updatedCompleted.join(','));
      }

      // Award Chest
      try {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('scratch_cards, spin_tickets')
          .eq('id', userId)
          .single();

        // Save chest to open
        setSelectedBoxTier(activeRoute.rewardType);
        setOpenerOpen(true);
      } catch (err) {
        console.error(err);
      }

      toast({
        title: "✨ Station VICTORIOUS!",
        description: `Successfully completed ${activeRoute.name}! Earned ${starReward} Tickets and a ${activeRoute.rewardLabel}.`,
      });
    } else {
      haptics('error');
      toast({
        title: "Train Derailed",
        description: "Your army retreated. Upgrade your heroes and try again!",
        variant: "destructive"
      });
    }
  };

  const exitGameplay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameplayStatus('idle');
    setActiveQuest(null);
    setQuestQuestions([]);
    setRevealedCorrectAnswer(null);
    setRevealedExplanation(null);
    fetchUserData();
  };

  return (
    <PageLayout showNewsTicker={true}>
      <div className="min-h-screen stone-wall text-foreground pb-16">
        
        {/* TOP STATUS BAR - GEMS AND Tickets (Age of Empires design) */}
        <div className="wooden-door py-4 px-6 relative z-30 shadow-md">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Landmark className="w-6 h-6 text-yellow-500 fill-yellow-500/10" />
              <div>
                <h1 className="text-lg font-black tracking-tight text-white uppercase">Railway Journey</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">War Room & Council Chambers</p>
              </div>
            </div>

            {/* Balances Display */}
            <div className="flex gap-4">
              <div className="bg-slate-950 border border-amber-500/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500 fill-amber-500/10" />
                <div>
                  <span className="text-[9px] font-bold text-slate-500 block uppercase leading-none">Gems</span>
                  <span className="text-xs font-black text-amber-500">{userGems}</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-yellow-500/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500/10 animate-pulse" />
                <div>
                  <span className="text-[9px] font-bold text-slate-500 block uppercase leading-none">Tickets</span>
                  <span className="text-xs font-black text-yellow-400">{userStars}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading && gameplayStatus === 'idle' ? (
          <div className="flex flex-col items-center justify-center p-24">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Consulting the Scribes...</p>
          </div>
        ) : gameplayStatus === 'playing' ? (
          
          /* ACTIVE IMMERSIVE Station PLAY INTERFACE */
          <div className="max-w-4xl mx-auto px-4 mt-8">
            <div className="w-full bg-card border-4 border-double border-yellow-500/30 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden text-card-foreground">
              
              {/* Shield Status Effect Overlay */}
              {isShieldActive && (
                <div className="absolute inset-0 border-4 border-indigo-500/20 pointer-events-none animate-pulse rounded-2xl" />
              )}

              {/* Progress and Timer header */}
              <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
                <Button variant="ghost" size="sm" onClick={exitGameplay} className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 uppercase tracking-wider text-[10px] font-black">
                  🏳️ Retreat
                </Button>

                <div className="text-center">
                  <span className="text-xs font-black uppercase text-amber-600 tracking-widest block">
                    {activeRoute?.name}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    Question {currentQIndex + 1} of {questQuestions.length}
                  </span>
                </div>

                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs border uppercase tracking-wider",
                  timer <= 3 ? "bg-red-100 border-red-200 text-red-600 animate-ping" : "bg-slate-900 border-slate-800 text-white shadow-sm"
                )}>
                  <Timer className="w-4 h-4" />
                  <span>{timer}s</span>
                </div>
              </div>

              {/* Question Screen */}
              {questQuestions[currentQIndex] && (
                <div className="space-y-6">
                  {/* Category badge */}
                  <div className="flex justify-center">
                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-500">
                      {questQuestions[currentQIndex].category}
                    </span>
                  </div>

                  <h3 className="text-lg md:text-xl font-bold text-center text-slate-800 leading-relaxed max-w-2xl mx-auto font-serif px-2">
                    {questQuestions[currentQIndex].question}
                  </h3>

                  {/* Smart Hint Card */}
                  {smartClue && (
                    <div className="bg-purple-100 border border-purple-200 p-3 rounded-2xl text-xs text-purple-800 font-bold max-w-lg mx-auto text-center animate-pulse shadow-sm">
                      🧠 Ramanujan's Formula: {smartClue}
                    </div>
                  )}

                  {/* Options List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                    {questQuestions[currentQIndex].options.map((option) => {
                      const isEliminated = eliminatedOptions.includes(option);
                      const isSelected = selectedOption === option;
                      const showResult = hasAnswered;
                      
                      const isOptionCorrect = revealedCorrectAnswer
                        ? option.toLowerCase().trim() === revealedCorrectAnswer.toLowerCase().trim()
                        : option === questQuestions[currentQIndex].correctAnswer;
                      
                      if (isEliminated) return <div key={option} className="hidden" />;

                      return (
                        <button
                          key={option}
                          disabled={hasAnswered}
                          onClick={() => handleSelectAnswer(option)}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl border-2 font-bold text-sm transition-all duration-200 select-none shadow-sm",
                            showResult
                              ? isOptionCorrect
                                ? "bg-emerald-100 border-emerald-500 text-emerald-800"
                                : isSelected
                                  ? "bg-red-100 border-red-500 text-red-800"
                                  : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                              : isSelected
                                ? "bg-amber-100 border-amber-500 text-amber-900"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                          )}
                        >
                          <span className={cn("mr-3 text-xs font-black", showResult ? (isOptionCorrect ? "text-emerald-500" : "text-slate-400") : "text-amber-500/50")}>●</span>
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {/* Interactive Gameplay Banner / Console log */}
                  <div className="text-center py-4 space-y-2">
                    <p className={cn(
                      "text-xs font-black uppercase tracking-wider",
                      hasAnswered 
                        ? isCorrect 
                          ? "text-emerald-600" 
                          : "text-red-600"
                        : "text-slate-500"
                    )}>
                      {feedbackMsg}
                    </p>
                    
                    {hasAnswered && revealedExplanation && (
                      <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed italic animate-in fade-in duration-300">
                        {revealedExplanation}
                      </p>
                    )}
                  </div>

                  {/* Next card trigger */}
                  {hasAnswered && (
                    <div className="flex justify-center pt-2">
                      <Button
                        onClick={handleNextQuestion}
                        className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest scale-100 hover:scale-105 active:scale-95 transition-all border-0"
                      >
                        Next Card <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  )}

                  {/* COUNCIL LIFELINES PANEL */}
                  {activeRoute?.id !== 'persia_trial' && (
                    <div className="border-t-2 border-primary/10 pt-6 mt-8">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center mb-4">
                        Activate Council Lifelines
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                        {/* Socrates Button */}
                        <Button
                          disabled={socratesUsed || hasAnswered || heroes.find(h => h.id === 'socrates')?.level === 0}
                          onClick={handleUseSocrates}
                          className={cn(
                            "h-14 flex flex-col justify-center items-center rounded-xl font-black px-2 transition-all btn-3d",
                            socratesUsed || hasAnswered || heroes.find(h => h.id === 'socrates')?.level === 0
                              ? "bg-slate-100 text-slate-400 shadow-none border-slate-200 hover:bg-slate-100 opacity-70"
                              : "bg-white text-cyan-700 border-2 border-cyan-200 hover:bg-cyan-50"
                          )}
                        >
                          <span className="text-sm">🏛️ Socrates</span>
                          <span className="text-[9px] font-bold text-slate-500 mt-0.5">50/50 (15 ★)</span>
                        </Button>

                        {/* Aryabhata Button */}
                        <Button
                          disabled={aryabhataUsed || hasAnswered || heroes.find(h => h.id === 'aryabhata')?.level === 0}
                          onClick={handleUseAryabhata}
                          className={cn(
                            "h-14 flex flex-col justify-center items-center rounded-xl font-black px-2 transition-all btn-3d",
                            aryabhataUsed || hasAnswered || heroes.find(h => h.id === 'aryabhata')?.level === 0
                              ? "bg-slate-100 text-slate-400 shadow-none border-slate-200 hover:bg-slate-100 opacity-70"
                              : "bg-white text-amber-600 border-2 border-amber-200 hover:bg-amber-50"
                          )}
                        >
                          <span className="text-sm">📐 Aryabhata</span>
                          <span className="text-[9px] font-bold text-slate-500 mt-0.5">+15s (20 ★)</span>
                        </Button>

                        {/* Chanakya Button */}
                        <Button
                          disabled={chanakyaUsed || hasAnswered || heroes.find(h => h.id === 'chanakya')?.level === 0}
                          onClick={handleUseChanakya}
                          className={cn(
                            "h-14 flex flex-col justify-center items-center rounded-xl font-black px-2 transition-all btn-3d",
                            chanakyaUsed || hasAnswered || heroes.find(h => h.id === 'chanakya')?.level === 0
                              ? "bg-slate-100 text-slate-400 shadow-none border-slate-200 hover:bg-slate-100 opacity-70"
                              : "bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50"
                          )}
                        >
                          <span className="text-sm">📜 Chanakya</span>
                          <span className="text-[9px] font-bold text-slate-500 mt-0.5">Shield (25 ★)</span>
                        </Button>

                        {/* Ramanujan Button */}
                        <Button
                          disabled={ramanujanUsed || hasAnswered || heroes.find(h => h.id === 'ramanujan')?.level === 0}
                          onClick={handleUseRamanujan}
                          className={cn(
                            "h-14 flex flex-col justify-center items-center rounded-xl font-black px-2 transition-all btn-3d",
                            ramanujanUsed || hasAnswered || heroes.find(h => h.id === 'ramanujan')?.level === 0
                              ? "bg-slate-100 text-slate-400 shadow-none border-slate-200 hover:bg-slate-100 opacity-70"
                              : "bg-white text-purple-700 border-2 border-purple-200 hover:bg-purple-50"
                          )}
                        >
                          <span className="text-sm">🧠 Ramanujan</span>
                          <span className="text-[9px] font-bold text-slate-500 mt-0.5">Smart Hint (35 ★)</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : gameplayStatus === 'ended' ? (
          
          /* Station COMPLETED SUMMARY */
          <div className="max-w-md mx-auto px-4 mt-12 text-center">
            <div className="panel-3d bg-white rounded-3xl p-8 shadow-2xl border-2 border-primary/20">
              <span className="text-6xl mb-4 block drop-shadow-sm">
                {score >= (activeRoute?.id === 'alexander_conquest' ? 5 : 3) ? '🏆' : '💀'}
              </span>
              <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-2">
                {score >= (activeRoute?.id === 'alexander_conquest' ? 5 : 3) ? 'Station Cleared!' : 'Train Derailed'}
              </h2>
              <p className="text-muted-foreground font-bold text-sm mb-6">
                You correctly answered <span className="font-black text-amber-500">{score}</span> out of {questQuestions.length} trivia cards.
              </p>

              <div className="flex flex-col gap-3">
                {score >= (activeRoute?.id === 'alexander_conquest' ? 5 : 3) ? (
                  <p className="text-xs text-emerald-500 font-black animate-pulse mb-2">
                    A {activeRoute?.rewardLabel} has been awarded to your cargo!
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground font-bold mb-2">
                    Upgrade your characters in the council chamber to unlock lifelines.
                  </p>
                )}

                <Button onClick={exitGameplay} className="w-full btn-3d btn-3d-primary py-4 rounded-xl uppercase tracking-widest text-sm">
                  Return to Map
                </Button>
              </div>
            </div>
          </div>
        ) : (
          
          /* STANDARD WAR ROOM TABS */
          <div className="max-w-6xl mx-auto px-4 mt-8">
            
            {/* TABS TACTICAL SELECTOR */}
            <div className="flex justify-center mb-8">
              <div className="flex gap-2 bg-white border-2 border-primary/20 p-2 rounded-2xl items-center shadow-lg w-full max-w-2xl overflow-x-auto custom-scrollbar">
                <button
                  onClick={() => setActiveTab('quests')}
                  className={cn(
                    "px-4 md:px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center h-10 whitespace-nowrap",
                    activeTab === 'quests' 
                      ? "btn-3d btn-3d-primary text-white" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  🗺️ Route Map
                </button>
                <button
                  onClick={() => setActiveTab('hangman')}
                  className={cn(
                    "px-4 md:px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center h-10 whitespace-nowrap",
                    activeTab === 'hangman' 
                      ? "btn-3d btn-3d-primary text-white" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  🎮 Mini Games
                </button>
                <button
                  onClick={() => setActiveTab('chests')}
                  className={cn(
                    "px-4 md:px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center h-10 whitespace-nowrap",
                    activeTab === 'chests' 
                      ? "btn-3d btn-3d-primary text-white" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  📦 Chest Shop
                </button>
                <button
                  onClick={() => setActiveTab('heroes')}
                  className={cn(
                    "px-4 md:px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center h-10 whitespace-nowrap",
                    activeTab === 'heroes' 
                      ? "btn-3d btn-3d-primary text-white" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  🏛️ Heroes
                </button>
              </div>
            </div>

            {/* TAB CONTENT: QUESTS */}
            {activeTab === 'quests' && (
              <div className="space-y-6">
                <div className="text-center max-w-md mx-auto mb-6">
                  <h2 className="text-2xl font-black uppercase tracking-widest text-primary">Route Map</h2>
                  <p className="text-sm font-bold text-muted-foreground mt-1">Journey through endless stages. Unlock chests and heroes.</p>
                </div>

                {/* Tactical Instruction Parchment Box */}
                <div className="max-w-xl mx-auto bg-amber-50 rounded-2xl p-4 text-center shadow-md border-2 border-amber-200">
                  <p className="text-xs font-bold leading-relaxed text-amber-900">
                    ✨ <span className="font-extrabold text-amber-700">Tip:</span> Play Stage 1 (0 Star cost) to earn your first <span className="font-extrabold text-amber-700">20 Tickets</span>! Open chests in the shop to recruit heroes.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-[600px]">
                  {/* ═══════════════════════════════════════════════════════
                      RAILWAY ROUTE MAP - Complete Rebuild
                      ═══════════════════════════════════════════════════════ */}
                  <div 
                    className="lg:col-span-2 relative rounded-2xl overflow-hidden h-full border-[8px] border-amber-900/70"
                    style={{
                      backgroundImage: "url('/railway_board_bg.jpg')",
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4), 0 12px 30px rgba(0,0,0,0.35)',
                    }}
                  >
                    {/* Parchment vignette overlay */}
                    <div className="absolute inset-0 pointer-events-none z-[1]" style={{
                      background: 'radial-gradient(ellipse at center, transparent 30%, rgba(30,15,5,0.6) 100%)',
                    }} />

                    {/* Custom Banner overlaying Aethelgard */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[20] pointer-events-none bg-[#fef3c7] border-[3px] border-[#92400e] rounded px-6 py-2 shadow-xl">
                      <h2 className="text-2xl font-black text-[#92400e] uppercase tracking-widest drop-shadow-md font-serif">
                        CuizIN Railways
                      </h2>
                    </div>

                     {/* FIXED Railway Track (does not scroll with stations) */}
                     <div className="railway-track-bg left-1/2 -translate-x-1/2 z-[3]" style={{ position: 'absolute' }} />

                     {/* FIXED Train — pinned to the "station stop" line in the viewport */}
                     {(() => {
                       // computed inside the IIFE below via ref; render placeholder here
                       return null;
                     })()}

                     {/* Scrollable Map Viewport */}
                     <div
                       ref={railwayScrollRef}
                       className="w-full h-full overflow-y-auto overflow-x-hidden relative z-[2] custom-scrollbar scroll-smooth flex flex-col items-center"
                       onScroll={handleRailwayScroll}
                     >
                       <div className="flex flex-col items-center w-full relative z-[5]" style={{ paddingBottom: 150, paddingTop: RAILWAY_PAD_TOP }}>
                        {(() => {
                          const ALL_STATIONS = Array.from({ length: 100 }, (_, i) => {
                            if (i < ROUTES.length) return ROUTES[i];
                            const categories = ["General", "Science", "History", "Geography", "Mythology"];
                            return {
                              id: `procedural_st_${i + 1}`,
                              name: `Station ${i + 1}`,
                              description: `A challenging new stop in ${categories[i % categories.length]} territory.`,
                              difficulty: i % 5 === 0 ? "Hard" : "Medium",
                              category: categories[i % categories.length],
                              rules: "Endless progression",
                              entryCost: 20 + Math.floor(i / 10) * 10,
                              rewardType: "bronze",
                              rewardLabel: "Bronze Chest",
                              emoji: "🚉",
                            } as RailwayRoute;
                          });

                          // Determine active station for train positioning
                          let activeIndex = 0;
                          for (let i = 0; i < ALL_STATIONS.length; i++) {
                            const isLocked = userStars < ALL_STATIONS[i].entryCost && i > 0;
                            const isCleared = clearedStations.includes(ALL_STATIONS[i].id) || (i < clearedStations.length);
                            const isActive = !isLocked && !isCleared && (i === 0 || clearedStations.includes(ALL_STATIONS[i - 1].id));
                            if (isActive) {
                              activeIndex = i;
                              break;
                            }
                            if (isCleared && i === ALL_STATIONS.length - 1) {
                              activeIndex = i;
                            }
                          }

                          return (
                            <>
                              {ALL_STATIONS.map((station, index) => {
                                const isLocked = userStars < station.entryCost && index > 0;
                                const isSelected = selectedRoute?.id === station.id;
                                const isCleared = clearedStations.includes(station.id) || (index < clearedStations.length);
                                const isActive = index === activeIndex;

                                return (
                                  <div
                                    key={station.id}
                                    className={cn("station-container cursor-pointer", isLocked && "station-locked")}
                                    onClick={() => {
                                      haptics('light');
                                      audioManager.playSFX('click');
                                      setSelectedMapQuest(station as any);
                                    }}
                                  >
                                    {/* Right Building */}
                                    <div className="station-building-img station-building-right" />
                                    
                                    {/* Semaphore Signal (Left of the left building) */}
                                    <div 
                                      className="semaphore-signal-img" 
                                      style={{ filter: isLocked ? 'hue-rotate(0deg)' : 'hue-rotate(-120deg) brightness(1.2)' }}
                                    />
                                    
                                    {/* Wooden Nameboard spanning tracks */}
                                    <div className={cn(
                                      "station-wooden-plaque transition-all duration-300",
                                      isSelected ? "scale-110 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.6)]" : ""
                                    )}>
                                      <h3>{station.name}</h3>
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 🚂 THE TRAIN — fixed to the "stop line" in the map viewport */}
                    <div
                      className={cn("train-root", trainHidden && "train-hidden")}
                      style={{ top: `${RAILWAY_STOP_Y - 75}px` }}
                    >
                      <div className="smoke-puff" style={{ top: 20, left: 45, animation: 'smoke-rise 1s infinite linear', animationDelay: '0s' }} />
                      <div className="smoke-puff" style={{ top: 20, left: 45, animation: 'smoke-rise 1.2s infinite linear', animationDelay: '0.4s' }} />
                    </div>
                  </div>

                  {/* Campaign Panel Details Card (Takes 1 column) */}
                  <div className="bg-[#fffdf5] rounded-3xl p-6 shadow-[0_8px_0_0_rgba(217,119,6,0.15)] border-[3px] border-amber-500/30 flex flex-col justify-between sticky top-4 h-max relative overflow-hidden">
                    {/* Corner map decorations */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                    
                    {selectedRoute ? (
                      <div className="flex flex-col h-full justify-between animate-in fade-in duration-300">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-4xl drop-shadow-sm">{selectedRoute.emoji}</span>
                            <div>
                              <h3 className="font-black text-foreground text-lg tracking-tight leading-tight">
                                {selectedRoute.name}
                              </h3>
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1.5 inline-block",
                                selectedRoute.difficulty === 'Easy' ? "bg-emerald-100 text-emerald-600 border border-emerald-200" :
                                selectedRoute.difficulty === 'Medium' ? "bg-amber-100 text-amber-600 border border-amber-200" :
                                selectedRoute.difficulty === 'Hard' ? "bg-rose-100 text-rose-600 border border-rose-200" :
                                "bg-purple-100 text-purple-600 border border-purple-200"
                              )}>
                                {selectedRoute.difficulty}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4 text-sm">
                            <p className="text-muted-foreground font-bold leading-relaxed">
                              "{selectedRoute.description}"
                            </p>

                            <div className="bg-muted p-4 rounded-2xl border-2 border-muted-foreground/10 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Entry Cost</span>
                                <span className="text-primary font-black">
                                  {selectedRoute.entryCost > 0 ? `${selectedRoute.entryCost} Tickets` : 'FREE'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Ruleset</span>
                                <span className="text-foreground font-black text-xs">{selectedRoute.rules}</span>
                              </div>
                              <div className="flex justify-between items-center border-t-2 border-white/50 pt-3 mt-1">
                                <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Cargo Reward</span>
                                <span className="text-secondary font-black text-xs">{selectedRoute.rewardLabel}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-4">
                          <Button
                            onClick={() => {
                              const isLocked = userStars < selectedRoute.entryCost;
                              if (isLocked) {
                                toast({
                                  title: "Fog of War Active!",
                                  description: `You need at least ${selectedRoute.entryCost} Tickets to launch this campaign.`,
                                  variant: "destructive"
                                });
                                return;
                              }
                              handleLaunchQuest(selectedRoute);
                            }}
                            className={cn(
                              "w-full rounded-xl py-4 font-black uppercase tracking-wide text-base btn-3d",
                              userStars < selectedRoute.entryCost
                                ? "bg-slate-200 text-slate-400 shadow-none hover:bg-slate-200 active:scale-100" 
                                : "btn-3d-primary"
                            )}
                          >
                            {userStars < selectedRoute.entryCost ? `Locked (${selectedRoute.entryCost}★)` : 'Depart'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={() => setSelectedMapQuest(null)} 
                            className="w-full text-slate-500 hover:text-slate-300 text-[10px] uppercase font-black tracking-wider"
                          >
                            Close Panel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center h-full py-12 text-slate-500 animate-in fade-in duration-300">
                        <MapPin className="w-8 h-8 text-yellow-500/30 mb-3" />
                        <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-1">Conquest Panel</h4>
                        <p className="text-[11px] text-slate-500 max-w-[180px] leading-relaxed">
                          Select a regional pin on the war map to reveal campaign rules and deploy troops.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: HANGMAN */}
            {activeTab === 'hangman' && (
              <div className="space-y-10">
                {/* Featured: Daily Hangman Battle */}
                <div className="space-y-4">
                  <div className="text-center max-w-md mx-auto">
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 font-black uppercase tracking-widest">
                      Featured Tavern Game
                    </span>
                    <h2 className="text-lg font-black uppercase tracking-widest text-white mt-2">Word Guessing Duel</h2>
                    <p className="text-xs text-slate-400 mt-1">Defeat the hangman to claim raw gems and unlock key campaign tokens.</p>
                  </div>
                  <DailyHangman userId={userId} onRefreshBalances={fetchUserData} />
                </div>

                <hr className="border-stone-850" />

                {/* Arcade: Tavern mini games gallery */}
                <div className="space-y-6">
                  <div className="text-center max-w-md mx-auto">
                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">Tavern Mini-Games</h3>
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
                  <h2 className="text-2xl font-black uppercase tracking-widest text-primary">Empire Treasury Shop</h2>
                  <p className="text-sm font-bold text-muted-foreground mt-1">Exchange your gathered star tokens to purchase mystery reward vaults.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Bronze Card */}
                  <div className="panel-3d bg-white rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-md relative group border-2 border-primary/10">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-700 to-amber-500 flex items-center justify-center text-5xl mb-4 shadow-inner border border-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                      📦
                    </div>
                    <h3 className="font-black text-foreground text-lg tracking-tight mb-1">Bronze Chest</h3>
                    <p className="text-muted-foreground font-bold text-sm leading-relaxed mb-6 max-w-[200px]">
                      Contains minor Gems & Tickets. Socrates/Aryabhata shards.
                    </p>
                    <Button 
                      onClick={() => handleBuyChest('bronze')}
                      className="w-full btn-3d bg-white border-2 border-primary/20 text-primary font-black px-4 py-2.5 rounded-xl text-sm uppercase tracking-wider hover:bg-muted"
                    >
                      50 Tickets
                    </Button>
                  </div>

                  {/* Gold Card */}
                  <div className="panel-3d bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-lg relative group">
                    {/* Rare badge */}
                    <span className="absolute -top-3 bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                      Highly Popular
                    </span>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-600 via-amber-500 to-yellow-500 flex items-center justify-center text-5xl mb-4 shadow-inner border border-yellow-400/20 group-hover:scale-105 transition-transform duration-300">
                      🏆
                    </div>
                    <h3 className="font-black text-foreground text-lg tracking-tight mb-1">Golden Vault</h3>
                    <p className="text-muted-foreground font-bold text-sm leading-relaxed mb-6 max-w-[200px]">
                      Excellent value. Medium gems, Tickets. High chance of Chanakya shards.
                    </p>
                    <Button 
                      onClick={() => handleBuyChest('gold')}
                      className="w-full btn-3d btn-3d-primary font-black px-4 py-2.5 rounded-xl text-sm uppercase tracking-widest"
                    >
                      150 Tickets
                    </Button>
                  </div>

                  {/* Legendary Card */}
                  <div className="panel-3d bg-white border-2 border-purple-200 rounded-3xl p-6 flex flex-col justify-between items-center text-center shadow-md relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-800 via-indigo-600 to-purple-600 flex items-center justify-center text-5xl mb-4 shadow-inner border border-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                      👑
                    </div>
                    <h3 className="font-black text-foreground text-lg tracking-tight mb-1">Emperor's Tomb</h3>
                    <p className="text-muted-foreground font-bold text-sm leading-relaxed mb-6 max-w-[200px]">
                      Legendary drops. Major Gems & Tickets. High shards count for any hero.
                    </p>
                    <Button 
                      onClick={() => handleBuyChest('legendary')}
                      className="w-full btn-3d bg-white border-2 border-purple-300 text-purple-700 font-black px-4 py-2.5 rounded-xl text-sm uppercase tracking-wider hover:bg-purple-50"
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
                  <h2 className="text-2xl font-black uppercase tracking-widest text-primary">Intellectual Counsel</h2>
                  <p className="text-sm font-bold text-muted-foreground mt-1">Unlock and upgrade historical counselors. Leveling up boosts their lifeline powers.</p>
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
    </PageLayout>
  );
}
