import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SynthwaveRacerGame } from './game';
import type {
  GameSettings,
  HUDData,
  KeyAction,
  KeyBindings,
  TelemetrySample,
} from './types';

const defaultKeyBindings: KeyBindings = {
  throttle: ['ArrowUp', 'KeyW'],
  brake: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  restart: ['KeyR'],
};

const defaultSettings: GameSettings = {
  bloom: true,
  motionBlur: false,
  renderScale: 1,
};

type RemapTarget = {
  action: KeyAction;
  slot: number;
};

const BOOST_COLORS = [
  'from-fuchsia-500/70 via-purple-500/70 to-cyan-400/70',
  'from-pink-500/70 via-violet-500/70 to-sky-400/70',
];

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
    default:
      return code.replace('Key', '');
  }
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

const SynthwaveRacer = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<SynthwaveRacerGame | null>(null);
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
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetrySample[]>([]);
  const [keyBindings, setKeyBindings] =
    useState<KeyBindings>(defaultKeyBindings);
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [remapTarget, setRemapTarget] = useState<RemapTarget | null>(null);
  const [leftHandedMobile, setLeftHandedMobile] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      },
      {
        onHUDUpdate: (data) => {
          setHud(data);
          if (data.bestTime !== null) {
            setBestTime(data.bestTime);
          }
        },
        onRunComplete: (sample, newBest) => {
          setTelemetry((prev) => [sample, ...prev].slice(0, 10));
          if (newBest !== null) {
            setBestTime(newBest);
          }
        },
      },
    );
    gameRef.current = game;
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

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
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
    };
  }, []);

  useEffect(
    () => () => {
      if (!document.fullscreenElement) {
        return;
      }
      const anyDoc = document as Document & {
        webkitExitFullscreen?: () => Promise<void> | void;
      };
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => undefined);
      } else if (anyDoc.webkitExitFullscreen) {
        anyDoc.webkitExitFullscreen();
      }
    },
    [],
  );

  const enterFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el || document.fullscreenElement) {
      return;
    }
    const anyEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
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
      webkitExitFullscreen?: () => Promise<void>;
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
    gameRef.current.setHardwareInputEnabled(remapTarget === null);
    if (!remapTarget) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      event.preventDefault();
      const code = event.code;
      setKeyBindings((prev) => {
        const existing = prev[remapTarget.action] || [];
        const next = [...existing];
        next[remapTarget.slot] = code;
        const sanitized = next
          .filter((item) => Boolean(item))
          .filter(
            (item, index, arr) => arr.findIndex((entry) => entry === item) === index,
          );
        if (sanitized.length === 0) {
          sanitized.push(code);
        }
        return {
          ...prev,
          [remapTarget.action]: sanitized,
        };
      });
      setRemapTarget(null);
    };

    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [remapTarget]);

  const beginRun = useCallback(
    async (markInteracted = false) => {
      if (markInteracted || !hasInteracted) {
        setHasInteracted(true);
      }
      if (!document.fullscreenElement) {
        await enterFullscreen();
      }
      gameRef.current?.startRun();
    },
    [enterFullscreen, hasInteracted],
  );

  const restartRun = useCallback(async () => {
    setHasInteracted(true);
    if (!gameRef.current) {
      return;
    }
    if (!document.fullscreenElement) {
      await enterFullscreen();
    }
    gameRef.current.restartRun(true);
    gameRef.current.startRun();
  }, [enterFullscreen]);

  const handleMobileControl = useCallback(
    (action: KeyAction, active: boolean) => {
      gameRef.current?.setVirtualInput(action, active);
    },
    [],
  );

  const boostGradient = useMemo(
    () => BOOST_COLORS[Math.round(hud.boost) % BOOST_COLORS.length],
    [hud.boost],
  );

  const renderTelemetryRow = (sample: TelemetrySample) => (
    <tr key={sample.timestamp} className="border-t border-primary/20 text-xs">
      <td className="py-1 pr-2">{sample.runId}</td>
      <td className="py-1 pr-2">{formatTime(sample.duration)}</td>
      <td className="py-1 pr-2">
        {(sample.boostUptimeRatio * 100).toFixed(0)}%
      </td>
      <td className="py-1 pr-2">
        {(sample.offTrackRatio * 100).toFixed(0)}%
      </td>
      <td className="py-1 pr-2">{sample.retries}</td>
      <td className="py-1 pr-2">{sample.dnf ? 'DNF' : '✔'}</td>
    </tr>
  );

  const renderRemapRow = (action: KeyAction) => {
    const bindings = keyBindings[action] || [];
    return (
      <div
        key={action}
        className="flex items-center justify-between gap-3 border border-primary/20 rounded-lg px-3 py-2 bg-base-100/40"
      >
        <div>
          <p className="text-sm font-semibold text-primary-content/80">
            {actionLabels[action]}
          </p>
          <p className="text-xs text-base-content/60">
            Primary: <span className="font-mono">{formatKey(bindings[0])}</span>
            {'  |  '}
            Alt: <span className="font-mono">{formatKey(bindings[1])}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {[0, 1].map((slot) => (
            <button
              key={slot}
              type="button"
              className={cx(
                'btn btn-xs transition-all',
                remapTarget?.action === action && remapTarget?.slot === slot
                  ? 'btn-primary'
                  : 'btn-outline btn-primary',
              )}
              onClick={() => setRemapTarget({ action, slot })}
            >
              Remap {slot === 0 ? 'Primary' : 'Alt'}
            </button>
          ))}
            </div>
          </div>
    );
  };

  return (
    <section className="card compact bg-base-100/70 border border-primary/30 backdrop-blur-xl rounded-xl text-base-content shadow-2xl">
      <div className="card-body">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3 w-full">
            <div
              ref={wrapperRef}
              className={cx(
                'relative h-[420px] sm:h-[480px] rounded-2xl overflow-hidden border border-primary/30 bg-black/60',
                isFullscreen && 'h-full min-h-full rounded-none border-none',
              )}
            >
              <div
                ref={containerRef}
                className="absolute inset-0 w-full h-full z-0"
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 text-xs sm:text-sm font-semibold text-primary-content z-10">
                <div className="flex flex-wrap gap-4">
                  <div className="backdrop-blur-xl bg-black/40 px-4 py-2 rounded-lg shadow-lg">
                    <p className="uppercase text-[11px] tracking-widest text-primary/80">
                      Current
                    </p>
                    <p className="text-lg sm:text-xl">
                      {formatTime(hud.currentTime)}
                    </p>
                  </div>
                  <div className="backdrop-blur-xl bg-black/40 px-4 py-2 rounded-lg shadow-lg">
                    <p className="uppercase text-[11px] tracking-widest text-primary/80">
                      Best
                    </p>
                    <p className="text-lg sm:text-xl">
                      {formatTime(bestTime)}
                    </p>
                  </div>
                  <div className="backdrop-blur-xl bg-black/40 px-4 py-2 rounded-lg shadow-lg">
                    <p className="uppercase text-[11px] tracking-widest text-primary/80">
                      Speed
                    </p>
                    <p className="text-lg sm:text-xl">
                      {hud.speedKph.toFixed(0)} km/h
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="backdrop-blur-xl bg-black/40 px-4 py-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1 text-[11px] uppercase tracking-widest text-primary/70">
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
                  <div className="backdrop-blur-xl bg-black/40 px-4 py-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1 text-[11px] uppercase tracking-[0.35em] text-primary/70">
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
                </div>
              </div>
              {!hasInteracted && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-md text-center">
                  <p className="uppercase text-sm tracking-[0.4em] text-primary/80">
                    Synthwave Sprint
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-wide shadow-neon pointer-events-auto"
                    onClick={() => {
                      void beginRun(true);
                    }}
                  >
                    Start Run
                  </button>
                  <p className="text-xs text-base-content/60 max-w-sm">
                    Follow the neon center line to charge boost, then unleash it
                    for faster lap times. Arrow keys / WASD on desktop, on-screen
                    controls on mobile.
                  </p>
                </div>
              )}
              {isMobile && (
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
                        className="btn btn-circle btn-outline border-primary/60 bg-black/60 text-primary-content/80 text-sm"
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
                          'btn btn-outline border-primary/60 bg-black/60 text-primary-content/80 text-sm px-5',
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
              {isFullscreen && (
                <div className="pointer-events-auto absolute top-4 right-4 z-20 flex">
                  <button
                    type="button"
                    className="btn btn-xs btn-outline border-primary/60 bg-black/60 text-primary-content/80"
                    onClick={() => {
                      void exitFullscreen();
                    }}
                  >
                    Exit Fullscreen
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  void beginRun();
                }}
              >
                {hud.runActive ? 'Resume Boost' : 'Start Run'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={restartRun}
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
          <div className="lg:w-1/3 w-full space-y-4">
            <div className="border border-primary/20 rounded-xl px-4 py-4 bg-base-100/40">
              <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/80 mb-3">
                Performance
              </h3>
              <div className="space-y-3 text-sm">
                <label className="flex items-center justify-between">
                  <span className="text-base-content/70">Bloom</span>
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
                <label className="flex items-center justify-between">
                  <span className="text-base-content/70">Motion Blur</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.motionBlur}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        motionBlur: event.target.checked,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="flex items-center justify-between text-base-content/70">
                    Render Scale{' '}
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
                    className="range range-primary range-xs"
                  />
                </label>
                {isMobile && (
                  <label className="flex items-center justify-between">
                    <span className="text-base-content/70">
                      Left-handed layout
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={leftHandedMobile}
                      onChange={(event) => setLeftHandedMobile(event.target.checked)}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="border border-primary/20 rounded-xl px-4 py-4 bg-base-100/40 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/80">
                Key Bindings
              </h3>
              <div className="space-y-2">{(Object.keys(actionLabels) as KeyAction[]).map(renderRemapRow)}</div>
              {remapTarget && (
                <p className="text-xs text-warning/80">
                  Press the new key for {actionLabels[remapTarget.action]} (
                  {remapTarget.slot === 0 ? 'primary' : 'alternate'}).
                </p>
              )}
            </div>
            <div className="border border-primary/20 rounded-xl px-4 py-4 bg-base-100/40">
              <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/80 mb-2">
                Telemetry
              </h3>
              <div className="overflow-x-auto">
                <table className="table table-zebra text-xs">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.3em] text-primary/70">
                      <th>Run</th>
                      <th>Time</th>
                      <th>Boost</th>
                      <th>Off</th>
                      <th>Retries</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetry.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-4 text-base-content/50"
                        >
                          Complete a run to populate analytics.
                        </td>
                      </tr>
                    ) : (
                      telemetry.map(renderTelemetryRow)
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SynthwaveRacer;
