import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SynthwaveRacerGame } from './game';
import type {
  AudioSettings,
  GameSettings,
  HUDData,
  KeyAction,
  KeyBindings,
  TrackDefinition,
} from './types';
import { DEFAULT_TRACK, TRACKS } from './track-data';

const defaultKeyBindings: KeyBindings = {
  throttle: ['ArrowUp', 'KeyW'],
  brake: ['ArrowDown', 'KeyS', 'Space'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  restart: ['KeyR'],
};

const defaultSettings: GameSettings = {
  bloom: true,
  renderScale: 1,
};

const defaultAudioSettings: AudioSettings = {
  musicEnabled: true,
  musicVolume: 0.5,
  sfxEnabled: true,
  sfxVolume: 0.5,
};

type RemapTarget = {
  action: KeyAction;
  slot: number;
};

const actionLabels: Record<KeyAction, string> = {
  throttle: 'Throttle',
  brake: 'Brake',
  left: 'Steer Left',
  right: 'Steer Right',
  restart: 'Restart',
};

const BOOST_COLORS = [
  'from-fuchsia-500/70 via-purple-500/70 to-cyan-400/70',
  'from-pink-500/70 via-violet-500/70 to-sky-400/70',
];

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const formatTime = (value: number | null): string => {
  if (!value || Number.isNaN(value)) {
    return '--:--.--';
  }
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toFixed(2)
    .padStart(5, '0')}`;
};

const formatKey = (code: string | undefined): string => {
  if (!code) {
    return '—';
  }
  switch (code) {
    case 'ArrowUp':
      return '↑';
    case 'ArrowDown':
      return '↓';
    case 'ArrowLeft':
      return '←';
    case 'ArrowRight':
      return '→';
    case 'Space':
      return 'Space';
    default:
      return code.replace('Key', '');
  }
};

const SynthwaveRacer = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<SynthwaveRacerGame | null>(null);
  const activeTrackRef = useRef<string>(DEFAULT_TRACK.id);
  const audioSettingsRef = useRef<AudioSettings>(defaultAudioSettings);

  const [hud, setHud] = useState<HUDData>({
    boost: 0,
    speedKph: 0,
    currentTime: 0,
    bestTime: null,
    lapProgress: 0,
    boostUptimeRatio: 0,
    offTrackRatio: 0,
    runActive: false,
  });
  const [keyBindings, setKeyBindings] =
    useState<KeyBindings>(defaultKeyBindings);
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [audioSettings, setAudioSettings] =
    useState<AudioSettings>(defaultAudioSettings);
  const [remapTarget, setRemapTarget] = useState<RemapTarget | null>(null);
  const [leftHandedMobile, setLeftHandedMobile] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState(DEFAULT_TRACK.id);
  const [activeTrackId, setActiveTrackId] = useState(DEFAULT_TRACK.id);
  const [bestTimes, setBestTimes] = useState<Record<string, number | null>>(
    () => {
      const initial: Record<string, number | null> = {};
      TRACKS.forEach((track) => {
        initial[track.id] = null;
      });
      return initial;
    },
  );

  const bestTime = bestTimes[activeTrackId] ?? null;

  const musicTracks = useMemo(() => {
    const modules = import.meta.glob('../../assets/music/*.mp3', {
      eager: true,
      import: 'default',
    }) as Record<string, string>;
    return Object.values(modules);
  }, []);

  const enterFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el || document.fullscreenElement) {
      return;
    }
    const anyEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    try {
      if (anyEl.requestFullscreen) {
        await anyEl.requestFullscreen();
      } else if (anyEl.webkitRequestFullscreen) {
        await anyEl.webkitRequestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen request rejected', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      return;
    }
    const anyDoc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (anyDoc.webkitExitFullscreen) {
        await anyDoc.webkitExitFullscreen();
      }
    } catch (error) {
      console.warn('Failed to exit fullscreen', error);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener(
      'webkitfullscreenchange',
      handleFullscreenChange as EventListener,
    );
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    audioSettingsRef.current = audioSettings;
  }, [audioSettings]);

  useEffect(() => {
    activeTrackRef.current = activeTrackId;
  }, [activeTrackId]);

  useEffect(() => {
    const mobile = /Mobi|Android|iPad|iPhone/i.test(
      window.navigator.userAgent,
    );
    setIsMobile(mobile);
    if (!containerRef.current) {
      return;
    }
    const game = new SynthwaveRacerGame(
      containerRef.current,
      {
        keyBindings: defaultKeyBindings,
        settings: defaultSettings,
        isMobile: mobile,
        track: DEFAULT_TRACK,
      },
      {
        onHUDUpdate: (data) => {
          setHud(data);
        },
        onRunComplete: (_sample, newBest) => {
          const trackId = activeTrackRef.current;
          if (newBest !== null) {
            setBestTimes((prev) => ({
              ...prev,
              [trackId]: newBest,
            }));
          }
        },
      },
    );
    gameRef.current = game;
    game.setAudioSettings(defaultAudioSettings);
    if (musicTracks.length) {
      game.setMusicLibrary(musicTracks);
    }
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, [musicTracks]);

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.setKeyBindings(keyBindings);
    }
  }, [keyBindings]);

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.updateSettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.setAudioSettings(audioSettings);
    }
  }, [audioSettings]);

  useEffect(() => {
    if (!gameRef.current) {
      return;
    }
    const disable = menuVisible || settingsVisible || remapTarget !== null;
    gameRef.current.setHardwareInputEnabled(!disable);
  }, [menuVisible, settingsVisible, remapTarget]);

  useEffect(() => {
    if (!remapTarget) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      event.preventDefault();
      const code = event.code;
      setKeyBindings((prev) => {
        const primary = defaultKeyBindings[remapTarget.action][0];
        const fallbackAlt = defaultKeyBindings[remapTarget.action][1];
        const alternate = code === primary ? fallbackAlt : code;
        return {
          ...prev,
          [remapTarget.action]: [primary, alternate],
        };
      });
      setRemapTarget(null);
    };
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [remapTarget]);

  const handleMobileControl = useCallback(
    (action: KeyAction, active: boolean) => {
      gameRef.current?.setVirtualInput(action, active);
    },
    [],
  );

  const selectedTrack = useMemo<TrackDefinition>(() => {
    return TRACKS.find((track) => track.id === selectedTrackId) ?? DEFAULT_TRACK;
  }, [selectedTrackId]);

  const activeTrack = useMemo<TrackDefinition>(() => {
    return TRACKS.find((track) => track.id === activeTrackId) ?? selectedTrack;
  }, [activeTrackId, selectedTrack]);

  const boostGradient = useMemo(
    () => BOOST_COLORS[Math.round(hud.boost) % BOOST_COLORS.length],
    [hud.boost],
  );

  const applyTrackToBestTimes = useCallback((trackId: string) => {
    setBestTimes((prev) => {
      if (prev[trackId] !== undefined) {
        return prev;
      }
      return { ...prev, [trackId]: null };
    });
  }, []);

  const loadTrackIntoGame = useCallback(
    (track: TrackDefinition) => {
      applyTrackToBestTimes(track.id);
      setActiveTrackId(track.id);
      activeTrackRef.current = track.id;
      gameRef.current?.loadTrack(track);
    },
    [applyTrackToBestTimes],
  );

  const handleStartRun = useCallback(
    async (forceReload = false) => {
      const track = TRACKS.find((item) => item.id === selectedTrackId) ?? DEFAULT_TRACK;
      if (forceReload || activeTrackRef.current !== track.id) {
        loadTrackIntoGame(track);
      }
      setMenuVisible(false);
      setSettingsVisible(false);
      setHasInteracted(true);
      if (!document.fullscreenElement) {
        await enterFullscreen();
      }
      if (gameRef.current) {
        gameRef.current.setAudioSettings(audioSettingsRef.current);
        gameRef.current.startRun();
      }
    },
    [enterFullscreen, loadTrackIntoGame, selectedTrackId],
  );

  const handleInstantRestart = useCallback(async () => {
    const track = TRACKS.find((item) => item.id === selectedTrackId) ?? DEFAULT_TRACK;
    loadTrackIntoGame(track);
    setMenuVisible(false);
    setHasInteracted(true);
    if (!document.fullscreenElement) {
      await enterFullscreen();
    }
    if (gameRef.current) {
      gameRef.current.setAudioSettings(audioSettingsRef.current);
      gameRef.current.startRun();
    }
  }, [enterFullscreen, loadTrackIntoGame, selectedTrackId]);

  const renderRemapRow = (action: KeyAction) => {
    const bindings = keyBindings[action] || [];
    const primaryKey = defaultKeyBindings[action][0];
    const alternateKey = bindings[1] ?? defaultKeyBindings[action][1];
    return (
      <div
        key={action}
        className="flex items-center justify-between gap-3 border border-primary/20 rounded-lg px-3 py-2 bg-base-100/40"
      >
        <div>
          <p className="text-sm font-semibold text-base-content">
            {actionLabels[action]}
          </p>
          <p className="text-xs text-base-content/60">
            Primary: <span className="font-mono">{formatKey(primaryKey)}</span>
            {'  |  '}
            Alt: <span className="font-mono">{formatKey(alternateKey)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={cx(
              'btn btn-xs transition-all',
              remapTarget?.action === action
                ? 'btn-primary'
                : 'btn-outline btn-primary',
            )}
            onClick={() => setRemapTarget({ action, slot: 1 })}
          >
            Remap Alt
          </button>
        </div>
      </div>
    );
  };

  const musicCredit = 'Music by Karl Casey @ White Bat Audio';

  const handleOpenMenu = async () => {
    setMenuVisible(true);
    await exitFullscreen();
  };

  const menuTrackCard = (track: TrackDefinition) => {
    const isSelected = track.id === selectedTrackId;
    const trackBest = bestTimes[track.id];
    return (
      <button
        key={track.id}
        type="button"
        className={cx(
          'text-left border rounded-xl px-4 py-3 transition-all bg-base-100/95 hover:bg-base-100 shadow-lg',
          isSelected ? 'border-primary' : 'border-primary/30',
        )}
        style={isSelected ? { boxShadow: `0 0 18px ${track.color}55` } : undefined}
        onClick={() => setSelectedTrackId(track.id)}
      >
        <div className="flex items-center justify-between">
          <h4
            className="text-sm font-semibold"
            style={{ color: track.color }}
          >
            {track.name}
          </h4>
          <span className="badge badge-sm badge-outline uppercase tracking-[0.25em]">
            {track.difficulty}
          </span>
        </div>
        <p className="mt-2 text-xs text-base-content/70">{track.description}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-primary/75">
          Best:{' '}
          <span className="font-semibold text-base-content">
            {formatTime(trackBest ?? null)}
          </span>
        </p>
      </button>
    );
  };

  return (
    <section className="card compact bg-base-100/70 border border-primary/30 backdrop-blur-xl rounded-xl text-base-content shadow-2xl">
      <div className="card-body">
        <div className="flex flex-col gap-6">
          <div
            ref={wrapperRef}
            className={cx(
              'relative h-[420px] sm:h-[500px] rounded-2xl overflow-hidden border border-primary/30 bg-base-200/90',
              isFullscreen && 'h-full min-h-full rounded-none border-none',
            )}
          >
            <div
              ref={containerRef}
              className="absolute inset-0 w-full h-full z-0"
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 text-xs sm:text-sm font-semibold text-base-content z-10">
              <div className="flex flex-wrap gap-3 items-start">
                <div className="bg-base-100/85 border border-primary/35 px-4 py-2 rounded-lg shadow-lg">
                  <p className="uppercase text-[11px] tracking-widest text-primary/70">
                    Current
                  </p>
                  <p className="text-lg sm:text-xl">
                    {formatTime(hud.currentTime)}
                  </p>
                </div>
                <div className="bg-base-100/85 border border-primary/35 px-4 py-2 rounded-lg shadow-lg">
                  <p className="uppercase text-[11px] tracking-widest text-primary/70">
                    Best
                  </p>
                  <p className="text-lg sm:text-xl">
                    {formatTime(bestTime)}
                  </p>
                </div>
                <div className="bg-base-100/85 border border-primary/35 px-4 py-2 rounded-lg shadow-lg">
                  <p className="uppercase text-[11px] tracking-widest text-primary/70">
                    Speed
                  </p>
                  <p className="text-lg sm:text-xl">
                    {hud.speedKph.toFixed(0)} km/h
                  </p>
                </div>
                <div className="bg-base-100/85 border border-primary/35 px-4 py-2 rounded-lg shadow-lg">
                  <p className="uppercase text-[11px] tracking-[0.4em] text-primary/70">
                    Track
                  </p>
                  <p className="text-lg sm:text-xl">
                    {activeTrack.name}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-base-100/80 border border-primary/30 px-4 py-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1 text-[11px] uppercase tracking-widest text-primary/75">
                    <span>Boost</span>
                    <span>{Math.round(hud.boost * 100)}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-primary/10 overflow-hidden">
                    <div
                      className={cx(
                        'h-full rounded-full transition-all duration-150 bg-gradient-to-r',
                        boostGradient,
                      )}
                      style={{ width: `${Math.min(100, hud.boost * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="bg-base-100/80 border border-primary/30 px-4 py-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1 text-[11px] uppercase tracking-[0.35em] text-primary/75">
                    <span>Lap</span>
                    <span>{Math.round(hud.lapProgress * 100)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-primary/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-150"
                      style={{
                        width: `${Math.min(100, hud.lapProgress * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-base-content/60 text-right uppercase tracking-[0.3em]">
                  Music by Karl Casey @ White Bat Audio
                </p>
              </div>
            </div>
            {(menuVisible || !hasInteracted) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-base-100/90 backdrop-blur-md text-center z-20 pointer-events-auto px-6 border-t border-primary/30">
                <p className="uppercase text-sm tracking-[0.4em] text-primary/70">
                  Synthwave Sprint
                </p>
                <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                  {TRACKS.map(menuTrackCard)}
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    className="btn btn-primary shadow-neon"
                    onClick={() => {
                      void handleStartRun(true);
                    }}
                  >
                    {hasInteracted ? 'Restart & Play' : 'Start Race'}
                  </button>
                  {hasInteracted && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setMenuVisible(false);
                        void handleStartRun(false);
                      }}
                    >
                      Resume
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setSettingsVisible(true)}
                  >
                    Settings
                  </button>
                </div>
                <p className="text-xs text-base-content/70 max-w-lg">
                  Stay on the neon line to charge boost, then unleash it for
                  faster laps. WASD / Arrow keys with Space to brake on desktop,
                  responsive touch controls on mobile.
                </p>
              </div>
            )}
            {settingsVisible && (
              <div className="absolute inset-0 z-30 bg-base-100/90 backdrop-blur-xl pointer-events-auto overflow-y-auto">
                <div className="max-w-3xl mx-auto mt-10 mb-8 p-6 bg-base-100/70 border border-primary/30 rounded-2xl shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold uppercase tracking-[0.3em] text-primary/80">
                      Settings
                    </h3>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => setSettingsVisible(false)}
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 border border-primary/20 rounded-xl px-4 py-4 bg-base-100/60">
                      <h4 className="uppercase text-[11px] tracking-[0.35em] text-primary/70">
                        Performance
                      </h4>
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-base-content/70">Bloom</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={settings.bloom}
                          onChange={(event) =>
                            setSettings((prev) => ({
                              ...prev,
                              bloom: event.target.checked,
                            }))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="flex items-center justify-between text-sm text-base-content/70">
                          Render Scale
                          <span className="text-primary/80">
                            {(settings.renderScale * 100).toFixed(0)}%
                          </span>
                        </span>
                        <input
                          type="range"
                          min={0.6}
                          max={1}
                          step={0.05}
                          value={settings.renderScale}
                          onChange={(event) =>
                            setSettings((prev) => ({
                              ...prev,
                              renderScale: Number.parseFloat(event.target.value),
                            }))
                          }
                          className="range range-primary range-sm"
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-base-content/70">
                          Left-handed touch layout
                        </span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={leftHandedMobile}
                          onChange={(event) =>
                            setLeftHandedMobile(event.target.checked)
                          }
                        />
                      </label>
                    </div>
                    <div className="space-y-3 border border-primary/20 rounded-xl px-4 py-4 bg-base-100/60">
                      <h4 className="uppercase text-[11px] tracking-[0.35em] text-primary/70">
                        Audio
                      </h4>
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-base-content/70">Music</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={audioSettings.musicEnabled}
                          onChange={(event) =>
                            setAudioSettings((prev) => ({
                              ...prev,
                              musicEnabled: event.target.checked,
                            }))
                          }
                        />
                      </label>
                      <div className="flex items-center justify-between text-xs text-base-content/60">
                        <span>Music Volume</span>
                        <span>{Math.round(audioSettings.musicVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={audioSettings.musicVolume}
                        onChange={(event) =>
                          setAudioSettings((prev) => ({
                            ...prev,
                            musicVolume: Number.parseFloat(event.target.value),
                          }))
                        }
                        className="range range-primary range-sm"
                      />
                      <label className="flex items-center justify-between mt-4">
                        <span className="text-sm text-base-content/70">
                          Sound Effects
                        </span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          checked={audioSettings.sfxEnabled}
                          onChange={(event) =>
                            setAudioSettings((prev) => ({
                              ...prev,
                              sfxEnabled: event.target.checked,
                            }))
                          }
                        />
                      </label>
                      <div className="flex items-center justify-between text-xs text-base-content/60">
                        <span>Effects Volume</span>
                        <span>{Math.round(audioSettings.sfxVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={audioSettings.sfxVolume}
                        onChange={(event) =>
                          setAudioSettings((prev) => ({
                            ...prev,
                            sfxVolume: Number.parseFloat(event.target.value),
                          }))
                        }
                        className="range range-primary range-sm"
                      />
                      <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70 pt-2">
                        {musicCredit}
                      </p>
                    </div>
                  </div>
                  <div className="border border-primary/20 rounded-xl px-4 py-4 bg-base-100/60 space-y-3">
                    <h4 className="uppercase text-[11px] tracking-[0.35em] text-primary/70">
                      Controls
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(Object.keys(actionLabels) as KeyAction[]).map(
                        renderRemapRow,
                      )}
                    </div>
                    <p className="text-xs text-base-content/60">
                      Tip: Space bar is mapped to Brake by default. Remapping
                      replaces duplicates automatically.
                    </p>
                    {remapTarget && (
                      <p className="text-xs text-warning/80">
                        Press the new alternate key for {actionLabels[remapTarget.action]}.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="pointer-events-auto absolute top-4 right-4 z-30 flex flex-wrap justify-end gap-2">
              {!menuVisible && (
                <button
                  type="button"
                  className="btn btn-xs btn-outline border-primary/60 bg-base-100/80 text-base-content"
                  onClick={handleOpenMenu}
                >
                  Menu
                </button>
              )}
              {!settingsVisible && (
                <button
                  type="button"
                  className="btn btn-xs btn-outline border-primary/60 bg-base-100/80 text-base-content"
                  onClick={() => setSettingsVisible(true)}
                >
                  Settings
                </button>
              )}
              {isFullscreen ? (
                <button
                  type="button"
                  className="btn btn-xs btn-primary"
                  onClick={() => {
                    void exitFullscreen();
                  }}
                >
                  Exit Fullscreen
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-xs btn-outline border-primary/60 bg-base-100/80 text-base-content"
                  onClick={() => {
                    void enterFullscreen();
                  }}
                >
                  Fullscreen
                </button>
              )}
            </div>
            {isMobile && !menuVisible && (
              <div
                className={cx(
                  'absolute bottom-4 left-4 right-4 flex justify-between gap-6 pointer-events-none',
                  leftHandedMobile && 'flex-row-reverse',
                )}
              >
                <div className="flex gap-3 pointer-events-auto">
                  {(['left', 'right'] as KeyAction[]).map((action) => (
                    <button
                      key={action}
                      type="button"
                      className="btn btn-circle btn-outline border-primary/60 bg-base-100/80 text-base-content text-sm"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        setHasInteracted(true);
                        handleMobileControl(action, true);
                      }}
                      onPointerUp={(event) => {
                        event.preventDefault();
                        handleMobileControl(action, false);
                      }}
                      onPointerLeave={(event) => {
                        event.preventDefault();
                        handleMobileControl(action, false);
                      }}
                      onPointerCancel={(event) => {
                        event.preventDefault();
                        handleMobileControl(action, false);
                      }}
                    >
                      {action === 'left' ? '⟲' : '⟳'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pointer-events-auto">
                  {(['brake', 'throttle'] as KeyAction[]).map((action) => (
                    <button
                      key={action}
                      type="button"
                      className={cx(
                        'btn btn-outline border-primary/60 bg-base-100/80 text-base-content text-sm px-5',
                        action === 'throttle' && 'btn-primary text-black',
                      )}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        setHasInteracted(true);
                        handleMobileControl(action, true);
                      }}
                      onPointerUp={(event) => {
                        event.preventDefault();
                        handleMobileControl(action, false);
                      }}
                      onPointerLeave={(event) => {
                        event.preventDefault();
                        handleMobileControl(action, false);
                      }}
                      onPointerCancel={(event) => {
                        event.preventDefault();
                        handleMobileControl(action, false);
                      }}
                    >
                      {action === 'throttle' ? 'BOOST' : 'BRAKE'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                void handleStartRun(false);
              }}
            >
              {hud.runActive ? 'Resume Boost' : 'Start Run'}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                void handleInstantRestart();
              }}
            >
              Instant Restart
            </button>
            <div className="text-xs text-base-content/60">
              Boost uptime:{' '}
              <span className="font-semibold text-primary/80">
                {(hud.boostUptimeRatio * 100).toFixed(0)}%
              </span>{' '}
              · Off-line:{' '}
              <span className="font-semibold text-error/80">
                {(hud.offTrackRatio * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SynthwaveRacer;
