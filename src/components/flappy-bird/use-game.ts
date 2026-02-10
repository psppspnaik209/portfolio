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
}

export function useGame(): UseGameReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(createGameState());
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

  const setOverrides = useCallback((o: DebugOverrides) => {
    overridesRef.current = o;
    _setOverrides(o);
  }, []);

  // Sync engine phase → React state
  const syncPhase = useCallback(() => {
    const s = stateRef.current;
    setPhase((prev) => (prev !== s.phase ? s.phase : prev));
    setScore((prev) => (prev !== s.score ? s.score : prev));
    setHighScore((prev) => (prev !== s.highScore ? s.highScore : prev));
  }, []);

  const start = useCallback(() => {
    engineStart(stateRef.current, overridesRef.current);
    syncPhase();
  }, [syncPhase]);

  const jump = useCallback(() => {
    performJump(stateRef.current, overridesRef.current);
  }, []);

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
  };
}
