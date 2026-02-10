// ============================================
// GAME CONFIGURATION — all tunable constants
// ============================================

export const GAME_CONFIG = {
  // Physics
  gravity: 0.16,
  jumpForce: -5.0,
  terminalVelocity: 8,

  // Pipes
  pipeWidth: 52,
  pipeCapHeight: 16,
  pipeCapOverhang: 7,
  basePipeSpeed: 1.6,
  maxPipeSpeed: 4.0,
  speedIncrement: 0.06, // per point scored
  basePipeGap: 145,
  minPipeGap: 110,
  gapShrinkPerPoint: 0.8,
  pipeFrequencyMs: 2000,
  minPipeTop: 55,

  // Bird
  birdSize: 14,

  // Particles
  maxParticles: 40,

  // Background parallax speeds (px/frame)
  starSpeed: 0.15,
  citySpeed: 0.4,
  gridSpeed: 0,

  // Scoring
  scorePopDuration: 20, // frames

  // LocalStorage key
  highScoreKey: 'cyberflap_highscore',
} as const;

// Derived at runtime based on score
export function getEffectiveSpeed(score: number): number {
  return Math.min(
    GAME_CONFIG.basePipeSpeed + score * GAME_CONFIG.speedIncrement,
    GAME_CONFIG.maxPipeSpeed,
  );
}

export function getEffectiveGap(score: number): number {
  return Math.max(
    GAME_CONFIG.basePipeGap - score * GAME_CONFIG.gapShrinkPerPoint,
    GAME_CONFIG.minPipeGap,
  );
}
