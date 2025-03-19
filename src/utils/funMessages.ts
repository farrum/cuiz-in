
// Fun message types
export type MessageType = 'success' | 'failure' | 'achievement' | 'welcome' | 'level_up';

// Interface for fun messages
export interface FunMessage {
  id: string;
  type: MessageType;
  text: string;
  emoji?: string;
  createdAt: string;
  isActive: boolean;
}

// Default fun messages
export const defaultSuccessMessages: FunMessage[] = [
  { id: '1', type: 'success', text: "Wow! You're on fire! 🔥", emoji: '🔥', createdAt: new Date().toISOString(), isActive: true },
  { id: '2', type: 'success', text: "Brain power level 9000! 🧠", emoji: '🧠', createdAt: new Date().toISOString(), isActive: true },
  { id: '3', type: 'success', text: "You're smarter than Einstein's cat! 🐱", emoji: '🐱', createdAt: new Date().toISOString(), isActive: true },
  { id: '4', type: 'success', text: "Quiz ninja in training! 🥋", emoji: '🥋', createdAt: new Date().toISOString(), isActive: true },
  { id: '5', type: 'success', text: "Knowledge superhero! 🦸", emoji: '🦸', createdAt: new Date().toISOString(), isActive: true },
];

export const defaultFailureMessages: FunMessage[] = [
  { id: '1', type: 'failure', text: "Oops! Even Einstein got things wrong sometimes! 🧪", emoji: '🧪', createdAt: new Date().toISOString(), isActive: true },
  { id: '2', type: 'failure', text: "Nice try! The answer was just shy! 🙈", emoji: '🙈', createdAt: new Date().toISOString(), isActive: true },
  { id: '3', type: 'failure', text: "Knowledge is a journey, not a destination! 🚶", emoji: '🚶', createdAt: new Date().toISOString(), isActive: true },
  { id: '4', type: 'failure', text: "That was a tricky one! 🦊", emoji: '🦊', createdAt: new Date().toISOString(), isActive: true },
  { id: '5', type: 'failure', text: "Almost had it! Your brain is warming up! 🧠", emoji: '🧠', createdAt: new Date().toISOString(), isActive: true },
];

export const defaultAchievementMessages: FunMessage[] = [
  { id: '1', type: 'achievement', text: "Achievement unlocked: Brainiac level 1! 🏆", emoji: '🏆', createdAt: new Date().toISOString(), isActive: true },
  { id: '2', type: 'achievement', text: "You've just leveled up your knowledge power! ⚡", emoji: '⚡', createdAt: new Date().toISOString(), isActive: true },
  { id: '3', type: 'achievement', text: "Trophy cabinet getting full! 🏅", emoji: '🏅', createdAt: new Date().toISOString(), isActive: true },
];

export const defaultWelcomeMessages: FunMessage[] = [
  { id: '1', type: 'welcome', text: "Welcome to the quiz party! 🎉", emoji: '🎉', createdAt: new Date().toISOString(), isActive: true },
  { id: '2', type: 'welcome', text: "Ready to flex those brain muscles? 💪", emoji: '💪', createdAt: new Date().toISOString(), isActive: true },
  { id: '3', type: 'welcome', text: "Quiz time! Let's make your brain happy! 😄", emoji: '😄', createdAt: new Date().toISOString(), isActive: true },
];

export const defaultLevelUpMessages: FunMessage[] = [
  { id: '1', type: 'level_up', text: "Level up! Your brain just got bigger! 🧠", emoji: '🧠', createdAt: new Date().toISOString(), isActive: true },
  { id: '2', type: 'level_up', text: "You're climbing the knowledge mountain! ⛰️", emoji: '⛰️', createdAt: new Date().toISOString(), isActive: true },
  { id: '3', type: 'level_up', text: "New quiz level unlocked! You're awesome! 🌟", emoji: '🌟', createdAt: new Date().toISOString(), isActive: true },
];

// Get a random message based on type
export function getRandomMessage(type: MessageType): FunMessage {
  let messages: FunMessage[] = [];
  
  switch (type) {
    case 'success':
      messages = defaultSuccessMessages;
      break;
    case 'failure':
      messages = defaultFailureMessages;
      break;
    case 'achievement':
      messages = defaultAchievementMessages;
      break;
    case 'welcome':
      messages = defaultWelcomeMessages;
      break;
    case 'level_up':
      messages = defaultLevelUpMessages;
      break;
  }
  
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

// Utility to get custom messages from database
export async function getCustomMessages(supabase: any, type: MessageType): Promise<FunMessage[]> {
  try {
    const { data, error } = await supabase
      .from('fun_messages')
      .select('*')
      .eq('type', type)
      .eq('isActive', true);
      
    if (error) throw error;
    
    return data.length > 0 ? data : getDefaultMessages(type);
  } catch (error) {
    console.error('Error fetching custom messages:', error);
    return getDefaultMessages(type);
  }
}

// Get default messages by type
export function getDefaultMessages(type: MessageType): FunMessage[] {
  switch (type) {
    case 'success':
      return defaultSuccessMessages;
    case 'failure':
      return defaultFailureMessages;
    case 'achievement':
      return defaultAchievementMessages;
    case 'welcome':
      return defaultWelcomeMessages;
    case 'level_up':
      return defaultLevelUpMessages;
    default:
      return [];
  }
}
