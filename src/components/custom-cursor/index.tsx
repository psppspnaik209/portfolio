/**
 * CustomCursor — 60 fps, zero-lag, OSU!-style cursor with glowing trail.
 *
 * Performance approach:
 *  • No React state for position/trail — direct DOM manipulation via refs.
 *  • Canvas-based trail instead of 12 divs getting re-rendered.
 *  • mousemove stores coords; rAF loop paints at 60fps.
 *  • Only one React re-render: initial mount check.
 */

import { useEffect, useRef, memo, useState } from 'react';
import { createPortal } from 'react-dom';

const TRAIL_LENGTH = 16;
const CURSOR_SIZE = 16;

const CustomCursor = memo(() => {
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Position is stored in a plain object — no setState
  const pos = useRef({ x: -100, y: -100 });
  const trail = useRef<Array<{ x: number; y: number }>>(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 })),
  );
  const visible = useRef(false);
  const rafId = useRef(0);

  useEffect(() => {
    const isDesktop = window.matchMedia('(pointer: fine)').matches;
    if (!isDesktop) return;
    setShouldRender(true);
  }, []);

  useEffect(() => {
    if (!shouldRender) return;

    const cursorEl = cursorRef.current;
    const canvasEl = canvasRef.current;
    if (!cursorEl || !canvasEl) return;
    const cursor = cursorEl;
    const canvas = canvasEl;

    const ctx = canvas.getContext('2d', { alpha: true })!;
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();

    // Pre-render a glow dot for the trail
    const GLOW_SIZE = 48;
    const glowSprite = document.createElement('canvas');
    glowSprite.width = GLOW_SIZE;
    glowSprite.height = GLOW_SIZE;
    const gc = glowSprite.getContext('2d')!;
    const grad = gc.createRadialGradient(
      GLOW_SIZE / 2, GLOW_SIZE / 2, 0,
      GLOW_SIZE / 2, GLOW_SIZE / 2, GLOW_SIZE / 2,
    );
    grad.addColorStop(0, 'rgba(0,229,255,0.6)');
    grad.addColorStop(0.3, 'rgba(0,229,255,0.2)');
    grad.addColorStop(1, 'rgba(0,229,255,0)');
    gc.fillStyle = grad;
    gc.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);

    const trailArr = trail.current;
    const p = pos.current;

    // ---- mousemove just stores coordinates ----
    const onMouseMove = (e: MouseEvent) => {
      p.x = e.clientX;
      p.y = e.clientY;
      if (!visible.current) {
        visible.current = true;
        cursor.style.opacity = '1';
      }
    };

    const onMouseLeave = () => {
      visible.current = false;
      cursor.style.opacity = '0';
      // Move trail offscreen
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        trailArr[i].x = -100;
        trailArr[i].y = -100;
      }
    };

    const onMouseEnter = () => {
      visible.current = true;
      cursor.style.opacity = '1';
    };

    // ---- rAF loop ----
    function frame() {
      rafId.current = requestAnimationFrame(frame);

      // Position cursor via transform (no layout trigger)
      cursor.style.transform = `translate(${p.x - CURSOR_SIZE / 2}px, ${p.y - CURSOR_SIZE / 2}px)`;

      // Shift trail
      for (let i = TRAIL_LENGTH - 1; i > 0; i--) {
        trailArr[i].x = trailArr[i - 1].x;
        trailArr[i].y = trailArr[i - 1].y;
      }
      trailArr[0].x = p.x;
      trailArr[0].y = p.y;

      // Draw trail on canvas
      ctx.clearRect(0, 0, W, H);

      if (!visible.current) return;

      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const age = i / TRAIL_LENGTH;
        const alpha = (1 - age) * 0.7;
        if (alpha < 0.02) continue;

        const size = GLOW_SIZE * (1 - age * 0.5);
        ctx.globalAlpha = alpha;
        ctx.drawImage(
          glowSprite,
          trailArr[i].x - size / 2,
          trailArr[i].y - size / 2,
          size,
          size,
        );
      }
      ctx.globalAlpha = 1;
    }
    rafId.current = requestAnimationFrame(frame);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      window.removeEventListener('resize', resize);
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return createPortal(
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999999 }}
    >
      {/* Canvas trail — no DOM elements re-rendered */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />
      {/* Main cursor dot — moved via transform in rAF */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: CURSOR_SIZE,
          height: CURSOR_SIZE,
          borderRadius: '50%',
          background: '#f5fff7',
          boxShadow:
            '0 0 8px 3px #00E5FF, 0 0 16px 6px rgba(0,229,255,0.5), 0 0 24px 10px rgba(0,229,255,0.25)',
          opacity: 0,
          willChange: 'transform',
          transition: 'opacity 0.15s ease-out',
        }}
      />
    </div>,
    document.body,
  );
});

CustomCursor.displayName = 'CustomCursor';

export default CustomCursor;
