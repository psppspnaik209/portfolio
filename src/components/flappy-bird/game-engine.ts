// ============================================
// GAME ENGINE — physics, collision, spawning
// No rendering logic here.
// ============================================

import { GAME_CONFIG, getEffectiveGap, getEffectiveSpeed } from './config';
import type {
  GameState,
  DebugOverrides,
  CollectiblesState,
} from './types';

const CUSTOM_WORDS = ['Hire Me', 'TNBB', 'Mikhial'];
// Basic XOR "encryption" to prevent widely obvious string search
// Key: 'flappy'
// Basic XOR "encryption" to prevent widely obvious string search
// Key: 'flappy'
const ENCRYPTED_LINK = 'DhgVAANDSUMYHwUNE0IDFV8dNxtVB0kuATQCIQ=='; // Encrypted
const REAL_LINK = decryptLink(ENCRYPTED_LINK);

/* 
// Utility to generate encrypted links
function getEncryptedLink(link: string): string {
  const key = 'flappy';
  let res = '';
  for (let i = 0; i < link.length; i++) {
    res += String.fromCharCode(link.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(res);
} 
*/

function decryptLink(encrypted: string): string {
  try {
    const data = atob(encrypted);
    const key = 'flappy';
    let res = '';
    for (let i = 0; i < data.length; i++) {
      res += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return res;
  } catch {
    return '';
  }
}

/** Create the initial game state */
export function createGameState(skills: string[] = []): GameState {
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
    collectibles: createCollectiblesState(skills),
  };
}

function createCollectiblesState(skills: string[]): CollectiblesState {
  // Merge skills and custom words
  let allWords = [...new Set([...skills, ...CUSTOM_WORDS])];
  
  // Filter out empty/spaces and sort by length
  allWords = allWords
    .filter((w) => w.trim().length > 0)
    .sort((a, b) => a.length - b.length);

  // Dynamic Total: Use ALL words. No slicing.
  const totalItems = allWords.length;

  // Load progress
  const saved = loadProgress();

  return {
    targetWords: allWords,
    currentWordIndex: saved.wordIndex,
    currentCharIndex: saved.charIndex,
    collectedWords: saved.collectedWords,
    keyFragments: saved.keyFragments,
    activeCollectibles: [],
    lastCollectibleTime: 0,
    spawnCooldown: 0, 
    wordsCollectedInRun: 0,
    pipesSinceWord: 0,
    isRewardUnlocked: saved.keyFragments >= totalItems && totalItems > 0,
    rewardLink: saved.keyFragments >= totalItems && totalItems > 0 ? REAL_LINK : '',
  };
}

// ---- Persistence ----

const STORAGE_KEY_PROGRESS = 'flappy_progress_v2'; // Bumped version

interface SavedProgress {
  wordIndex: number;
  charIndex: number;
  collectedWords: string[];
  keyFragments: number;
}

// Unicode-safe Base64 helpers
function toBase64(str: string) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  );
}

function fromBase64(str: string) {
  return decodeURIComponent(
    atob(str)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
}

function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (!raw)
      return {
        wordIndex: 0,
        charIndex: 0,
        collectedWords: [],
        keyFragments: 0,
      };

    // Safe decode
    const json = fromBase64(raw);
    const data = JSON.parse(json);
    return data;
  } catch {
    return { wordIndex: 0, charIndex: 0, collectedWords: [], keyFragments: 0 };
  }
}

function saveProgress(state: CollectiblesState): void {
  try {
    // Only save essential data
    const data: SavedProgress = {
      wordIndex: state.currentWordIndex,
      charIndex: state.currentCharIndex,
      collectedWords: state.collectedWords,
      keyFragments: state.keyFragments,
    };
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY_PROGRESS, toBase64(json));
  } catch {
    /* ignore */
  }
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

// ---- Collectible Spawning & Logic ----

export function spawnCollectible(s: GameState): void {
  const cState = s.collectibles;

  // Check if we have words left
  if (cState.currentWordIndex >= cState.targetWords.length) return;

  // Rule 1: First character spawns from SECOND pipe ever.
  // Rule 2: Subsequent words spawn exactly 2 pipes after completion.
  
  // We need to know if we are in the "active" phase for a word.
  // If we are mid-word (charIndex > 0), we spawn every 1-2 pipes (let's say 2 to be safe/paced).
  // If charIndex == 0, we check our specific "start" conditions.

  if (cState.activeCollectibles.length > 0) return; // Wait for screen clear

  // Initial Game Start Logic
  // We use s.pipes.length to track "pipes spawned this run" roughly, 
  // but better to track a dedicated counter in GameState if we wanted precision.
  // However, `spawnCollectible` is called *right after* `spawnPipe`. 
  // So s.pipes.length represents the TOTAL pipes spawned this session (if we don't clear them).
  // Actually s.pipes gets filtered. We need a robust counter.
  // Let's use `s.score` as a proxy for distance? No, score is passed pipes.
  
  // Simplification: 
  // If charIndex == 0 (Start of word)
  //   If wordsCollectedInRun == 0 -> Wait for 2nd pipe (Pipe #2).
  //   If wordsCollectedInRun > 0  -> Wait for pipesSinceWord == 2.
  
  // We need to track `pipesSpawnedSinceLastWord` explicitly?
  // We added `pipesSinceWord` to types.
  
  if (cState.currentCharIndex === 0) {
    // We are waiting to start a word
    if (cState.wordsCollectedInRun === 0) {
      // First word of the run
      // We want it at 2nd pipe.
      // How do we know it's the 2nd pipe?
      // We can check if s.score == 1? No, score happens when passing.
      // We can rely on a run-level pipe counter? 
      // Let's use `pipesSinceWord` as "Total Pipes Spawned" for the first word case?
      // Actually `pipesSinceWord` increments on every spawnPipe.
      if (cState.pipesSinceWord < 2) return;
    } else {
      // Subsequent words
      if (cState.pipesSinceWord < 2) return;
    }
  } else {
     // Mid-word spacing: Every 2 pipes?
     if (cState.spawnCooldown > 0) {
       cState.spawnCooldown--;
       return;
     }
  }

  const currentWord = cState.targetWords[cState.currentWordIndex];
  // Ignore spaces
  let char = currentWord[cState.currentCharIndex];
  if (char === ' ') {
    cState.currentCharIndex++;
    if (cState.currentCharIndex >= currentWord.length) {
      completeWord(s);
      return; 
    }
    char = currentWord[cState.currentCharIndex];
  }

  if (s.pipes.length < 1) return;
  
  const lastPipe = s.pipes[s.pipes.length - 1]; 
  const spawnX = lastPipe.x + GAME_CONFIG.pipeWidth / 2;
  const spawnY = lastPipe.topHeight + lastPipe.gap / 2;

  cState.activeCollectibles.push({
    x: spawnX,
    y: spawnY,
    baseY: spawnY,
    char: char,
    w: 40,
    h: 40,
    collected: false,
  });
  
  // Set cooldown for NEXT letter within same word
  cState.spawnCooldown = 2; // Fixed spacing
}

function completeWord(s: GameState) {
  const cState = s.collectibles;
  const word = cState.targetWords[cState.currentWordIndex];

  cState.collectedWords.push(word);
  cState.currentWordIndex++;
  cState.currentCharIndex = 0;
  
  // Run logic
  cState.wordsCollectedInRun++;
  cState.pipesSinceWord = 0; // Reset counter for the 2-pipe delay

  // Increment Fragments
  cState.keyFragments++;
  
  const total = cState.targetWords.length;

  if (cState.keyFragments >= total && total > 0) {
    cState.isRewardUnlocked = true;
    cState.rewardLink = REAL_LINK;
  }

  // Save progress
  saveProgress(cState);
  
  // Effect
  s.scorePops.push({
    x: s.birdX,
    y: s.birdY - 50,
    frame: 0,
    value: 999, 
  });
}

// ---- Pipe spawning ----

export function spawnPipe(s: GameState, overrides?: DebugOverrides): void {
  const gap = overrides?.pipeGap ?? getEffectiveGap(s.score);
  const minTop = GAME_CONFIG.minPipeTop;
  const maxTop = s.h - gap - minTop;
  if (maxTop <= minTop) return; 
  const topH = minTop + Math.random() * (maxTop - minTop);
  
  s.pipes.push({ x: s.w, topHeight: topH, gap, scored: false });

  // Increment pipe counter for spawning logic
  s.collectibles.pipesSinceWord++;

  // Verify and Trigger Spawn
  spawnCollectible(s);
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

  // Hard Pause if speedMultiplier is 0
  if (overrides?.speedMultiplier === 0) return;

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

  // Move Collectibles
  s.collectibles.activeCollectibles.forEach((c) => {
    c.x -= effectiveSpeed;
    // Bobbing effect
    c.y = c.baseY + Math.sin(s.frame * 0.05) * 10;
  });
  s.collectibles.activeCollectibles = s.collectibles.activeCollectibles.filter(
    (c) => c.x > -50 && !c.collected,
  );

  // Spawn pipes
  if (now - s.lastPipeTime > GAME_CONFIG.pipeFrequencyMs) {
    spawnPipe(s, overrides);
    s.lastPipeTime = now;
  }

  // Scoring
  for (const pipe of s.pipes) {
    if (!pipe.scored && pipe.x + GAME_CONFIG.pipeWidth < s.birdX) {
      pipe.scored = true;
      
      // Scoring Multiplier Logic
      // Base: 1 point per pipe. Multiplier applied at GAME OVER.
      s.score += 1;

      // Score pop effect
      s.scorePops.push({
        x: s.birdX + 20,
        y: s.birdY - 20,
        frame: 0,
        value: 1, 
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

  // Collectible Collision
  for (const c of s.collectibles.activeCollectibles) {
    if (
      !c.collected &&
      Math.abs(s.birdX - c.x) < 30 &&
      Math.abs(s.birdY - c.y) < 30
    ) {
      c.collected = true;
      s.collectibles.currentCharIndex++;

      // Check word completion
      const currentWord =
        s.collectibles.targetWords[s.collectibles.currentWordIndex];
      // Skip next space if any
      if (
        currentWord &&
        s.collectibles.currentCharIndex < currentWord.length &&
        currentWord[s.collectibles.currentCharIndex] === ' '
      ) {
        s.collectibles.currentCharIndex++;
      }

      if (currentWord && s.collectibles.currentCharIndex >= currentWord.length) {
        completeWord(s);
      }

      // Special particle or sound effect here
      s.scorePops.push({
        x: c.x,
        y: c.y,
        frame: 0,
        value: -1, // -1 indicating "letter collected"
      });
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
  s.collectibles.activeCollectibles = []; 
  s.collectibles.wordsCollectedInRun = 0;
  s.collectibles.pipesSinceWord = 0;
  s.collectibles.spawnCooldown = 0;
  const force = overrides?.jumpForce ?? GAME_CONFIG.jumpForce;
  s.birdVelocity = force;
  spawnPipe(s, overrides);
}

// ---- Debug Actions ----

export function debugCompleteWord(s: GameState): void {
  completeWord(s);
}

// ---- Time Adjustment (Fix for Pause Glitch) ----

export function adjustGameTime(s: GameState, delta: number): void {
  // If we paused for `delta` ms, we should shift `lastPipeTime` forward
  // so `now - lastPipeTime` doesn't balloon and trigger instant spawn.
  s.lastPipeTime += delta;
}

export function debugUnlockAll(s: GameState): void {
  const total = s.collectibles.targetWords.length;
  s.collectibles.keyFragments = total;
  s.collectibles.isRewardUnlocked = true;
  s.collectibles.rewardLink = REAL_LINK;
  s.collectibles.collectedWords = [...s.collectibles.targetWords]; 
  s.collectibles.currentWordIndex = total;
  s.collectibles.currentCharIndex = 0;
  saveProgress(s.collectibles);
}
