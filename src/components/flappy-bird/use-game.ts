// ============================================
// useGame — custom hook wiring engine + renderer
// ============================================

import { useRef, useEffect, useCallback, useState } from 'react';
import {
  createGameState,
  updateGameState,
  performJump,
  startGame as engineStart,
  loadHighScore,
  debugCompleteWord,
  debugUnlockAll,
} from './game-engine';
import { drawFrame, regenerateScene } from './renderer';
import { getEffectiveSpeed } from './config';
import type { GamePhase, DebugOverrides } from './types';

interface UseGameReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  phase: GamePhase;
  score: number;
  highScore: number;
  fps: number;
  currentSpeed: number;
  start: () => void;
  overrides: DebugOverrides;
  setOverrides: (o: DebugOverrides) => void;
  // Collectibles
  collectedWords: string[];
  targetWords: string[];
  currentWordIndex: number;
  currentCharIndex: number;
  keyFragments: number;
  wordsCollectedInRun: number; // Added
  isRewardUnlocked: boolean;
  rewardLink: string;
  debugCompleteWord: () => void;
  debugUnlockAll: () => void;
  goToMenu: () => void; // Already added?
  resetProgress: () => void;
  adjustTime: (delta: number) => void;
}

export function useGame(skills: string[] = []): UseGameReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Pass skills to create initial state
  const stateRef = useRef(createGameState(skills));
  const overridesRef = useRef<DebugOverrides>({
    gravity: null,
    jumpForce: null,
    speedMultiplier: 1,
    pipeGap: null,
    godMode: false,
  });

  // React state for UI overlays
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => loadHighScore());
  const [fps, setFps] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [overrides, _setOverrides] = useState(overridesRef.current);

  // Collectibles State
  const [collectedWords, setCollectedWords] = useState<string[]>([]);
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [keyFragments, setKeyFragments] = useState(0);
  const [wordsCollectedInRun, setWordsCollectedInRun] = useState(0); // Added
  const [isRewardUnlocked, setIsRewardUnlocked] = useState(false);
  const [rewardLink, setRewardLink] = useState('');

  const setOverrides = useCallback((o: DebugOverrides) => {
    overridesRef.current = o;
    _setOverrides(o);
  }, []);

  // Sync engine phase → React state
  const syncPhase = useCallback(() => {
    const s = stateRef.current;

    // Core
    setPhase((prev) => (prev !== s.phase ? s.phase : prev));
    setScore((prev) => (prev !== s.score ? s.score : prev));
    setHighScore((prev) => (prev !== s.highScore ? s.highScore : prev));

    // Collectibles (optimizing to not re-render every frame if possible,
    // but React batching handles it mostly ok. For high perf, use refs, but this is simple UI).
    // Let's just sync them.
    if (s.collectibles) {
      setCollectedWords(s.collectibles.collectedWords);
      setTargetWords(s.collectibles.targetWords);
      setCurrentWordIndex(s.collectibles.currentWordIndex);
      setCurrentCharIndex(s.collectibles.currentCharIndex);
      setKeyFragments(s.collectibles.keyFragments);
      setWordsCollectedInRun(s.collectibles.wordsCollectedInRun); // Sync
      setIsRewardUnlocked(s.collectibles.isRewardUnlocked);
      setRewardLink(s.collectibles.rewardLink);
    }
  }, []);

  const start = useCallback(() => {
    engineStart(stateRef.current, overridesRef.current);
    syncPhase();
  }, [syncPhase]);

  const jump = useCallback(() => {
    performJump(stateRef.current, overridesRef.current);
  }, []);

  const goToMenu = useCallback(() => {
    stateRef.current.phase = 'idle';
    syncPhase();
  }, [syncPhase]);

  useEffect(() => {
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
      regenerateScene(rect.width, rect.height);
    };

    resize();
    s.highScore = loadHighScore();
    setHighScore(s.highScore);

    // Init local state from engine
    const c = s.collectibles;
    if (c) {
      setCollectedWords(c.collectedWords);
      setTargetWords(c.targetWords);
      setCurrentWordIndex(c.currentWordIndex);
      setCurrentCharIndex(c.currentCharIndex);
      setKeyFragments(c.keyFragments);
      setIsRewardUnlocked(c.isRewardUnlocked);
      setRewardLink(c.rewardLink);
    }

    // FPS tracking
    let fpsFrames = 0;
    let fpsTime = performance.now();

    const loop = () => {
      updateGameState(s, overridesRef.current);
      drawFrame(ctx, s);
      syncPhase();

      // FPS
      fpsFrames++;
      const now = performance.now();
      if (now - fpsTime >= 1000) {
        setFps(fpsFrames);
        setCurrentSpeed(
          getEffectiveSpeed(s.score) * overridesRef.current.speedMultiplier,
        );
        fpsFrames = 0;
        fpsTime = now;
      }

      s.animId = requestAnimationFrame(loop);
    };

    s.animId = requestAnimationFrame(loop);

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Input
    const handleClick = () => {
      if (s.phase === 'playing') jump();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (s.phase === 'playing') jump();
      }
      if (e.code === 'Enter' && s.phase === 'dead') {
        e.preventDefault();
        start();
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
  }, [jump, start, syncPhase]);

  return {
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
    collectedWords,
    targetWords,
    currentWordIndex,
    currentCharIndex,
    keyFragments,
    wordsCollectedInRun, // Added
    isRewardUnlocked,
    rewardLink,
    debugCompleteWord: () => debugCompleteWord(stateRef.current),
    debugUnlockAll: () => debugUnlockAll(stateRef.current),
    goToMenu,
    resetProgress: () => {
      // Clear local storage and state
      localStorage.removeItem('flappy_progress_v2');
      const s = stateRef.current;
      s.collectibles.collectedWords = [];
      s.collectibles.currentWordIndex = 0;
      s.collectibles.currentCharIndex = 0;
      s.collectibles.keyFragments = 0;
      s.collectibles.isRewardUnlocked = false;
      s.collectibles.rewardLink = '';
      syncPhase();
    },
    adjustTime: (delta: number) => {
      // Import this? Or just move impl here?
      // It's in engine.
      // We need to import it at top of file first.
      // But we can't easily add import with replace_file if we don't touch top.
      // Wait, `use-game.ts` imports from `./game-engine`.
      // I need to add `adjustGameTime` to imports.
      const s = stateRef.current;
      s.lastPipeTime += delta;
    },
  };
}
