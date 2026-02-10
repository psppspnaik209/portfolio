import { useRef, useEffect, useCallback, useState } from 'react';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  gravity: 0.22,
  jumpForce: -5.2,
  pipeSpeed: 2.2,
  pipeGap: 175,
  pipeWidth: 50,
  pipeCapHeight: 18,
  pipeCapOverhang: 6,
  pipeFrequency: 2200,
  birdSize: 15,
  minPipeTop: 80,

  bg: '#0a0e1a',
  birdGlow: '#00ffff',
  birdCore: '#00e5ff',
  pipeBody: 'rgba(0, 255, 255, 0.08)',
  pipeBorder: 'rgba(0, 255, 255, 0.45)',
  pipeCap: 'rgba(0, 255, 255, 0.15)',
  pipeCapBorder: 'rgba(0, 255, 255, 0.6)',
  scoreColor: '#00ffff',
  textColor: '#00ffff',
  textShadow: '#ff00ff',
  gridColor: 'rgba(0, 255, 255, 0.04)',
  particleColor: '#00ffff',
};

const LS_KEY = 'cyberflap_highscore';

// ============================================
// TYPES
// ============================================
interface Pipe {
  x: number;
  topHeight: number;
  scored: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
}

type GamePhase = 'idle' | 'playing' | 'dead';

// ============================================
// COMPONENT
// ============================================
const FlappyBirdGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(pointer: fine)').matches
      : false,
  );

  // Overlay state (React-rendered buttons)
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [displayScore, setDisplayScore] = useState(0);
  const [displayHigh, setDisplayHigh] = useState(() => {
    try {
      return parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0;
    } catch {
      return 0;
    }
  });

  const stateRef = useRef({
    birdY: 0,
    birdVelocity: 0,
    pipes: [] as Pipe[],
    particles: [] as Particle[],
    score: 0,
    highScore: 0,
    phase: 'idle' as GamePhase,
    lastPipeTime: 0,
    frame: 0,
    w: 0,
    h: 0,
    animId: 0,
    birdX: 0,
  });

  // ---- helpers ----
  const spawnPipe = useCallback((s: typeof stateRef.current) => {
    const maxTop = s.h - CONFIG.pipeGap - CONFIG.minPipeTop;
    const topH =
      CONFIG.minPipeTop + Math.random() * (maxTop - CONFIG.minPipeTop);
    s.pipes.push({ x: s.w, topHeight: topH, scored: false });
  }, []);

  const saveHigh = useCallback((score: number) => {
    try {
      localStorage.setItem(LS_KEY, String(score));
    } catch {
      /* ignore */
    }
  }, []);

  const resetGame = useCallback(
    (s: typeof stateRef.current) => {
      s.birdY = s.h * 0.42;
      s.birdVelocity = 0;
      s.pipes = [];
      s.particles = [];
      s.score = 0;
      s.lastPipeTime = 0;
      s.frame = 0;
      s.phase = 'idle';
      setPhase('idle');
      setDisplayScore(0);
    },
    [],
  );

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.birdY = s.h * 0.42;
    s.birdVelocity = 0;
    s.pipes = [];
    s.particles = [];
    s.score = 0;
    s.lastPipeTime = Date.now();
    s.frame = 0;
    s.phase = 'playing';
    s.birdVelocity = CONFIG.jumpForce;
    spawnPipe(s);
    setPhase('playing');
    setDisplayScore(0);

    // Load high score
    try {
      s.highScore =
        parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0;
    } catch {
      s.highScore = 0;
    }
    setDisplayHigh(s.highScore);
  }, [spawnPipe]);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;
    s.birdVelocity = CONFIG.jumpForce;
    // Jump particles
    for (let i = 0; i < 4; i++) {
      s.particles.push({
        x: s.birdX,
        y: s.birdY,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        alpha: 0.8,
        size: Math.random() * 2.5 + 1,
      });
    }
  }, []);

  const die = useCallback(
    (s: typeof stateRef.current) => {
      s.phase = 'dead';
      if (s.score > s.highScore) {
        s.highScore = s.score;
        saveHigh(s.score);
      }
      setPhase('dead');
      setDisplayScore(s.score);
      setDisplayHigh(s.highScore);
    },
    [saveHigh],
  );

  // ---- drawing ----
  const drawBg = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, f: number) => {
      ctx.fillStyle = CONFIG.bg;
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = CONFIG.gridColor;
      ctx.lineWidth = 1;
      const gs = 40;
      const off = (f * 0.2) % gs;
      for (let x = -off; x < w; x += gs) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = -off; y < h; y += gs) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }
    },
    [],
  );

  const drawBird = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, vel: number, f: number) => {
      ctx.save();
      ctx.translate(x, y);
      const angle = Math.min(Math.max(vel * 3.5, -25), 60) * (Math.PI / 180);
      ctx.rotate(angle);

      const s = CONFIG.birdSize;

      // Glow halo
      ctx.shadowColor = CONFIG.birdGlow;
      ctx.shadowBlur = 18;
      ctx.fillStyle = 'rgba(0,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(0, 0, s + 5 + Math.sin(f * 0.12) * 2, 0, Math.PI * 2);
      ctx.fill();

      // Body hexagon
      ctx.shadowBlur = 10;
      ctx.fillStyle = CONFIG.birdCore;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = Math.cos(a) * s;
        const py = Math.sin(a) * s;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Inner dark
      ctx.shadowBlur = 0;
      ctx.fillStyle = CONFIG.bg;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.fillStyle = CONFIG.birdGlow;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = CONFIG.birdGlow;
      ctx.lineWidth = 1.5;
      const wy = Math.sin(f * 0.35) * 4;
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, 0);
      ctx.lineTo(-s * 1.6, -s * 0.3 + wy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, 0);
      ctx.lineTo(-s * 1.6, s * 0.3 - wy);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.restore();
    },
    [],
  );

  const drawPipe = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, topH: number, h: number) => {
      const pw = CONFIG.pipeWidth;
      const gap = CONFIG.pipeGap;
      const capH = CONFIG.pipeCapHeight;
      const capO = CONFIG.pipeCapOverhang;
      const bottomY = topH + gap;

      ctx.shadowColor = 'rgba(0,255,255,0.15)';
      ctx.shadowBlur = 8;

      // ---- Top pipe ----
      // Body
      ctx.fillStyle = CONFIG.pipeBody;
      ctx.fillRect(x, 0, pw, topH - capH);
      ctx.strokeStyle = CONFIG.pipeBorder;
      ctx.lineWidth = 1.5;
      // Left edge
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, topH - capH);
      ctx.stroke();
      // Right edge
      ctx.beginPath();
      ctx.moveTo(x + pw, 0);
      ctx.lineTo(x + pw, topH - capH);
      ctx.stroke();

      // Cap
      ctx.fillStyle = CONFIG.pipeCap;
      ctx.fillRect(x - capO, topH - capH, pw + capO * 2, capH);
      ctx.strokeStyle = CONFIG.pipeCapBorder;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - capO, topH - capH, pw + capO * 2, capH);

      // ---- Bottom pipe ----
      // Body
      ctx.fillStyle = CONFIG.pipeBody;
      ctx.fillRect(x, bottomY + capH, pw, h - bottomY - capH);
      ctx.strokeStyle = CONFIG.pipeBorder;
      ctx.lineWidth = 1.5;
      // Left edge
      ctx.beginPath();
      ctx.moveTo(x, bottomY + capH);
      ctx.lineTo(x, h);
      ctx.stroke();
      // Right edge
      ctx.beginPath();
      ctx.moveTo(x + pw, bottomY + capH);
      ctx.lineTo(x + pw, h);
      ctx.stroke();

      // Cap
      ctx.fillStyle = CONFIG.pipeCap;
      ctx.fillRect(x - capO, bottomY, pw + capO * 2, capH);
      ctx.strokeStyle = CONFIG.pipeCapBorder;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - capO, bottomY, pw + capO * 2, capH);

      ctx.shadowBlur = 0;
    },
    [],
  );

  const drawParticles = useCallback(
    (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
      ctx.shadowColor = CONFIG.particleColor;
      ctx.shadowBlur = 4;
      particles.forEach((p) => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = CONFIG.particleColor;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    },
    [],
  );

  const drawLiveScore = useCallback(
    (ctx: CanvasRenderingContext2D, score: number, w: number) => {
      ctx.save();
      ctx.font = "bold 30px 'Orbitron', monospace";
      ctx.textAlign = 'center';
      ctx.fillStyle = CONFIG.scoreColor;
      ctx.shadowColor = CONFIG.textShadow;
      ctx.shadowBlur = 12;
      ctx.fillText(String(score), w / 2, 42);
      ctx.restore();
    },
    [],
  );

  // ---- game loop ----
  const gameLoop = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const s = stateRef.current;
      const { w, h } = s;

      if (w === 0 || h === 0) {
        s.animId = requestAnimationFrame(() => gameLoop(ctx));
        return;
      }

      s.frame++;

      // ---- UPDATE ----
      if (s.phase === 'playing') {
        const now = Date.now();
        s.birdVelocity += CONFIG.gravity;
        s.birdY += s.birdVelocity;

        // Move pipes
        for (const pipe of s.pipes) pipe.x -= CONFIG.pipeSpeed;
        s.pipes = s.pipes.filter((p) => p.x + CONFIG.pipeWidth > -20);

        // Spawn
        if (now - s.lastPipeTime > CONFIG.pipeFrequency) {
          spawnPipe(s);
          s.lastPipeTime = now;
        }

        // Score
        for (const pipe of s.pipes) {
          if (!pipe.scored && pipe.x + CONFIG.pipeWidth < s.birdX) {
            pipe.scored = true;
            s.score++;
            setDisplayScore(s.score);
          }
        }

        // Collision: ceiling / floor
        const r = CONFIG.birdSize * 0.65;
        if (s.birdY + r > h || s.birdY - r < 0) {
          die(s);
        }

        // Collision: pipes
        for (const pipe of s.pipes) {
          if (s.birdX + r > pipe.x && s.birdX - r < pipe.x + CONFIG.pipeWidth) {
            if (
              s.birdY - r < pipe.topHeight ||
              s.birdY + r > pipe.topHeight + CONFIG.pipeGap
            ) {
              die(s);
              break;
            }
          }
        }

        // Trail
        if (s.frame % 4 === 0) {
          s.particles.push({
            x: s.birdX - CONFIG.birdSize * 0.8,
            y: s.birdY,
            vx: -0.8 - Math.random() * 0.5,
            vy: (Math.random() - 0.5) * 1,
            alpha: 0.5,
            size: Math.random() * 2 + 0.5,
          });
        }
      } else if (s.phase === 'idle') {
        // Idle bob
        s.birdY = s.h * 0.42 + Math.sin(s.frame * 0.04) * 12;
      }

      // Update particles
      for (const p of s.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.015;
      }
      s.particles = s.particles.filter((p) => p.alpha > 0);

      // ---- DRAW ----
      ctx.save();
      drawBg(ctx, w, h, s.frame);

      for (const pipe of s.pipes) drawPipe(ctx, pipe.x, pipe.topHeight, h);
      drawParticles(ctx, s.particles);
      drawBird(ctx, s.birdX, s.birdY, s.birdVelocity, s.frame);

      if (s.phase === 'playing') {
        drawLiveScore(ctx, s.score, w);
      }

      ctx.restore();

      s.animId = requestAnimationFrame(() => gameLoop(ctx));
    },
    [spawnPipe, die, drawBg, drawBird, drawPipe, drawParticles, drawLiveScore],
  );

  // ---- canvas setup ----
  useEffect(() => {
    if (!isDesktop) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.w = rect.width;
      s.h = rect.height;
      s.birdX = rect.width * 0.22;
      if (s.phase === 'idle') s.birdY = rect.height * 0.42;
    };

    resize();
    // Load high score from localStorage
    try {
      s.highScore = parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0;
    } catch {
      s.highScore = 0;
    }
    setDisplayHigh(s.highScore);
    s.birdY = s.h * 0.42;
    gameLoop(ctx);

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Input
    const handleClick = () => jump();
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        jump();
      }
      if (e.code === 'Enter' && stateRef.current.phase === 'dead') {
        e.preventDefault();
        startGame();
      }
    };

    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKey);

    return () => {
      cancelAnimationFrame(s.animId);
      ro.disconnect();
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isDesktop, gameLoop, jump, startGame]);

  if (!isDesktop) return null;

  return (
    <div
      ref={containerRef}
      className="hidden lg:flex w-full relative items-center justify-center"
      style={{
        width: '100%',
        height: 'min(45vh, 480px)',
        minHeight: '280px',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        border: '1px solid rgba(0,255,255,0.2)',
        boxShadow:
          '0 0 25px rgba(0,255,255,0.08), inset 0 0 20px rgba(0,255,255,0.02)',
        background: CONFIG.bg,
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'pointer',
        }}
      />

      {/* ---- PLAY BUTTON OVERLAY ---- */}
      {phase === 'idle' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '18px',
            background: 'rgba(10,14,26,0.55)',
            zIndex: 10,
          }}
        >
          <h2
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '24px',
              fontWeight: 900,
              color: CONFIG.textColor,
              textShadow: `0 0 20px ${CONFIG.textShadow}, 0 0 40px rgba(0,255,255,0.3)`,
              margin: 0,
              letterSpacing: '3px',
            }}
          >
            CYBER FLAP
          </h2>
          <button
            onClick={startGame}
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '14px',
              fontWeight: 700,
              color: CONFIG.bg,
              background: 'linear-gradient(135deg, #00ffff, #00e5ff)',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 32px',
              cursor: 'pointer',
              letterSpacing: '2px',
              boxShadow: '0 0 20px rgba(0,255,255,0.4)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow =
                '0 0 30px rgba(0,255,255,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow =
                '0 0 20px rgba(0,255,255,0.4)';
            }}
          >
            ▶ PLAY
          </button>
          <span
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '10px',
              color: 'rgba(0,255,255,0.4)',
              letterSpacing: '1px',
            }}
          >
            SPACE / CLICK TO FLAP
          </span>
          {displayHigh > 0 && (
            <span
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: '11px',
                color: 'rgba(255,0,255,0.5)',
                letterSpacing: '1px',
              }}
            >
              HIGH SCORE: {displayHigh}
            </span>
          )}
        </div>
      )}

      {/* ---- GAME OVER OVERLAY ---- */}
      {phase === 'dead' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'rgba(10,14,26,0.7)',
            zIndex: 10,
          }}
        >
          <h2
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '28px',
              fontWeight: 900,
              color: '#ff0055',
              textShadow: '0 0 25px rgba(255,0,85,0.6)',
              margin: 0,
              letterSpacing: '3px',
            }}
          >
            GAME OVER
          </h2>
          <div
            style={{
              display: 'flex',
              gap: '30px',
              alignItems: 'center',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '10px',
                  color: 'rgba(0,255,255,0.5)',
                  letterSpacing: '1px',
                  marginBottom: '4px',
                }}
              >
                SCORE
              </div>
              <div
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '22px',
                  fontWeight: 700,
                  color: CONFIG.scoreColor,
                  textShadow: `0 0 12px ${CONFIG.textShadow}`,
                }}
              >
                {displayScore}
              </div>
            </div>
            <div
              style={{
                width: '1px',
                height: '36px',
                background: 'rgba(0,255,255,0.2)',
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '10px',
                  color: 'rgba(255,0,255,0.5)',
                  letterSpacing: '1px',
                  marginBottom: '4px',
                }}
              >
                BEST
              </div>
              <div
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#ff00ff',
                  textShadow: '0 0 12px rgba(255,0,255,0.5)',
                }}
              >
                {displayHigh}
              </div>
            </div>
          </div>
          <button
            onClick={startGame}
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '13px',
              fontWeight: 700,
              color: CONFIG.bg,
              background: 'linear-gradient(135deg, #00ffff, #00e5ff)',
              border: 'none',
              borderRadius: '4px',
              padding: '9px 28px',
              cursor: 'pointer',
              letterSpacing: '2px',
              boxShadow: '0 0 18px rgba(0,255,255,0.4)',
              marginTop: '6px',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow =
                '0 0 30px rgba(0,255,255,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow =
                '0 0 18px rgba(0,255,255,0.4)';
            }}
          >
            ↻ RETRY
          </button>
          <span
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: '10px',
              color: 'rgba(0,255,255,0.35)',
              letterSpacing: '1px',
            }}
          >
            PRESS ENTER TO RETRY
          </span>
        </div>
      )}
    </div>
  );
};

export default FlappyBirdGame;
