import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SynthwaveRacerGame } from './game';
import type {
  AudioSettings,
  GameSettings,
  HUDData,
  KeyAction,
  KeyBindings,
  MusicTrackInfo,
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

type CompletionSnapshot = {
  trackId: string;
  time: number;
  bestTime: number | null;
};

const actionLabels: Record<KeyAction, string> = {
  throttle: 'Throttle',
  brake: 'Brake',
  left: 'Steer Left',
  right: 'Steer Right',
  restart: 'Restart',
};


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

const formatMusicName = (fileName: string): string => {
  const base = fileName.replace(/\.mp3$/i, '').replace(/[-_]+/g, ' ');
  return base.replace(/\b\w/g, (char) => char.toUpperCase());
};

const musicCredit = 'Music by Karl Casey @ White Bat Audio';

const SynthwaveRacer = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<SynthwaveRacerGame | null>(null);
  const activeTrackRef = useRef<string>(DEFAULT_TRACK.id);
  const audioSettingsRef = useRef<AudioSettings>(defaultAudioSettings);
  const bestTimesRef = useRef<Record<string, number | null>>({});

  const [engineReady, setEngineReady] = useState(false);
  const [booting, setBooting] = useState(false);

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
  const [bestTimes, setBestTimes] = useState<Record<string, number | null>>(() => {
    const initial: Record<string, number | null> = {};
    TRACKS.forEach((track) => {
      initial[track.id] = null;
    });
    bestTimesRef.current = initial;
    return initial;
  });
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(defaultKeyBindings);
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(defaultAudioSettings);
  const [remapTarget, setRemapTarget] = useState<RemapTarget | null>(null);
  const [leftHandedMobile, setLeftHandedMobile] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState(DEFAULT_TRACK.id);
  const [activeTrackId, setActiveTrackId] = useState(DEFAULT_TRACK.id);
  const [lastCompletion, setLastCompletion] = useState<CompletionSnapshot | null>(null);
  const [currentMusic, setCurrentMusic] = useState<MusicTrackInfo | null>(null);

  useEffect(() => {
    bestTimesRef.current = bestTimes;
  }, [bestTimes]);

  useEffect(() => {
    audioSettingsRef.current = audioSettings;
  }, [audioSettings]);

  useEffect(() => {
    if (!gameRef.current) {
      return;
    }
    gameRef.current.setAudioSettings(audioSettings);
  }, [audioSettings]);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPad|iPhone/i.test(window.navigator.userAgent));
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

  const musicTracks = useMemo<MusicTrackInfo[]>(() => {
    const modules = import.meta.glob('../../assets/music/*.mp3', {
      eager: true,
      import: 'default',
    }) as Record<string, string>;
    return Object.entries(modules).map(([path, url]) => {
      const fileName = path.split('/').pop() ?? url;
      return {
        id: fileName,
        name: formatMusicName(fileName),
        url,
      };
    });
  }, []);

  useEffect(() => {
    if (!engineReady) {
      return undefined;
    }
    if (!containerRef.current) {
      return undefined;
    }

    const game = new SynthwaveRacerGame(
      containerRef.current,
      {
        keyBindings: defaultKeyBindings,
        settings: defaultSettings,
        isMobile,
        track: DEFAULT_TRACK,
      },
      {
        onHUDUpdate: (data) => {
          setHud(data);
        },
        onRunComplete: (sample, newBest) => {
          const trackId = activeTrackRef.current;
          const prevBest = bestTimesRef.current[trackId];
          let updatedBest = prevBest ?? null;
          if (!sample.dnf) {
            if (updatedBest === null || sample.duration < updatedBest) {
              updatedBest = sample.duration;
            }
          }
          setBestTimes((prev) => {
            const next = { ...prev, [trackId]: updatedBest };
            bestTimesRef.current = next;
            return next;
          });
          if (!sample.dnf) {
            const bestTime = newBest ?? updatedBest ?? prevBest ?? null;
            setLastCompletion({
              trackId,
              time: sample.duration,
              bestTime,
            });
          } else {
            setLastCompletion(null);
          }
        },
        onMusicTrackChange: (track) => {
          setCurrentMusic(track);
        },
      },
    );

    gameRef.current = game;
    if (musicTracks.length) {
      game.setMusicLibrary(musicTracks);
    }
    game.setAudioSettings(audioSettingsRef.current);
    const bootTrack = TRACKS.find((track) => track.id === activeTrackRef.current) ?? DEFAULT_TRACK;
    game.loadTrack(bootTrack, true);

    return () => {
      game.dispose();
      gameRef.current = null;
      setCurrentMusic(null);
    };
  }, [engineReady, isMobile, musicTracks]);

  useEffect(() => {
    activeTrackRef.current = activeTrackId;
  }, [activeTrackId]);

  const handleBoot = useCallback(() => {
    if (booting || engineReady) {
      return;
    }
    setBooting(true);
    setMenuVisible(true);
    setSettingsVisible(false);
    setHasInteracted(false);
    setLastCompletion(null);
    requestAnimationFrame(() => {
      setEngineReady(true);
      setBooting(false);
    });
  }, [booting, engineReady]);

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
    if (!gameRef.current) {
      return;
    }
    const disable = menuVisible || settingsVisible || remapTarget !== null;
    gameRef.current.setHardwareInputEnabled(!disable);
  }, [menuVisible, settingsVisible, remapTarget]);

  const handleMobileControl = useCallback(
    (action: KeyAction, active: boolean) => {
      gameRef.current?.setVirtualInput(action, active);
    },
    [],
  );

  const applyTrackToBestTimes = useCallback((trackId: string) => {
    setBestTimes((prev) => {
      if (prev[trackId] !== undefined) {
        return prev;
      }
      const next = { ...prev, [trackId]: null };
      bestTimesRef.current = next;
      return next;
    });
  }, []);

  const loadTrackIntoGame = useCallback(
    (track: TrackDefinition) => {
      applyTrackToBestTimes(track.id);
      setActiveTrackId(track.id);
      activeTrackRef.current = track.id;
      setLastCompletion(null);
      gameRef.current?.loadTrack(track);
    },
    [applyTrackToBestTimes],
  );

  const handleStartRun = useCallback(
    async (forceReload = false) => {
      if (!engineReady || !gameRef.current) {
        return;
      }
      const track = TRACKS.find((item) => item.id === selectedTrackId) ?? DEFAULT_TRACK;
      if (forceReload || activeTrackRef.current !== track.id) {
        loadTrackIntoGame(track);
      }
      setMenuVisible(false);
      setSettingsVisible(false);
      setHasInteracted(true);
      setLastCompletion(null);
      if (!document.fullscreenElement) {
        await enterFullscreen();
      }
      gameRef.current.startRun();
    },
    [engineReady, selectedTrackId, loadTrackIntoGame, enterFullscreen],
  );

  const handleInstantRestart = useCallback(async () => {
    if (!engineReady || !gameRef.current) {
      return;
    }
    const track = TRACKS.find((item) => item.id === selectedTrackId) ?? DEFAULT_TRACK;
    loadTrackIntoGame(track);
    setMenuVisible(false);
    setHasInteracted(true);
    setLastCompletion(null);
    if (!document.fullscreenElement) {
      await enterFullscreen();
    }
    gameRef.current.restartRun(true);
    gameRef.current.startRun();
  }, [engineReady, selectedTrackId, loadTrackIntoGame, enterFullscreen]);

  useEffect(() => {
    if (!remapTarget) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      event.preventDefault();
      const code = event.code;
      const primary = defaultKeyBindings[remapTarget.action][0];
      const fallbackAlt = defaultKeyBindings[remapTarget.action][1];
      const alternate = code === primary ? fallbackAlt : code;
      setKeyBindings((prev) => ({
        ...prev,
        [remapTarget.action]: [primary, alternate],
      }));
      setRemapTarget(null);
    };
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [remapTarget]);

  const selectedTrack = useMemo<TrackDefinition>(() => {
    return TRACKS.find((track) => track.id === selectedTrackId) ?? DEFAULT_TRACK;
  }, [selectedTrackId]);

  const activeTrack = useMemo<TrackDefinition>(() => {
    return TRACKS.find((track) => track.id === activeTrackId) ?? selectedTrack;
  }, [activeTrackId, selectedTrack]);

  const boostColorClass = useMemo(() => {
    if (hud.boost >= 0.75) {
      return 'text-rose-400';
    }
    if (hud.boost >= 0.5) {
      return 'text-amber-300';
    }
    if (hud.boost >= 0.25) {
      return 'text-emerald-400';
    }
    return 'text-sky-400';
  }, [hud.boost]);

  const boostStateLabel = useMemo(() => {
    if (hud.boost >= 0.75) {
      return 'Max';
    }
    if (hud.boost >= 0.5) {
      return 'Hot';
    }
    if (hud.boost >= 0.25) {
      return 'Ready';
    }
    return 'Idle';
  }, [hud.boost]);

  const lapPercent = useMemo(
    () => Math.min(100, Math.round(hud.lapProgress * 100)),
    [hud.lapProgress],
  );

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
              remapTarget?.action === action ? 'btn-primary' : 'btn-outline btn-primary',
            )}
            onClick={() => setRemapTarget({ action, slot: 1 })}
          >
            Remap Alt
          </button>
        </div>
      </div>
    );
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
        onClick={() => {
          setSelectedTrackId(track.id);
          setLastCompletion(null);
        }}
      >
        <div className="flex items-center justify-between">
          <h4
            className="text-sm font-semibold"
            style={{ color: track.color }}
          >
            {track.name}
          </h4>
          <span className="badge badge-sm badge-outline uppercase tracking-[0.25em] text-[10px]">
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

  if (!engineReady) {
    return (
      <section className="card compact bg-base-100/70 border border-primary/30 backdrop-blur-xl rounded-xl text-base-content shadow-2xl">
        <div className="card-body">
          <div className="flex flex-col items-center gap-4 text-center py-12">
            <h2 className="text-2xl font-semibold uppercase tracking-[0.35em] text-primary/80">
              Synthwave Sprint
            </h2>
            <p className="max-w-md text-sm text-base-content/70">
              Launch a neon-drenched F1 time trial. Press play to load the track hub and jump straight into
              Albert Park, Monaco, or Jeddah.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-wide shadow-neon"
              onClick={handleBoot}
              disabled={booting}
            >
              {booting ? 'Loading…' : 'Play'}
            </button>
          </div>
        </div>
      </section>
    );
  }

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
            <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />
            <div className="pointer-events-none absolute inset-0 z-10 text-xs sm:text-sm font-semibold text-base-content">
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="bg-base-100/85 border border-primary/35 px-3 py-2 rounded-lg shadow-lg">
                  <p className="uppercase text-[10px] tracking-[0.4em] text-primary/70">Current</p>
                  <p className="text-lg sm:text-xl">{formatTime(hud.currentTime)}</p>
                </div>
                <div className="bg-base-100/85 border border-primary/35 px-3 py-2 rounded-lg shadow-lg">
                  <p className="uppercase text-[10px] tracking-[0.4em] text-primary/70">Best</p>
                  <p className="text-lg sm:text-xl">{formatTime(bestTimes[activeTrackId] ?? null)}</p>
                </div>
              </div>
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                <div className="bg-base-100/85 border border-primary/35 px-3 py-2 rounded-lg shadow-lg text-right">
                  <p className="uppercase text-[10px] tracking-[0.4em] text-primary/70">Speed</p>
                  <p className="text-lg sm:text-xl">{hud.speedKph.toFixed(0)} km/h</p>
                </div>
                <div className="bg-base-100/85 border border-primary/35 px-3 py-2 rounded-lg shadow-lg text-right">
                  <p className="uppercase text-[10px] tracking-[0.4em] text-primary/70">Track</p>
                  <p className="text-lg sm:text-xl">{activeTrack.name}</p>
                </div>
              </div>
              <div
                className={cx(
                  'absolute left-4 flex flex-col gap-2',
                  'top-1/2 -translate-y-1/2',
                )}
              >
                <div className="px-3 py-2 rounded-lg bg-base-100/75 border border-primary/30 shadow-lg uppercase tracking-[0.35em] text-[10px] sm:text-xs flex items-center gap-2">
                  <span className="text-base-content/70">⚡</span>
                  <span className="text-base-content/70">Boost</span>
                  <span className={cx('ml-1', boostColorClass)}>
                    {Math.round(hud.boost * 100)}%
                  </span>
                  <span className="text-base-content/60">{boostStateLabel.toUpperCase()}</span>
                </div>
                <div className="px-3 py-2 rounded-lg bg-base-100/75 border border-primary/30 shadow-lg uppercase tracking-[0.35em] text-[10px] sm:text-xs flex items-center gap-2 text-emerald-400">
                  <span className="text-base-content/70">🏁</span>
                  <span className="text-base-content/60">Lap</span>
                  <span className="ml-1">{lapPercent}%</span>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-right text-[10px] sm:text-xs uppercase tracking-[0.35em] text-base-content/70">
                <p>
                  Boost uptime{' '}
                  <span className="text-primary/80">
                    {(hud.boostUptimeRatio * 100).toFixed(0)}%
                  </span>{' '}
                  · Off-line{' '}
                  <span className="text-error/70">
                    {(hud.offTrackRatio * 100).toFixed(0)}%
                  </span>
                </p>
              </div>
              <div className="absolute bottom-4 left-4 text-[10px] sm:text-xs uppercase tracking-[0.35em] text-primary/70">
                <p>
                  {musicCredit} · Track:{' '}
                  <span className="text-base-content">{activeTrack.name}</span>
                  {currentMusic ? (
                    <>
                      {' '}· Now Playing:{' '}
                      <span className="text-base-content">{currentMusic.name}</span>
                    </>
                  ) : (
                    <> · Now Playing:{' '}<span className="text-base-content">—</span></>
                  )}
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
                  Stay on the neon line to charge boost, then unleash it for faster laps. WASD / Arrow keys with
                  Space to brake on desktop, responsive touch controls on mobile.
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
                          onChange={(event) => setLeftHandedMobile(event.target.checked)}
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
                      <div className="rounded-lg border border-primary/20 bg-base-100/70 px-3 py-3">
                        <div className="flex items-center justify-between text-xs text-base-content/60">
                          <span>Now Playing</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-primary pointer-events-auto"
                            onClick={() => {
                              gameRef.current?.skipMusicTrack();
                            }}
                            disabled={!audioSettings.musicEnabled || musicTracks.length === 0}
                          >
                            Skip Track
                          </button>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-base-content">
                          {audioSettings.musicEnabled
                            ? currentMusic?.name ?? '—'
                            : 'Music disabled'}
                        </p>
                      </div>
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
                      {(Object.keys(actionLabels) as KeyAction[]).map(renderRemapRow)}
                    </div>
                    <p className="text-xs text-base-content/60">
                      Default bindings keep Arrow/WASD/Space primaries. Use the Remap Alt button to customize the
                      secondary key without touching the primaries.
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
                  onClick={() => {
                    setMenuVisible(true);
                    setLastCompletion(null);
                    void exitFullscreen();
                  }}
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
            {lastCompletion &&
              lastCompletion.trackId === activeTrackId &&
              !menuVisible &&
              !settingsVisible && (
                <div className="pointer-events-auto absolute top-1/2 right-4 z-20 w-64 -translate-y-1/2 space-y-3 rounded-xl border border-primary/30 bg-base-100/85 px-4 py-4 shadow-xl">
                  <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
                    Lap Complete
                  </p>
                  <p className="text-2xl font-semibold text-base-content">
                    {formatTime(lastCompletion.time)}
                  </p>
                  <p className="text-[11px] text-base-content/60 uppercase tracking-[0.3em]">
                    Best: {formatTime(lastCompletion.bestTime)}
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setLastCompletion(null);
                        void handleInstantRestart();
                      }}
                    >
                      Replay Track
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        setLastCompletion(null);
                        setMenuVisible(true);
                        void exitFullscreen();
                      }}
                    >
                      Quit to Menu
                    </button>
                  </div>
                </div>
              )}
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default SynthwaveRacer;
