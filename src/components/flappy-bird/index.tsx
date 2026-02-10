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

const FlappyBirdGame = ({ skills }: { skills: string[] }) => {
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
    targetWords,
    currentWordIndex,
    currentCharIndex,
    keyFragments,
    isRewardUnlocked,
    rewardLink,
    debugCompleteWord,
    debugUnlockAll,
    goToMenu,
  } = useGame(skills);

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
          
          <div style={dividerStyle} className="my-2 h-[1px] w-32 bg-cyan-500/30" />
          
          {/* Progress Section */}
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <div style={{...hintStyle, color: COLORS.cyan, marginBottom: '4px'}}>
              COLLECTIBLES ({keyFragments}/{targetWords.length})
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '4px', 
              maxWidth: '300px', 
              justifyContent: 'center',
              maxHeight: '120px',
              overflowY: 'auto',
              padding: '4px'
            }}>
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
                  <span key={i} style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: bg,
                    border: border,
                    borderRadius: '4px',
                    color: color,
                    opacity: isCollected || isCurrent ? 1 : 0.5
                  }}>
                    {word}
                  </span>
                );
              })}
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
                   cursor: 'pointer'
                 }}
               >
                 🔓 SECRET REWARD UNLOCKED
               </a>
            ) : (
              <div style={{
                marginTop: '12px',
                color: '#555',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                🔒 REWARD LOCKED ({Math.floor((keyFragments / targetWords.length) * 100)}%)
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- PLAYING: HUD ---- */}
      {phase === 'playing' && currentWordIndex < targetWords.length && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '2px',
          background: 'rgba(0,0,0,0.3)',
          padding: '4px 12px',
          borderRadius: '8px',
          pointerEvents: 'none'
        }}>
          {targetWords[currentWordIndex].split('').map((char, i) => {
            const isCollected = i < currentCharIndex;
            return (
              <span key={i} style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: '24px',
                fontWeight: 900,
                color: isCollected ? COLORS.cyan : 'rgba(255,255,255,0.15)',
                textShadow: isCollected ? `0 0 10px ${COLORS.cyan}` : 'none',
                minWidth: '16px',
                textAlign: 'center'
              }}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>
      )}

      {/* ---- DEAD: game over ---- */}
      {phase === 'dead' && (
        <div style={{ ...overlayStyle, background: 'rgba(6,10,20,0.85)' }}>
          <h2 style={gameOverTitleStyle}>GAME OVER</h2>
          <div style={scoreRowStyle}>
            <ScoreBox label="SCORE" value={score} color={COLORS.cyan} />
            <div style={dividerStyle} />
            <ScoreBox label="BEST" value={highScore} color={COLORS.magenta} />
          </div>
          
           {/* Progress Mini-View */}
           <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div style={{...hintStyle, fontSize: '10px'}}>Current Word Progress</div>
            <div style={{ color: COLORS.magenta, fontSize: '14px', marginTop: '4px' }}>
               {targetWords[currentWordIndex] || "ALL FILTERED"}
            </div>
          </div>

          <button onClick={start} style={retryBtnStyle}>
            ↻ RETRY
          </button>
          
          <button 
            onClick={goToMenu} 
            style={{
              ...retryBtnStyle,
              background: 'rgba(255,255,255,0.1)',
              marginTop: '8px',
              fontSize: '10px',
              padding: '6px 12px'
            }}
          >
            MAIN MENU
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
