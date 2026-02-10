// ============================================
// SHARED TYPES
// ============================================

export type GamePhase = 'idle' | 'playing' | 'dead';

export interface Pipe {
  x: number;
  topHeight: number;
  gap: number; // per-pipe gap (changes with difficulty)
  scored: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color?: string;
}

export interface Star {
  x: number; // 0…1 normalized
  y: number; // 0…1 normalized
  size: number;
  brightness: number;
  twinkleSpeed: number;
}

export interface CityBuilding {
  x: number; // 0…1 normalized
  width: number; // px
  height: number; // px
  brightness: number;
}

export interface ScorePop {
  x: number;
  y: number;
  frame: number;
  value: number;
}

export interface GameState {
  birdY: number;
  birdVelocity: number;
  pipes: Pipe[];
  particles: Particle[];
  scorePops: ScorePop[];
  score: number;
  highScore: number;
  phase: GamePhase;
  lastPipeTime: number;
  frame: number;
  w: number;
  h: number;
  animId: number;
  birdX: number;
  godMode: boolean;
}

export interface Collectible {
  x: number;
  y: number;
  char: string;
  w: number;
  h: number;
  collected: boolean;
  baseY: number; // For floating animation
}

export interface CollectiblesState {
  targetWords: string[];
  currentWordIndex: number;
  currentCharIndex: number;
  collectedWords: string[];
  keyFragments: number; // 0..45
  activeCollectibles: Collectible[];
  lastCollectibleTime: number; // ms timestamp
  spawnCooldown: number; // Number of pipes to wait before next spawn
  // Encryption / Reward related
  isRewardUnlocked: boolean;
  rewardLink: string;
}

export interface GameState {
  birdY: number;
  birdVelocity: number;
  pipes: Pipe[];
  particles: Particle[];
  scorePops: ScorePop[];
  score: number;
  highScore: number;
  phase: GamePhase;
  lastPipeTime: number;
  frame: number;
  w: number;
  h: number;
  animId: number;
  birdX: number;
  godMode: boolean;
  collectibles: CollectiblesState;
}

export interface DebugOverrides {
  gravity: number | null;
  jumpForce: number | null;
  speedMultiplier: number;
  pipeGap: number | null;
  godMode: boolean;
}
