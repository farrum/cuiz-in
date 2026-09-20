import { awardAdvisorShards, type AdvisorId } from '@/utils/advisorShards';
import { STORAGE_KEYS } from './constants';
import { supabase } from '@/integrations/supabase/client';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'shield' | 'avatar_frame' | 'backdrop' | 'counselor_shard' | 'potion' | 'prestige_title';
  costGems: number;
  costStars: number;
  effect: string;
  emoji: string;
  previewClass?: string; // CSS style or custom visual indicators
}

export const ARMORY_ITEMS: ShopItem[] = [
  {
    id: 'excalibur_sword',
    name: 'Excalibur Sword',
    description: 'A legendary blade that multiplies star gains on winning streaks by 1.5x.',
    type: 'weapon',
    costGems: 250,
    costStars: 30,
    effect: '+50% Star Multiplier on streaks',
    emoji: '⚔️',
    previewClass: 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
  },
  {
    id: 'aegis_shield',
    name: 'Aegis Shield',
    description: 'A divine shield that automatically saves you from 1 wrong answer per day in challenges.',
    type: 'shield',
    costGems: 150,
    costStars: 15,
    effect: 'Blocks 1 daily wrong answer',
    emoji: '🛡️',
    previewClass: 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
  },
  {
    id: 'royal_crown_frame',
    name: 'Royal Crown Frame',
    description: 'A prestigious golden frame adorned with crown emblems for your avatar.',
    type: 'avatar_frame',
    costGems: 100,
    costStars: 0,
    effect: 'Golden Crown Avatar Border',
    emoji: '👑',
    previewClass: 'border-4 border-yellow-500 rounded-full ring-4 ring-yellow-300 ring-offset-2'
  },
  {
    id: 'crimson_flame_frame',
    name: 'Crimson Flame Frame',
    description: 'An animated crimson border that makes your profile photo look like it is ablaze.',
    type: 'avatar_frame',
    costGems: 200,
    costStars: 10,
    effect: 'Animated Crimson Flame Border',
    emoji: '🔥',
    previewClass: 'border-4 border-red-500 rounded-full animate-pulse ring-4 ring-red-400 ring-offset-2'
  },
  {
    id: 'barons_banner',
    name: "Baron's Banner",
    description: 'Changes your profile page backdrop to a majestic royal navy silk banner.',
    type: 'backdrop',
    costGems: 80,
    costStars: 0,
    effect: 'Royal Navy Banner Profile Backdrop',
    emoji: '🚩',
    previewClass: 'bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-900 text-white'
  },
  {
    id: 'shard_chanakya',
    name: 'Chanakya Shards (x5)',
    description: 'Acquire shards to unlock or level up Emperor Chanakya, granting diplomatic protection in quizzes.',
    type: 'counselor_shard',
    costGems: 80,
    costStars: 5,
    effect: 'Unlocks Chanakya\'s Diplomatic Shield',
    emoji: '📜'
  },
  {
    id: 'shard_socrates',
    name: 'Socrates Shards (x5)',
    description: 'Acquire shards to unlock or level up Socrates, granting the ability to eliminate wrong choices.',
    type: 'counselor_shard',
    costGems: 60,
    costStars: 3,
    effect: 'Unlocks Socratic Dialogue Lifeline',
    emoji: '💭'
  },
  {
    id: 'shard_aryabhata',
    name: 'Aryabhata Shards (x5)',
    description: 'Acquire shards to unlock or level up Aryabhata, granting calculations to freeze the timer.',
    type: 'counselor_shard',
    costGems: 60,
    costStars: 3,
    effect: 'Unlocks Aryabhata\'s Timer Freeze',
    emoji: '🧭'
  },
  {
    id: 'shard_ramanujan',
    name: 'Ramanujan Shards (x5)',
    description: 'Acquire shards to unlock or level up Ramanujan, granting intuitive flashes to reveal answers.',
    type: 'counselor_shard',
    costGems: 90,
    costStars: 8,
    effect: 'Unlocks Ramanujan\'s Intuitive Flash',
    emoji: '✨'
  },
  {
    id: 'elixir_time',
    name: 'Elixir of Time',
    description: 'A magical potion that freezes the question timer and grants 15 extra seconds during a quiz.',
    type: 'potion',
    costGems: 15,
    costStars: 0,
    effect: '+15 Seconds to Quiz Timer',
    emoji: '🧪'
  },
  {
    id: 'scribe_ink',
    name: "Scribe's Ink",
    description: "Sacred ink that removes one incorrect option from a quiz question.",
    type: 'potion',
    costGems: 25,
    costStars: 0,
    effect: 'Removes 1 Wrong Answer Option',
    emoji: '✒️'
  },
  {
    id: 'title_hegemon',
    name: 'Hegemon Title',
    description: 'Unlocks the title "Hegemon" to display proudly next to your name on profiles and leadboards.',
    type: 'prestige_title',
    costGems: 100,
    costStars: 5,
    effect: 'Title: HEGEMON',
    emoji: '🔱'
  },
  {
    id: 'title_scholar',
    name: 'Royal Scholar Title',
    description: 'Unlocks the title "Royal Scholar" to show off your high intellect.',
    type: 'prestige_title',
    costGems: 150,
    costStars: 10,
    effect: 'Title: ROYAL SCHOLAR',
    emoji: '📖'
  },
  {
    id: 'title_grandmaster',
    name: 'Castle Grandmaster Title',
    description: 'The ultimate prestige title for seasoned fortress commanders.',
    type: 'prestige_title',
    costGems: 300,
    costStars: 20,
    effect: 'Title: CASTLE GRANDMASTER',
    emoji: '🏰'
  }
];

const BOUGHT_ITEMS_KEY = 'cuizin_purchased_armory';
const EQUIPPED_ITEMS_KEY = 'cuizin_equipped_armory';
const POTION_COUNT_PREFIX = 'cuizin_potion_count_';
const EQUIPPED_TITLE_KEY = 'cuizin_active_title';

// Initialize starting balances if they are 0 (for ease of testing)
export const initializeStartingBalances = () => {
  const currentGems = localStorage.getItem(STORAGE_KEYS.USER_GEMS);
  const currentStars = localStorage.getItem(STORAGE_KEYS.USER_STARS);
  let seeded = false;

  if (!currentGems || parseInt(currentGems) === 0) {
    localStorage.setItem(STORAGE_KEYS.USER_GEMS, '500');
    seeded = true;
  }
  if (!currentStars || parseInt(currentStars) === 0) {
    localStorage.setItem(STORAGE_KEYS.USER_STARS, '50');
    seeded = true;
  }
  if (seeded) {
    window.dispatchEvent(new CustomEvent('gemsUpdated'));
  }
};

// Get current user currency balances
export const getUserBalances = () => {
  initializeStartingBalances();
  const gems = parseInt(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || '0');
  const stars = parseInt(localStorage.getItem(STORAGE_KEYS.USER_STARS) || '0');
  return { gems, stars };
};

// Update user currency balances (syncs locally and to Supabase profiles)
export const updateUserBalances = (gemsDelta: number, starsDelta: number) => {
  const { gems, stars } = getUserBalances();
  
  const newGems = Math.max(0, gems + gemsDelta);
  const newStars = Math.max(0, stars + starsDelta);
  
  localStorage.setItem(STORAGE_KEYS.USER_GEMS, newGems.toString());
  localStorage.setItem(STORAGE_KEYS.USER_STARS, newStars.toString());
  
  // Dispatch custom events so headers and UI update instantly
  window.dispatchEvent(new CustomEvent('gemsUpdated'));
  window.dispatchEvent(new CustomEvent('starsUpdated'));

  // Sync to database server if user is logged in
  if (gemsDelta !== 0 || starsDelta !== 0) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        (supabase as any).rpc('award_currency', {
          p_points_delta: Math.round(gemsDelta),
          p_stars_delta: Math.round(starsDelta),
          p_reason: gemsDelta < 0 ? 'shop_purchase' : 'balance_update',
        }).then((res: any) => {
          if (res?.data?.points !== undefined) {
            localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(res.data.points));
            if (res.data.stars !== undefined) {
              localStorage.setItem(STORAGE_KEYS.USER_STARS, String(res.data.stars));
            }
          }
        }).catch((err: any) => {
          console.warn('[shopData] server currency sync warning', err);
        });
      }
    }).catch(() => {});
  }

  return { gems: newGems, stars: newStars };
};

// Persist an inventory item / potion / title to user_task_progress for cross-device sync
const persistServerInventoryItem = async (inventoryKey: string, progressValue: number = 1) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    const userId = session.user.id;

    await (supabase as any)
      .from('user_task_progress')
      .upsert({
        user_id: userId,
        task_id: `inv_${inventoryKey}`,
        progress: progressValue,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'user_id,task_id' });
  } catch (err) {
    console.warn('[shopData] failed to persist inventory item to server', err);
  }
};

// Pull all server-stored purchases, potions, equipped items, and titles to local cache
export const syncAccountPurchases = async (userId?: string): Promise<void> => {
  try {
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      effectiveUserId = session?.user?.id;
    }
    if (!effectiveUserId) return;

    // Pull inventory records
    const { data, error } = await (supabase as any)
      .from('user_task_progress')
      .select('task_id, progress')
      .eq('user_id', effectiveUserId)
      .like('task_id', 'inv_%');

    if (error || !Array.isArray(data)) return;

    const purchasedList = new Set<string>(getPurchasedItems());

    data.forEach((row) => {
      const key = (row.task_id as string).replace('inv_', '');
      if (key.startsWith('potion_')) {
        const potionId = key.replace('potion_', '');
        localStorage.setItem(`${POTION_COUNT_PREFIX}${potionId}`, String(row.progress || 0));
        purchasedList.add(potionId);
      } else if (key.startsWith('title_')) {
        purchasedList.add(key);
      } else if (key.startsWith('equipped_title_')) {
        const titleId = key.replace('equipped_title_', '');
        localStorage.setItem(EQUIPPED_TITLE_KEY, titleId);
      } else if (key.startsWith('item_')) {
        const itemId = key.replace('item_', '');
        purchasedList.add(itemId);
      } else if (key.startsWith('equipped_')) {
        try {
          const parts = key.split('_');
          const type = parts[1]; // weapon, shield, etc.
          const itemId = parts.slice(2).join('_');
          const equipped = getEquippedItems();
          equipped[type] = itemId;
          localStorage.setItem(EQUIPPED_ITEMS_KEY, JSON.stringify(equipped));
        } catch {
          // ignore
        }
      }
    });

    localStorage.setItem(BOUGHT_ITEMS_KEY, JSON.stringify(Array.from(purchasedList)));
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  } catch (err) {
    console.warn('[shopData] syncAccountPurchases failed', err);
  }
};

export const clearPurchasesCache = () => {
  localStorage.removeItem(BOUGHT_ITEMS_KEY);
  localStorage.removeItem(EQUIPPED_ITEMS_KEY);
  localStorage.removeItem(EQUIPPED_TITLE_KEY);
  ARMORY_ITEMS.filter(i => i.type === 'potion').forEach(p => {
    localStorage.removeItem(`${POTION_COUNT_PREFIX}${p.id}`);
  });
  window.dispatchEvent(new CustomEvent('profileUpdated'));
};

// Get list of purchased items
export const getPurchasedItems = (): string[] => {
  const data = localStorage.getItem(BOUGHT_ITEMS_KEY);
  return data ? JSON.parse(data) : [];
};

// Purchase an item
export const purchaseItem = (itemId: string): { success: boolean; message: string } => {
  const item = ARMORY_ITEMS.find(i => i.id === itemId);
  if (!item) return { success: false, message: 'Item not found.' };

  const { gems, stars } = getUserBalances();
  if (gems < item.costGems || stars < item.costStars) {
    return { success: false, message: 'Insufficient gems or stars.' };
  }

  // Deduct costs (authoritative server sync via updateUserBalances)
  updateUserBalances(-item.costGems, -item.costStars);

  // Potions increment handling
  if (item.type === 'potion') {
    const key = `${POTION_COUNT_PREFIX}${itemId}`;
    const current = parseInt(localStorage.getItem(key) || '0');
    const nextCount = current + 1;
    localStorage.setItem(key, nextCount.toString());
    
    // Add to purchased list as owned
    const purchased = getPurchasedItems();
    if (!purchased.includes(itemId)) {
      purchased.push(itemId);
      localStorage.setItem(BOUGHT_ITEMS_KEY, JSON.stringify(purchased));
    }
    
    void persistServerInventoryItem(`potion_${itemId}`, nextCount);
    window.dispatchEvent(new CustomEvent('profileUpdated'));
    return { success: true, message: `Successfully purchased ${item.name}! You now have ${nextCount} of them.` };
  }

  // Shard purchase handling — shards persist server-side until spent on a lifeline
  if (item.type === 'counselor_shard') {
    const heroId = itemId.replace('shard_', ''); // chanakya, socrates, etc.
    const shardKey = `hero_${heroId}_shards`;
    const levelKey = `hero_${heroId}_level`;

    void awardAdvisorShards(heroId as AdvisorId, 5, 'shop_purchase');
    const currentShards = parseInt(localStorage.getItem(shardKey) || '0') + 5;

    // First shards unlock the advisor; levels never consume shards.
    const level = parseInt(localStorage.getItem(levelKey) || '0');
    if (level === 0) {
      localStorage.setItem(levelKey, '1');
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      return { success: true, message: `Acquired 5 shards! Emperor ${heroId.toUpperCase()} is now UNLOCKED at Level 1!` };
    }

    window.dispatchEvent(new CustomEvent('profileUpdated'));
    return { success: true, message: `Successfully purchased 5 ${item.name} (Current: ${currentShards})!` };
  }

  const purchased = getPurchasedItems();
  if (purchased.includes(itemId)) {
    return { success: false, message: 'You already own this item.' };
  }

  // Save purchased non-shard item
  purchased.push(itemId);
  localStorage.setItem(BOUGHT_ITEMS_KEY, JSON.stringify(purchased));

  if (item.type === 'prestige_title') {
    void persistServerInventoryItem(`title_${itemId}`, 1);
  } else {
    void persistServerInventoryItem(`item_${itemId}`, 1);
  }

  // Auto-equip item of this category
  equipItem(itemId);

  return { success: true, message: `Successfully purchased ${item.name}!` };
};

// Get currently equipped items (grouped by type)
export const getEquippedItems = (): Record<string, string> => {
  const data = localStorage.getItem(EQUIPPED_ITEMS_KEY);
  return data ? JSON.parse(data) : { weapon: '', shield: '', avatar_frame: '', backdrop: '' };
};

// Equip an item
export const equipItem = (itemId: string): boolean => {
  const item = ARMORY_ITEMS.find(i => i.id === itemId);
  if (!item) return false;

  const purchased = getPurchasedItems();
  if (!purchased.includes(itemId)) return false;

  if (item.type === 'prestige_title') {
    localStorage.setItem(EQUIPPED_TITLE_KEY, itemId);
    void persistServerInventoryItem(`equipped_title_${itemId}`, 1);
    window.dispatchEvent(new CustomEvent('profileUpdated'));
    return true;
  }

  const equipped = getEquippedItems();
  equipped[item.type] = itemId;
  localStorage.setItem(EQUIPPED_ITEMS_KEY, JSON.stringify(equipped));
  void persistServerInventoryItem(`equipped_${item.type}_${itemId}`, 1);
  
  window.dispatchEvent(new CustomEvent('profileUpdated'));
  return true;
};

// Unequip item of type
export const unequipItem = (type: string): void => {
  const equipped = getEquippedItems();
  if (equipped[type]) {
    const oldItem = equipped[type];
    equipped[type] = '';
    localStorage.setItem(EQUIPPED_ITEMS_KEY, JSON.stringify(equipped));
    void persistServerInventoryItem(`equipped_${type}_${oldItem}`, 0);
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  }
};

// Potion Helper Functions
export const getPotionCount = (potionId: string): number => {
  return parseInt(localStorage.getItem(`${POTION_COUNT_PREFIX}${potionId}`) || '0');
};

export const consumePotion = (potionId: string): boolean => {
  const key = `${POTION_COUNT_PREFIX}${potionId}`;
  const current = parseInt(localStorage.getItem(key) || '0');
  if (current <= 0) return false;

  const next = current - 1;
  localStorage.setItem(key, next.toString());
  void persistServerInventoryItem(`potion_${potionId}`, next);
  window.dispatchEvent(new CustomEvent('profileUpdated'));
  return true;
};

// Title Helper Functions
export const getEquippedTitle = (): string => {
  return localStorage.getItem(EQUIPPED_TITLE_KEY) || '';
};

export const equipTitle = (itemId: string): void => {
  localStorage.setItem(EQUIPPED_TITLE_KEY, itemId);
  void persistServerInventoryItem(`equipped_title_${itemId}`, 1);
  window.dispatchEvent(new CustomEvent('profileUpdated'));
};

export const unequipTitle = (): void => {
  localStorage.removeItem(EQUIPPED_TITLE_KEY);
  window.dispatchEvent(new CustomEvent('profileUpdated'));
};
