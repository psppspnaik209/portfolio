// ============================================
// FLAPPY BIRD — main shell component
// Renders canvas + HTML overlays (play/game-over)
// ============================================

import { lazy, Suspense, useState } from 'react';
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

const FlappyBirdGame = () => {
  const [isDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(pointer: fine)').matches
      : false,
  );

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
  } = useGame();

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
        </div>
      )}

      {/* ---- DEAD: game over ---- */}
      {phase === 'dead' && (
        <div style={{ ...overlayStyle, background: 'rgba(6,10,20,0.75)' }}>
          <h2 style={gameOverTitleStyle}>GAME OVER</h2>
          <div style={scoreRowStyle}>
            <ScoreBox label="SCORE" value={score} color={COLORS.cyan} />
            <div style={dividerStyle} />
            <ScoreBox label="BEST" value={highScore} color={COLORS.magenta} />
          </div>
          <button onClick={start} style={retryBtnStyle}>
            ↻ RETRY
          </button>
          <span style={hintStyle}>PRESS ENTER TO RETRY</span>
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
