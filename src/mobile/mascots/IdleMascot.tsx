import { MascotPlayer } from './MascotPlayer';
import { characterOfTheDay, type Mood } from './registry';
import { useMoodEngine } from './useMoodEngine';

/**
 * Persistent "mascot of the day" used on Hub / Profile.
 * Its mood is driven by the rolling mood engine so it reflects
 * how the user has been performing this session.
 */
export function IdleMascot({ size = 96, override }: { size?: number; override?: Mood }) {
  const { mood } = useMoodEngine();
  return <MascotPlayer character={characterOfTheDay()} mood={override ?? mood} size={size} />;
}

export default IdleMascot;