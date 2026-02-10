// ============================================
// GAME ENGINE — physics, collision, spawning
// No rendering logic here.
// ============================================

import { GAME_CONFIG, getEffectiveGap, getEffectiveSpeed } from './config';
import type { GameState, DebugOverrides } from './types';

/** Create the initial game state */
export function createGameState(): GameState {
  return {
    birdY: 0,
    birdVelocity: 0,
    pipes: [],
    particles: [],
    scorePops: [],
    score: 0,
    highScore: loadHighScore(),
    phase: 'idle',
    lastPipeTime: 0,
    frame: 0,
    w: 0,
    h: 0,
    animId: 0,
    birdX: 0,
    godMode: false,
  };
}

// ---- High score persistence ----

export function loadHighScore(): number {
  try {
    return (
      parseInt(localStorage.getItem(GAME_CONFIG.highScoreKey) || '0', 10) || 0
    );
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(GAME_CONFIG.highScoreKey, String(score));
  } catch {
    /* localStorage may be unavailable */
  }
}

// ---- Pipe spawning ----

export function spawnPipe(s: GameState, overrides?: DebugOverrides): void {
  const gap = overrides?.pipeGap ?? getEffectiveGap(s.score);
  const minTop = GAME_CONFIG.minPipeTop;
  const maxTop = s.h - gap - minTop;
  if (maxTop <= minTop) return; // canvas too small
  const topH = minTop + Math.random() * (maxTop - minTop);
  s.pipes.push({ x: s.w, topHeight: topH, gap, scored: false });
}

// ---- Particles ----

export function emitJumpParticles(s: GameState): void {
  for (let i = 0; i < 5; i++) {
    if (s.particles.length >= GAME_CONFIG.maxParticles) break;
    s.particles.push({
      x: s.birdX,
      y: s.birdY + GAME_CONFIG.birdSize * 0.5,
      vx: (Math.random() - 0.5) * 2,
      vy: 1 + Math.random() * 2,
      alpha: 0.8,
      size: Math.random() * 3 + 1,
      color: '#00ffff',
    });
  }
}

export function emitTrailParticle(s: GameState): void {
  if (s.particles.length >= GAME_CONFIG.maxParticles) return;
  s.particles.push({
    x: s.birdX - GAME_CONFIG.birdSize,
    y: s.birdY + (Math.random() - 0.5) * 6,
    vx: -0.6 - Math.random() * 0.4,
    vy: (Math.random() - 0.5) * 0.6,
    alpha: 0.45,
    size: Math.random() * 2 + 0.5,
    color: '#00ccdd',
  });
}

export function emitScoreParticles(s: GameState, pipeX: number): void {
  for (let i = 0; i < 8; i++) {
    if (s.particles.length >= GAME_CONFIG.maxParticles) break;
    s.particles.push({
      x: pipeX,
      y: s.birdY,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      alpha: 1,
      size: Math.random() * 2.5 + 1,
      color: '#ff00ff',
    });
  }
}

// ---- Main update tick ----

export function updateGameState(
  s: GameState,
  overrides?: DebugOverrides,
): void {
  s.frame++;

  if (s.phase === 'idle') {
    // Idle bob
    s.birdY = s.h * 0.42 + Math.sin(s.frame * 0.04) * 12;
    updateParticles(s);
    return;
  }

  if (s.phase !== 'playing') {
    updateParticles(s);
    updateScorePops(s);
    return;
  }

  const now = Date.now();
  const gravity = overrides?.gravity ?? GAME_CONFIG.gravity;
  const speedMul = overrides?.speedMultiplier ?? 1;
  const effectiveSpeed = getEffectiveSpeed(s.score) * speedMul;
  const isGod = overrides?.godMode ?? s.godMode;

  // Bird physics
  s.birdVelocity += gravity;
  s.birdVelocity = Math.min(s.birdVelocity, GAME_CONFIG.terminalVelocity);
  s.birdY += s.birdVelocity;

  // Move pipes
  for (const pipe of s.pipes) pipe.x -= effectiveSpeed;
  s.pipes = s.pipes.filter((p) => p.x + GAME_CONFIG.pipeWidth > -20);

  // Spawn pipes
  if (now - s.lastPipeTime > GAME_CONFIG.pipeFrequencyMs) {
    spawnPipe(s, overrides);
    s.lastPipeTime = now;
  }

  // Scoring
  for (const pipe of s.pipes) {
    if (!pipe.scored && pipe.x + GAME_CONFIG.pipeWidth < s.birdX) {
      pipe.scored = true;
      s.score++;
      // Score pop effect
      s.scorePops.push({
        x: s.birdX + 20,
        y: s.birdY - 20,
        frame: 0,
        value: s.score,
      });
      emitScoreParticles(s, pipe.x + GAME_CONFIG.pipeWidth);
      if (s.score > s.highScore) {
        s.highScore = s.score;
        saveHighScore(s.score);
      }
    }
  }

  // Collision
  const r = GAME_CONFIG.birdSize * 0.6;
  if (!isGod) {
    // Ceiling / floor
    if (s.birdY + r > s.h || s.birdY - r < 0) {
      s.phase = 'dead';
      return;
    }

    // Pipes
    for (const pipe of s.pipes) {
      if (
        s.birdX + r > pipe.x &&
        s.birdX - r < pipe.x + GAME_CONFIG.pipeWidth
      ) {
        if (
          s.birdY - r < pipe.topHeight ||
          s.birdY + r > pipe.topHeight + pipe.gap
        ) {
          s.phase = 'dead';
          return;
        }
      }
    }
  } else {
    // God mode: clamp bird within canvas bounds (floor/ceiling)
    if (s.birdY + r > s.h) {
      s.birdY = s.h - r;
      s.birdVelocity = 0;
    }
    if (s.birdY - r < 0) {
      s.birdY = r;
      s.birdVelocity = 0;
    }
  }

  // Trail particles
  if (s.frame % 4 === 0) emitTrailParticle(s);

  updateParticles(s);
  updateScorePops(s);
}

function updateParticles(s: GameState): void {
  for (const p of s.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.018;
  }
  s.particles = s.particles.filter((p) => p.alpha > 0);
}

function updateScorePops(s: GameState): void {
  for (const sp of s.scorePops) sp.frame++;
  s.scorePops = s.scorePops.filter(
    (sp) => sp.frame < GAME_CONFIG.scorePopDuration,
  );
}

// ---- Player actions ----

export function performJump(s: GameState, overrides?: DebugOverrides): void {
  if (s.phase !== 'playing') return;
  const force = overrides?.jumpForce ?? GAME_CONFIG.jumpForce;
  s.birdVelocity = force;
  emitJumpParticles(s);
}

export function startGame(s: GameState, overrides?: DebugOverrides): void {
  s.birdY = s.h * 0.42;
  s.birdVelocity = 0;
  s.pipes = [];
  s.particles = [];
  s.scorePops = [];
  s.score = 0;
  s.lastPipeTime = Date.now();
  s.frame = 0;
  s.phase = 'playing';
  s.highScore = loadHighScore();
  const force = overrides?.jumpForce ?? GAME_CONFIG.jumpForce;
  s.birdVelocity = force;
  spawnPipe(s, overrides);
}
