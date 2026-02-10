// ============================================
// FLAPPY BIRD — main shell component
// Renders canvas + HTML overlays (play/game-over)
// ============================================

import { lazy, Suspense, useState, useEffect } from 'react';
import { useGame } from './use-game';

const IS_DEV = import.meta.env.DEV;

// Lazy-load dev debug panel
const DebugPanel = IS_DEV ? lazy(() => import('./debug-panel')) : null;

const COLORS = {
  bg: '#060a14',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  cyanDim: 'rgba(0,255,255,0.4)',
  magentaDim: 'rgba(255,0,255,0.5)',
};

const FlappyBirdGame = ({ skills }: { skills: string[] }) => {
  const [isDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(pointer: fine)').matches
      : false,
  );

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const {
    canvasRef,
    containerRef,
    phase,
    score,
    highScore,
    fps,
    currentSpeed,
    start,
    overrides,
    setOverrides,
    targetWords,
    currentWordIndex,
    currentCharIndex,
    keyFragments,
    wordsCollectedInRun,
    isRewardUnlocked,
    rewardLink,
    debugCompleteWord,
    debugUnlockAll,
    goToMenu,
    resetProgress,
    adjustTime,
  } = useGame(skills);

  const [pauseStartTime, setPauseStartTime] = useState(0);
  const [countDown, setCountDown] = useState<number | null>(null);

  // Countdown Effect
  useEffect(() => {
    if (countDown === null) return;
    if (countDown > 0) {
      const timer = setTimeout(() => setCountDown(countDown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countDown === 0) {
      // Resume!
      setIsPaused(false);
      setCountDown(null);
      setShowQuitConfirm(false);

      // Adjust Time to prevent spawn glitch
      const now = Date.now();
      const duration = now - pauseStartTime;
      adjustTime(duration);

      setOverrides({ ...overrides, speedMultiplier: 1, gravity: null });
    }
  }, [countDown, pauseStartTime, overrides, setOverrides, adjustTime]);

  // Global Key Listener for Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (phase === 'playing') {
          // Toggle Pause
          if (isPaused) {
            // Only resume if not already confirming quit?
            // Or just start countdown
            if (countDown === null) {
              setCountDown(3);
            }
          } else {
            // Pause
            setIsPaused(true);
            setPauseStartTime(Date.now());
            setOverrides({ ...overrides, speedMultiplier: 0, gravity: 0 });
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isPaused, overrides, setOverrides, countDown]); // Add dependencies

  if (!isDesktop) return null;

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="hidden lg:flex w-full relative items-center justify-center"
      style={{
        width: '100%',
        height: 'clamp(400px, 75vh, 900px)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        border: '1px solid rgba(0,255,255,0.15)',
        boxShadow:
          '0 0 20px rgba(0,255,255,0.06), inset 0 0 15px rgba(0,255,255,0.02)',
        background: COLORS.bg,
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef as React.RefObject<HTMLCanvasElement>}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: phase === 'playing' ? 'pointer' : 'default',
        }}
      />

      {/* ---- Pause Button (Visible during play) ---- */}
      {phase === 'playing' && !isPaused && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOverrides({ ...overrides, speedMultiplier: 0, gravity: 0 });
            setIsPaused(true);
            setPauseStartTime(Date.now());
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 50,
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${COLORS.cyanDim}`,
            color: COLORS.cyan,
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontFamily: "'Orbitron', monospace",
          }}
        >
          II
        </button>
      )}

      {/* ---- PLAYING: Score Overlay ---- */}
      {phase === 'playing' && (
        <div
          style={{
            position: 'absolute',
            top: '36px',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: '10px',
            pointerEvents: 'none',
            fontFamily: "'Orbitron', monospace",
            fontWeight: 'bold',
            fontSize: '28px',
            color: COLORS.cyan,
            textShadow: '0 0 10px #ff00ff',
          }}
        >
          <span>{score}</span>
          <span style={{ fontSize: '14px', opacity: 0.8, color: '#fff' }}>
            {(1 + wordsCollectedInRun * 0.2).toFixed(1)}x
          </span>
        </div>
      )}

      {/* ---- IDLE: play button ---- */}
      {phase === 'idle' && (
        <div style={overlayStyle}>
          <h2 style={titleStyle}>CYBER FLAP</h2>
          <button onClick={start} style={playBtnStyle}>
            ▶ PLAY
          </button>
          <span style={hintStyle}>SPACE / CLICK TO FLAP</span>
          {highScore > 0 && (
            <span style={{ ...hintStyle, color: COLORS.magentaDim }}>
              HIGH SCORE: {highScore}
            </span>
          )}

          <div
            style={dividerStyle}
            className="my-2 h-[1px] w-32 bg-cyan-500/30"
          />

          {/* Progress Section */}
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <div
              style={{ ...hintStyle, color: COLORS.cyan, marginBottom: '4px' }}
            >
              COLLECTIBLES ({keyFragments}/{targetWords.length})
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                maxWidth: '300px',
                justifyContent: 'center',
                maxHeight: '120px',
                overflowY: 'auto',
                padding: '4px',
              }}
            >
              {targetWords.map((word, i) => {
                const isCollected = i < currentWordIndex;
                const isCurrent = i === currentWordIndex;
                let color = '#555';
                let bg = 'transparent';
                let border = '1px solid transparent';

                if (isCollected) {
                  color = COLORS.cyan;
                  bg = 'rgba(0,255,255,0.1)';
                  border = '1px solid rgba(0,255,255,0.2)';
                } else if (isCurrent) {
                  color = '#fff';
                  bg = 'rgba(255,0,255,0.1)';
                  border = '1px dashed rgba(255,0,255,0.5)';
                }

                return (
                  <span
                    key={i}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: bg,
                      border: border,
                      borderRadius: '4px',
                      color: color,
                      opacity: isCollected || isCurrent ? 1 : 0.5,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>

            {/* Reset Progress Button */}
            <div style={{ marginTop: '16px' }}>
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ff4444',
                    color: '#ff4444',
                    fontSize: '10px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: "'Orbitron', monospace",
                    opacity: 0.7,
                  }}
                >
                  RESET PROGRESS
                </button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '10px', color: '#ff4444' }}>
                    ARE YOU SURE?
                  </span>
                  <button
                    onClick={() => {
                      resetProgress();
                      setShowResetConfirm(false);
                    }}
                    style={{
                      background: '#ff4444',
                      color: '#fff',
                      border: 'none',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    YES
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #555',
                      color: '#555',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    NO
                  </button>
                </div>
              )}
            </div>

            {isRewardUnlocked ? (
              <a
                href={rewardLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: '12px',
                  color: '#00ff00',
                  textShadow: '0 0 10px #00ff00',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: '1px solid #00ff00',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                🔓 SECRET REWARD UNLOCKED
              </a>
            ) : (
              <div
                style={{
                  marginTop: '12px',
                  color: '#555',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                🔒 REWARD LOCKED (
                {Math.floor((keyFragments / targetWords.length) * 100)}%)
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- PLAYING: HUD ---- */}
      {phase === 'playing' && currentWordIndex < targetWords.length && (
        <div
          style={{
            position: 'absolute',
            top: '80px', // Lowered from 20px
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '2px',
            background: 'rgba(0,0,0,0.3)',
            padding: '4px 12px',
            borderRadius: '8px',
            pointerEvents: 'none',
            zIndex: 5, // Ensure it's above some things but below overlays
          }}
        >
          {targetWords[currentWordIndex].split('').map((char, i) => {
            const isCollected = i < currentCharIndex;
            return (
              <span
                key={i}
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '24px',
                  fontWeight: 900,
                  color: isCollected ? COLORS.cyan : 'rgba(255,255,255,0.15)',
                  textShadow: isCollected ? `0 0 10px ${COLORS.cyan}` : 'none',
                  minWidth: '16px',
                  textAlign: 'center',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>
      )}

      {/* ---- PAUSE MENU ---- */}
      {isPaused && (
        <div style={{ ...overlayStyle, background: 'rgba(0,0,0,0.85)' }}>
          {countDown !== null ? (
            // Countdown View
            <div
              style={{
                fontSize: '64px',
                color: COLORS.cyan,
                fontWeight: 900,
                animation: 'pulse 0.5s infinite',
              }}
            >
              {countDown === 0 ? 'GO!' : countDown}
            </div>
          ) : (
            <>
              <h2 style={{ ...titleStyle, fontSize: '18px' }}>PAUSED</h2>

              {!showQuitConfirm ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    alignItems: 'center',
                  }}
                >
                  <button
                    onClick={() => setCountDown(3)} // Start countdown
                    style={playBtnStyle}
                  >
                    RESUME
                  </button>
                  <button
                    onClick={() => setShowQuitConfirm(true)}
                    style={{
                      ...retryBtnStyle,
                      background: COLORS.cyan,
                      color: COLORS.bg,
                      opacity: 1,
                      border: 'none',
                    }}
                  >
                    MAIN MENU
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  <p
                    style={{
                      color: COLORS.cyan,
                      fontFamily: "'Orbitron', monospace",
                      fontSize: '14px',
                      marginBottom: '8px',
                    }}
                  >
                    RETURN TO MENU? <br />
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>
                      CURRENT RUN PROGRESS WILL BE LOST
                    </span>
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => {
                        setIsPaused(false);
                        setShowQuitConfirm(false);
                        goToMenu();
                        setOverrides({
                          ...overrides,
                          speedMultiplier: 1,
                          gravity: null,
                        });
                      }}
                      style={{
                        ...retryBtnStyle,
                        background: '#ff4444',
                        color: '#fff',
                        border: 'none',
                      }}
                    >
                      YES
                    </button>
                    <button
                      onClick={() => setShowQuitConfirm(false)}
                      style={{ ...retryBtnStyle }}
                    >
                      NO
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ---- DEAD: game over ---- */}
      {phase === 'dead' && (
        <div style={{ ...overlayStyle, background: 'rgba(6,10,20,0.95)' }}>
          <h2 style={gameOverTitleStyle}>GAME OVER</h2>

          {/* Scoring Detail */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '16px',
              background: 'rgba(0,255,255,0.05)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(0,255,255,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#888',
                fontFamily: 'monospace',
              }}
            >
              BASE SCORE: {score}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: COLORS.magenta,
                fontFamily: 'monospace',
              }}
            >
              MULTIPLIER: x{(1 + wordsCollectedInRun * 0.2).toFixed(1)}{' '}
              <span style={{ opacity: 0.5 }}>
                ({wordsCollectedInRun} WORDS)
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '1px',
                background: '#333',
                margin: '4px 0',
              }}
            />
            <div
              style={{
                fontSize: '24px',
                color: COLORS.cyan,
                fontWeight: 'bold',
                fontFamily: "'Orbitron', monospace",
              }}
            >
              {Math.round(score * (1 + wordsCollectedInRun * 0.2))}
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>FINAL SCORE</div>
          </div>

          <div style={scoreRowStyle}>
            {/* Show High Score separately */}
            <ScoreBox label="BEST" value={highScore} color={COLORS.magenta} />
          </div>

          {/* Progress Mini-View */}
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <div style={{ ...hintStyle, fontSize: '10px' }}>Word Progress</div>
            <div
              style={{ color: COLORS.cyan, fontSize: '14px', marginTop: '2px' }}
            >
              {targetWords[currentWordIndex] || 'ALL FILTERED'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button onClick={start} style={retryBtnStyle}>
              ↻ RETRY
            </button>
            <button
              onClick={goToMenu}
              style={{
                ...retryBtnStyle,
                background: COLORS.cyan, // More visible
                color: COLORS.bg,
                fontWeight: 900,
              }}
            >
              MENU
            </button>
          </div>
        </div>
      )}

      {/* ---- DEV DEBUG PANEL ---- */}
      {IS_DEV && DebugPanel && (
        <Suspense fallback={null}>
          <DebugPanel
            overrides={overrides}
            onChange={setOverrides}
            fps={fps}
            score={score}
            speed={currentSpeed}
            onCompleteWord={debugCompleteWord}
            onUnlockAll={debugUnlockAll}
          />
        </Suspense>
      )}
    </div>
  );
};

// ---- Sub-components ----

function ScoreBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: '10px',
          color: color === COLORS.cyan ? COLORS.cyanDim : COLORS.magentaDim,
          letterSpacing: '1px',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: '22px',
          fontWeight: 700,
          color,
          textShadow: `0 0 12px ${color}`,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ---- Styles ----

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px',
  background: 'rgba(6,10,20,0.55)',
  zIndex: 10,
};

const titleStyle: React.CSSProperties = {
  fontFamily: "'Orbitron', monospace",
  fontSize: '22px',
  fontWeight: 900,
  color: COLORS.cyan,
  textShadow: `0 0 18px ${COLORS.magenta}, 0 0 40px rgba(0,255,255,0.25)`,
  margin: 0,
  letterSpacing: '3px',
};

const gameOverTitleStyle: React.CSSProperties = {
  fontFamily: "'Orbitron', monospace",
  fontSize: '26px',
  fontWeight: 900,
  color: '#ff0055',
  textShadow: '0 0 22px rgba(255,0,85,0.5)',
  margin: 0,
  letterSpacing: '3px',
};

const btnBase: React.CSSProperties = {
  fontFamily: "'Orbitron', monospace",
  fontSize: '13px',
  fontWeight: 700,
  color: COLORS.bg,
  background: `linear-gradient(135deg, ${COLORS.cyan}, #00e5ff)`,
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  letterSpacing: '2px',
  boxShadow: '0 0 18px rgba(0,255,255,0.35)',
  transition: 'transform 0.15s, box-shadow 0.15s',
};

const playBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '10px 30px',
};

const retryBtnStyle: React.CSSProperties = {
  ...btnBase,
  padding: '9px 26px',
  marginTop: '4px',
};

const hintStyle: React.CSSProperties = {
  fontFamily: "'Orbitron', monospace",
  fontSize: '9px',
  color: COLORS.cyanDim,
  letterSpacing: '1px',
};

const scoreRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '28px',
  alignItems: 'center',
};

const dividerStyle: React.CSSProperties = {
  width: '1px',
  height: '36px',
  background: 'rgba(0,255,255,0.15)',
};

export default FlappyBirdGame;
