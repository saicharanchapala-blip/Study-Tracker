import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Maximize2,
  Minimize2,
  CloudRain,
  Waves,
  Flame,
  Coffee,
  Trees,
  Headphones,
  Home,
  Clock,
  GraduationCap,
  History,
  Music2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  Disc,
  Search,
  Zap,
  Moon,
  Sun,
  Wind,
  BookOpen,
  Bell,
  Activity,
  Filter,
  Timer,
} from 'lucide-react';
import {
  AMBIENT_TRACKS,
  AmbientTrack,
  soundEngine,
} from '../utils/soundSynthesizer';
import {
  SOUND_CATEGORIES,
  SoundCategory,
} from '../utils/ambientSoundLibrary';

interface AmbientSoundBottomBarProps {
  activeTab: 'dashboard' | 'timer' | 'deadlines' | 'history';
  onSelectTab: (tab: 'dashboard' | 'timer' | 'deadlines' | 'history') => void;
  isStudyTimerActive?: boolean;
}

export const AmbientSoundBottomBar: React.FC<AmbientSoundBottomBarProps> = ({
  activeTab,
  onSelectTab,
  isStudyTimerActive = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AmbientTrack>(() => {
    return (
      AMBIENT_TRACKS.find((t) => t.id === 'noise_brown_deep') ||
      AMBIENT_TRACKS[0]
    );
  });
  const [volume, setVolume] = useState(0.65);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoPlayWithTimer, setAutoPlayWithTimer] = useState(false);
  const [soundscapeMenuOpen, setSoundscapeMenuOpen] = useState(false);

  // Search and category filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory>('All Sounds');

  // Focus sleep timer in minutes (0 = continuous)
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number>(0);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  // Canvas ref for audio waveform animation
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync state with sound engine
  useEffect(() => {
    setIsPlaying(soundEngine.getIsPlaying());
  }, []);

  // Handle auto-play when study timer starts
  useEffect(() => {
    if (autoPlayWithTimer) {
      if (isStudyTimerActive && !isPlaying) {
        soundEngine.play(currentTrack.id);
        setIsPlaying(true);
      } else if (!isStudyTimerActive && isPlaying) {
        soundEngine.stop();
        setIsPlaying(false);
      }
    }
  }, [isStudyTimerActive, autoPlayWithTimer]);

  // Handle sleep timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && sleepTimerMinutes > 0) {
      if (sleepTimerRemaining === null) {
        setSleepTimerRemaining(sleepTimerMinutes * 60);
      }
      interval = setInterval(() => {
        setSleepTimerRemaining((prev) => {
          if (prev === null || prev <= 1) {
            soundEngine.stop();
            setIsPlaying(false);
            setSleepTimerMinutes(0);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setSleepTimerRemaining(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, sleepTimerMinutes]);

  // Waveform visualization loop
  useEffect(() => {
    let animId: number;
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const bars = 28;
      const barWidth = width / bars;

      for (let i = 0; i < bars; i++) {
        const heightFactor = isPlaying
          ? Math.sin(phase + i * 0.38) * 0.45 + 0.55 + Math.random() * 0.18
          : 0.12;
        const barHeight = Math.max(3, heightFactor * height * 0.88);
        const x = i * barWidth;
        const y = (height - barHeight) / 2;

        ctx.fillStyle = isPlaying ? '#818cf8' : '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(x + 1.5, y, barWidth - 3, barHeight, 2);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.08;
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isPlaying) {
      soundEngine.stop();
      setIsPlaying(false);
    } else {
      soundEngine.setVolume(isMuted ? 0 : volume);
      soundEngine.play(currentTrack.id);
      setIsPlaying(true);
    }
  };

  const handleSelectTrack = (track: AmbientTrack, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentTrack(track);
    if (isPlaying) {
      soundEngine.play(track.id);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (isMuted && newVol > 0) {
      setIsMuted(false);
    }
    soundEngine.setVolume(newVol);
  };

  const handleToggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isMuted) {
      setIsMuted(false);
      soundEngine.setVolume(volume);
    } else {
      setIsMuted(true);
      soundEngine.setVolume(0);
    }
  };

  const getTrackIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'CloudRain':
        return <CloudRain className={className} />;
      case 'Waves':
        return <Waves className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Coffee':
        return <Coffee className={className} />;
      case 'Trees':
        return <Trees className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Moon':
        return <Moon className={className} />;
      case 'Sun':
        return <Sun className={className} />;
      case 'Wind':
        return <Wind className={className} />;
      case 'Bell':
        return <Bell className={className} />;
      case 'Activity':
        return <Activity className={className} />;
      case 'Radio':
        return <Radio className={className} />;
      case 'Headphones':
      default:
        return <Headphones className={className} />;
    }
  };

  // Filter tracks by category and search query
  const filteredTracks = useMemo(() => {
    return AMBIENT_TRACKS.filter((track) => {
      const matchesCategory =
        selectedCategory === 'All Sounds' || track.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        track.name.toLowerCase().includes(q) ||
        track.description.toLowerCase().includes(q) ||
        track.tag.toLowerCase().includes(q) ||
        track.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <>
      {/* Expanded Full Player Sheet (Opens when tapping the mini-player or maximize button) */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity animate-in fade-in">
          <div className="w-full max-w-2xl bg-cream-canvas dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 text-stone-900 dark:text-stone-100 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cream-border/80 dark:border-stone-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cream-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center border border-cream-border dark:border-indigo-900/40">
                  <Music2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold tracking-wide text-stone-900 dark:text-stone-100">
                    Ambient Focus Studio
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    105 Procedural Sounds • 100% Offline • Science-Backed Focus
                  </div>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-ambient-player"
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full hover:bg-cream-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Currently Playing Card & Waveform Visualizer */}
            <div className="my-4 p-4 rounded-2xl bg-cream-card dark:bg-stone-850 border border-cream-border dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-center gap-4">
              {/* Vinyl Record */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-cream-100 dark:bg-stone-950 p-1.5 shadow-md border-2 border-cream-border dark:border-stone-800 flex items-center justify-center shrink-0">
                <div
                  className={`w-full h-full rounded-full border border-cream-border dark:border-stone-700/60 flex items-center justify-center relative overflow-hidden ${
                    isPlaying ? 'animate-[spin_9s_linear_infinite]' : ''
                  }`}
                  style={{
                    backgroundImage:
                      'repeating-radial-gradient(circle, rgba(120,120,120,0.08) 0, rgba(120,120,120,0.08) 2px, transparent 3px, transparent 6px)',
                  }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-400 shadow-inner flex items-center justify-center text-white">
                    {getTrackIcon(currentTrack.iconName, 'w-5 h-5')}
                  </div>
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-700" />
                </div>
                {isPlaying && (
                  <span className="absolute top-0 right-0 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                  </span>
                )}
              </div>

              {/* Title & Info */}
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white truncate">{currentTrack.name}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cream-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-cream-border dark:border-indigo-800/40 text-[10px] font-semibold">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    <span>{currentTrack.tag}</span>
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">{currentTrack.description}</p>
                <div className="text-[11px] text-stone-400 mt-0.5 font-medium">
                  Category: <span className="text-stone-700 dark:text-stone-300">{currentTrack.category}</span>
                </div>

                {/* Animated Waveform Canvas */}
                <div className="mt-2 h-6 flex items-center justify-center sm:justify-start">
                  <canvas
                    ref={visualizerCanvasRef}
                    width={220}
                    height={24}
                    className="rounded-lg opacity-85"
                  />
                </div>
              </div>

              {/* Big Play / Pause button */}
              <button
                type="button"
                id="btn-sound-full-play-toggle"
                onClick={handleTogglePlay}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="space-y-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-search-ambient-sounds"
                    placeholder="Search 105 sounds (e.g. brown noise, rain, theta, coffee, ocean)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-cream-50 dark:bg-stone-800/80 border border-cream-border dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {SOUND_CATEGORIES.map((cat) => {
                  const isSel = selectedCategory === cat;
                  const count =
                    cat === 'All Sounds'
                      ? AMBIENT_TRACKS.length
                      : AMBIENT_TRACKS.filter((t) => t.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition cursor-pointer shrink-0 text-xs ${
                        isSel
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                          : 'bg-cream-100 dark:bg-stone-800/70 hover:bg-cream-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 border border-cream-border dark:border-stone-700/60'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Soundscape Grid (Scrollable list of 105 sounds) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-[160px] max-h-[300px]">
              {filteredTracks.length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs">
                  No ambient sounds found matching "{searchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredTracks.map((track) => {
                    const isCur = track.id === currentTrack.id;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => handleSelectTrack(track)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                          isCur
                            ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-stone-900 dark:text-white shadow-xs'
                            : 'border-cream-border dark:border-stone-800 hover:border-amber-300 dark:hover:border-stone-700 bg-cream-card/90 dark:bg-stone-800/40 hover:bg-cream-100 dark:hover:bg-stone-800/70 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isCur ? 'bg-amber-500 text-white shadow-xs' : 'bg-cream-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                          }`}
                        >
                          {getTrackIcon(track.iconName, 'w-4 h-4')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold truncate">{track.name}</span>
                            {isCur && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                            {track.description}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[9px] font-medium text-stone-600 dark:text-stone-400 bg-cream-100 dark:bg-stone-800 px-1.5 py-0.5 rounded border border-cream-border dark:border-stone-700">
                              {track.tag}
                            </span>
                            <span className="text-[9px] text-stone-400 truncate">
                              {track.category}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Volume, Timer & Settings Controls */}
            <div className="mt-3 pt-3 border-t border-cream-border/80 dark:border-stone-800/80 space-y-2.5">
              {/* Volume Slider */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="btn-toggle-sound-mute"
                  onClick={handleToggleMute}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-white transition cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-cream-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-stone-800 dark:accent-stone-200"
                />
                <span className="text-xs font-mono text-stone-500 dark:text-stone-400 w-10 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>

              {/* Bottom Row: Sleep Timer & Auto-Play Options */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Auto-Play Toggle */}
                <label className="flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoPlayWithTimer}
                    onChange={(e) => setAutoPlayWithTimer(e.target.checked)}
                    className="rounded border-cream-border dark:border-stone-700 text-stone-800 focus:ring-amber-400 bg-cream-50 dark:bg-stone-800"
                  />
                  <span>Auto-play with Pomodoro Study Timer</span>
                </label>

                {/* Sleep Timer Preset Selector */}
                <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
                  <Timer className="w-3.5 h-3.5" />
                  <span>Timer:</span>
                  {[0, 15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setSleepTimerMinutes(mins);
                        setSleepTimerRemaining(mins > 0 ? mins * 60 : null);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                        sleepTimerMinutes === mins
                          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                          : 'bg-cream-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 border border-cream-border dark:border-stone-700'
                      }`}
                    >
                      {mins === 0 ? 'Off' : `${mins}m`}
                    </button>
                  ))}
                  {sleepTimerRemaining !== null && (
                    <span className="font-mono text-amber-600 dark:text-amber-400 text-[10px] ml-1">
                      ({Math.floor(sleepTimerRemaining / 60)}m {sleepTimerRemaining % 60}s)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FIXED BOTTOM CONTAINER: Matches the exact Spotify player & dock in user's circled image */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-4 pb-2 pt-1 pointer-events-none">
        <div className="max-w-4xl mx-auto flex flex-col gap-1.5 pointer-events-auto">
          {/* FLOATING MINI-PLAYER (Circled in red in user screenshot) */}
          <div
            id="ambient-mini-player"
            onClick={() => setIsExpanded(true)}
            className="relative overflow-hidden rounded-2xl bg-cream-card/95 dark:bg-stone-900/95 border border-cream-border dark:border-stone-800/90 shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-[1.006] p-2.5 flex items-center justify-between gap-3 text-stone-800 dark:text-stone-100"
          >
            {/* Top Micro-Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-cream-200 dark:bg-stone-800">
              <div
                className={`h-full bg-gradient-to-r from-amber-400 via-teal-400 to-amber-300 transition-all duration-300 ${
                  isPlaying ? 'w-full animate-pulse' : 'w-0'
                }`}
              />
            </div>

            {/* Left: Album/Sound Art + Title & Subtitle */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Vinyl Art Icon */}
              <div
                className={`relative w-11 h-11 rounded-xl bg-cream-100 dark:bg-stone-950 border border-cream-border dark:border-stone-800 flex items-center justify-center shrink-0 shadow-xs ${
                  isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-teal-400 flex items-center justify-center text-white">
                  {getTrackIcon(currentTrack.iconName, 'w-3.5 h-3.5')}
                </div>
                <div className="absolute w-1.5 h-1.5 rounded-full bg-stone-900 border border-stone-600" />
              </div>

              {/* Title & Artist/Tag text matching user's image */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white truncate">
                    {currentTrack.name}
                  </span>
                  {isPlaying && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 uppercase tracking-widest shrink-0">
                      Playing
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate flex items-center gap-1.5 mt-0.5">
                  <span>{currentTrack.category}</span>
                  <span>•</span>
                  <span className="text-amber-800 dark:text-amber-400 font-medium">{currentTrack.tag}</span>
                  <span className="hidden md:inline text-stone-400">• 105 Variations</span>
                </div>
              </div>
            </div>

            {/* Right: Sound Picker icon, Quick Mixer / Presets, and Play/Pause button */}
            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Soundscape Quick Switcher Button */}
              <div className="relative">
                <button
                  type="button"
                  id="btn-soundscape-picker"
                  onClick={() => setSoundscapeMenuOpen(!soundscapeMenuOpen)}
                  title="Switch Ambient Soundscape (105 available)"
                  className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-cream-100 dark:hover:bg-stone-800 transition cursor-pointer"
                >
                  <Radio className="w-4 h-4" />
                </button>

                {/* Quick Dropdown Menu for Soundscapes */}
                {soundscapeMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-72 max-h-80 overflow-y-auto bg-cream-card dark:bg-stone-900 border border-cream-border dark:border-stone-800 rounded-2xl shadow-2xl p-2 text-stone-900 dark:text-white z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-cream-border dark:border-stone-800 pb-1.5">
                      <span className="text-[10px] font-bold text-stone-400 uppercase">
                        Quick Switcher (105 Sounds)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSoundscapeMenuOpen(false);
                          setIsExpanded(true);
                        }}
                        className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold hover:underline"
                      >
                        All 105 →
                      </button>
                    </div>
                    <div className="space-y-1 mt-1">
                      {AMBIENT_TRACKS.slice(0, 16).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            handleSelectTrack(t);
                            setSoundscapeMenuOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between text-left transition cursor-pointer ${
                            t.id === currentTrack.id
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-medium'
                              : 'text-stone-600 dark:text-stone-300 hover:bg-cream-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {getTrackIcon(t.iconName, 'w-3.5 h-3.5')}
                            <span className="truncate">{t.name}</span>
                          </div>
                          {t.id === currentTrack.id && <Check className="w-3 h-3 text-amber-700 dark:text-amber-400" />}
                        </button>
                      ))}
                    </div>
                    <div className="pt-1.5 border-t border-cream-border dark:border-stone-800 mt-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSoundscapeMenuOpen(false);
                          setIsExpanded(true);
                        }}
                        className="w-full py-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-400 hover:bg-cream-100 dark:hover:bg-stone-800 rounded-lg transition"
                      >
                        Browse All 105 Soundscapes in Studio →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Expand Sheet Button */}
              <button
                type="button"
                id="btn-expand-ambient-player"
                onClick={() => setIsExpanded(true)}
                title="Open Ambient Sound Studio (105 sounds)"
                className="hidden sm:flex p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-cream-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Play / Pause Toggle Button */}
              <button
                type="button"
                id="btn-ambient-play-toggle"
                onClick={handleTogglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
                className="w-10 h-10 rounded-full bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* DOCKED BOTTOM NAVIGATION / TOGGLES BAR (Exact match to the lower circled part of user image) */}
          <div
            id="bottom-dock-navigation"
            className="rounded-2xl bg-cream-card/95 dark:bg-stone-900/95 border border-cream-border dark:border-stone-800/90 shadow-xl backdrop-blur-xl px-2 py-1.5 flex items-center justify-around text-stone-500 dark:text-stone-400"
          >
            {/* 1. Home / Overview */}
            <button
              type="button"
              id="dock-tab-dashboard"
              onClick={() => onSelectTab('dashboard')}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-amber-900 dark:text-amber-300 font-semibold bg-cream-100 dark:bg-stone-800'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Home className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] tracking-tight">Home</span>
            </button>

            {/* 2. Timer / Pomodoro */}
            <button
              type="button"
              id="dock-tab-timer"
              onClick={() => onSelectTab('timer')}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition cursor-pointer ${
                activeTab === 'timer'
                  ? 'text-amber-900 dark:text-amber-300 font-semibold bg-cream-100 dark:bg-stone-800'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Clock className={`w-5 h-5 ${activeTab === 'timer' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] tracking-tight">Focus Timer</span>
            </button>

            {/* 3. Deadlines / Classroom */}
            <button
              type="button"
              id="dock-tab-deadlines"
              onClick={() => onSelectTab('deadlines')}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition cursor-pointer ${
                activeTab === 'deadlines'
                  ? 'text-amber-900 dark:text-amber-300 font-semibold bg-cream-100 dark:bg-stone-800'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <GraduationCap
                className={`w-5 h-5 ${activeTab === 'deadlines' ? 'stroke-[2.5]' : ''}`}
              />
              <span className="text-[10px] tracking-tight">Deadlines</span>
            </button>

            {/* 4. History / Analytics */}
            <button
              type="button"
              id="dock-tab-history"
              onClick={() => onSelectTab('history')}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition cursor-pointer ${
                activeTab === 'history'
                  ? 'text-amber-900 dark:text-amber-300 font-semibold bg-cream-100 dark:bg-stone-800'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <History className={`w-5 h-5 ${activeTab === 'history' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] tracking-tight">History</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
