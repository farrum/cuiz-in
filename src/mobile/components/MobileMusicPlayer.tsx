import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Music, Volume2, VolumeX, Play, Pause, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Track {
  name: string;
  url: string;
  isCustom?: boolean;
}

const PRESET_TRACKS: Track[] = [
  { name: 'Zen Ambient', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: 'Lofi Study', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { name: 'Acoustic Calm', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { name: 'Peaceful Piano', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
];

interface MusicContextType {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  activeTrackIndex: number;
  setActiveTrackIndex: (index: number) => void;
  tracks: Track[];
  addCustomTrack: (name: string, url: string) => void;
  removeCustomTrack: (index: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MobileMusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('cuizin_music_enabled') === 'true';
  });
  const [volume, setVolumeState] = useState<number>(() => {
    const val = localStorage.getItem('cuizin_music_volume');
    return val ? parseFloat(val) : 0.3;
  });
  const [activeTrackIndex, setActiveTrackIndexState] = useState<number>(() => {
    const val = localStorage.getItem('cuizin_music_track_index');
    return val ? parseInt(val, 10) : 0;
  });
  const [customTracks, setCustomTracks] = useState<Track[]>(() => {
    const val = localStorage.getItem('cuizin_music_custom_tracks');
    return val ? JSON.parse(val) : [];
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tracks = [...PRESET_TRACKS, ...customTracks];

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('cuizin_music_enabled', String(isEnabled));
  }, [isEnabled]);

  useEffect(() => {
    localStorage.setItem('cuizin_music_volume', String(volume));
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('cuizin_music_track_index', String(activeTrackIndex));
  }, [activeTrackIndex]);

  useEffect(() => {
    localStorage.setItem('cuizin_music_custom_tracks', JSON.stringify(customTracks));
  }, [customTracks]);

  // Audio lifecycle management
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;
    audio.volume = volume;

    const currentTrack = tracks[activeTrackIndex] || tracks[0];
    if (currentTrack && audio.src !== currentTrack.url) {
      audio.src = currentTrack.url;
      audio.load();
    }

    if (isEnabled) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[MusicPlayer] Autoplay blocked, waiting for user gesture:', err);
          setIsEnabled(false);
        });
      }
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [isEnabled, activeTrackIndex, customTracks]);

  const setVolume = (v: number) => {
    setVolumeState(v);
  };

  const setActiveTrackIndex = (idx: number) => {
    if (idx >= 0 && idx < tracks.length) {
      setActiveTrackIndexState(idx);
      setIsEnabled(true);
    }
  };

  const addCustomTrack = (name: string, url: string) => {
    const newTrack: Track = { name, url, isCustom: true };
    const updated = [...customTracks, newTrack];
    setCustomTracks(updated);
    // Switch to newly added track
    setActiveTrackIndexState(PRESET_TRACKS.length + customTracks.length);
    setIsEnabled(true);
  };

  const removeCustomTrack = (customIdx: number) => {
    const updated = customTracks.filter((_, idx) => idx !== customIdx);
    setCustomTracks(updated);
    // Adjust active index if necessary
    const targetIdx = PRESET_TRACKS.length + customIdx;
    if (activeTrackIndex === targetIdx) {
      setActiveTrackIndexState(0);
    } else if (activeTrackIndex > targetIdx) {
      setActiveTrackIndexState(prev => prev - 1);
    }
  };

  return (
    <MusicContext.Provider
      value={{
        isEnabled,
        setIsEnabled,
        volume,
        setVolume,
        activeTrackIndex,
        setActiveTrackIndex,
        tracks,
        addCustomTrack,
        removeCustomTrack
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMobileMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMobileMusic must be used within a MobileMusicProvider');
  }
  return context;
};

export const MobileMusicPlayer: React.FC = () => {
  const {
    isEnabled,
    setIsEnabled,
    volume,
    setVolume,
    activeTrackIndex,
    setActiveTrackIndex,
    tracks,
    addCustomTrack,
    removeCustomTrack
  } = useMobileMusic();

  const [isOpen, setIsOpen] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const location = useLocation();

  // Hide the player panel on login and onboarding routes
  const isHiddenRoute = ['/login', '/onboarding'].some(route => location.pathname.startsWith(route));

  if (isHiddenRoute) return null;

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackName.trim() || !newTrackUrl.trim()) return;
    addCustomTrack(newTrackName.trim(), newTrackUrl.trim());
    setNewTrackName('');
    setNewTrackUrl('');
  };

  const activeTrack = tracks[activeTrackIndex] || tracks[0];

  return (
    <>
      {/* Floating Music Button */}
      <div className="fixed right-4 bottom-24 z-[999] pointer-events-auto">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative w-12 h-12 rounded-full border border-white/20 dark:border-slate-800 shadow-lg flex items-center justify-center transition-all bg-card/85 backdrop-blur-md text-foreground",
            isEnabled && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
          )}
        >
          {isEnabled ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="text-primary"
            >
              <Music className="w-5 h-5" />
            </motion.div>
          ) : (
            <Music className="w-5 h-5 text-muted-foreground opacity-60" />
          )}

          {/* Miniature dancing audio wave bars if playing */}
          {isEnabled && (
            <div className="absolute -bottom-1 flex gap-[2px] items-end h-3">
              <span className="w-[2px] bg-primary rounded-full animate-bounce h-1.5" style={{ animationDelay: '0.1s' }} />
              <span className="w-[2px] bg-primary rounded-full animate-bounce h-2.5" style={{ animationDelay: '0.3s' }} />
              <span className="w-[2px] bg-primary rounded-full animate-bounce h-2" style={{ animationDelay: '0.5s' }} />
            </div>
          )}
        </motion.button>
      </div>

      {/* Slide-up Music Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-end justify-center pointer-events-none">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-sm pointer-events-auto"
            />

            {/* Modal Sheet Card */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-card/95 border-t border-border/80 rounded-t-[2.5rem] shadow-2xl p-6 pb-8 backdrop-blur-xl pointer-events-auto max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Music className="w-6 h-6 text-primary animate-pulse" />
                  <h3 className="font-extrabold text-lg text-foreground">Background Music</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-muted/80 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Main Play Toggle & Volume controls */}
              <div className="bg-muted/40 border border-border/40 rounded-3xl p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Now Playing</span>
                    <p className="font-bold text-sm text-foreground line-clamp-1">
                      {isEnabled ? activeTrack?.name : "Paused"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEnabled(!isEnabled)}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md",
                      isEnabled ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                    )}
                  >
                    {isEnabled ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                  )}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-bold text-muted-foreground w-8 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>

              {/* Track Selection List */}
              <div className="mb-6">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Select Playlist Track</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {tracks.map((track, idx) => {
                    const isSelected = idx === activeTrackIndex;
                    const isCustom = track.isCustom;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "w-full flex items-center justify-between rounded-2xl p-3 border text-left transition-colors cursor-pointer select-none",
                          isSelected
                            ? "bg-primary/5 border-primary/20"
                            : "hover:bg-muted/40 bg-card border-border/80"
                        )}
                        onClick={() => setActiveTrackIndex(idx)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            isSelected ? "bg-primary" : "bg-transparent"
                          )} />
                          <p className={cn(
                            "text-xs font-bold truncate",
                            isSelected ? "text-primary" : "text-foreground"
                          )}>
                            {track.name}
                          </p>
                          {isCustom && (
                            <span className="bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full">Custom</span>
                          )}
                        </div>

                        {isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCustomTrack(idx - PRESET_TRACKS.length);
                            }}
                            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Track Form */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Add Custom Loop</h4>
                <form onSubmit={handleAddTrack} className="flex flex-col gap-2.5">
                  <input
                    type="text"
                    placeholder="Track Name (e.g. My Focus Beats)"
                    value={newTrackName}
                    onChange={(e) => setNewTrackName(e.target.value)}
                    required
                    className="h-10 text-xs px-3 rounded-xl bg-muted/60 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Audio Link URL (.mp3 direct link)"
                      value={newTrackUrl}
                      onChange={(e) => setNewTrackUrl(e.target.value)}
                      required
                      className="flex-1 h-10 text-xs px-3 rounded-xl bg-muted/60 border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="h-10 px-4 bg-primary text-primary-foreground font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
