import { useRef, useEffect, memo } from 'react';

/**
 * AsciiBackground — cyberpunk matrix-rain effect.
 *
 * Performance-optimised rewrite:
 *  • Grid lines drawn once to an OffscreenCanvas and blitted each frame.
 *  • Glow textures pre-rendered (no ctx.shadowBlur per-character).
 *  • Throttled to ~30 fps (text rain looks identical at 30 fps).
 *  • Mouse-proximity highlight uses cheap fillStyle swap, not shadow.
 *  • Trail fade uses a slightly higher alpha for faster compositing.
 */
const AsciiBackground = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const context = cvs.getContext('2d', { alpha: false });
    if (!context) return;
    const canvas = cvs;
    const ctx = context;

    if (isRunningRef.current) return;
    isRunningRef.current = true;

    // ---- Sizing ----
    let W = 0;
    let H = 0;
    let cols = 0;
    const FONT_SIZE = 12;
    const GRID_SPACING = 50;
    const CHARS = '01#%@$&*+-/\\|~<>[]{}()=!"£€¥¢§°';

    // Pre-created offscreen canvases
    let gridCanvas: OffscreenCanvas | HTMLCanvasElement;

    const drops: number[] = [];
    // Per-column speed so we don't call Math.random() every frame
    const speeds: number[] = [];

    let mouseX = -9999;
    let mouseY = -9999;

    // ---- Pre-render glow sprites ----
    function makeGlowSprite(color: string, radius: number): HTMLCanvasElement {
      const c = document.createElement('canvas');
      const s = radius * 4;
      c.width = s;
      c.height = s;
      const g = c.getContext('2d')!;
      const grad = g.createRadialGradient(
        s / 2,
        s / 2,
        0,
        s / 2,
        s / 2,
        radius,
      );
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
      return c;
    }

    // ---- Build grid onto offscreen canvas ----
    function buildGridCanvas() {
      try {
        gridCanvas = new OffscreenCanvas(W, H);
      } catch {
        // Fallback for browsers without OffscreenCanvas
        gridCanvas = document.createElement('canvas');
        gridCanvas.width = W;
        gridCanvas.height = H;
      }
      const gc = gridCanvas.getContext('2d')!;
      gc.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      gc.lineWidth = 1;
      gc.beginPath();
      for (let x = 0; x < W; x += GRID_SPACING) {
        gc.moveTo(x + 0.5, 0);
        gc.lineTo(x + 0.5, H);
      }
      for (let y = 0; y < H; y += GRID_SPACING) {
        gc.moveTo(0, y + 0.5);
        gc.lineTo(W, y + 0.5);
      }
      gc.stroke();
    }

    function updateSize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;

      const newCols = Math.floor(W / FONT_SIZE) + 2;
      // Extend arrays if needed, preserve existing positions
      for (let i = cols; i < newCols; i++) {
        drops[i] = Math.random() * (H / FONT_SIZE);
        speeds[i] = 2 + Math.random() * 3;
      }
      cols = newCols;

      buildGridCanvas();
      // Fill canvas with solid black to start
      ctx.fillStyle = '#0f0f23';
      ctx.fillRect(0, 0, W, H);
    }

    updateSize();
    const glowCyan = makeGlowSprite('rgba(0,255,255,0.35)', 8);
    const glowYellow = makeGlowSprite('rgba(255,255,0,0.5)', 14);

    // ---- Draw function ----
    const MOUSE_RADIUS = 150;
    const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;

    function draw() {
      // Trail fade — slightly higher alpha clears faster, less GPU compositing buildup
      ctx.fillStyle = 'rgba(15, 15, 35, 0.18)';
      ctx.fillRect(0, 0, W, H);

      // Blit cached grid
      ctx.drawImage(gridCanvas as CanvasImageSource, 0, 0);

      // Draw falling characters
      ctx.font = `${FONT_SIZE}px monospace`;

      for (let i = 0; i < cols; i++) {
        const x = i * FONT_SIZE;
        const realY = (drops[i] * FONT_SIZE) % H;

        // Distance check (squared, no sqrt)
        const dx = x - mouseX;
        const dy = realY - mouseY;
        const distSq = dx * dx + dy * dy;
        const isNear = distSq < MOUSE_RADIUS_SQ;

        if (isNear) {
          ctx.fillStyle = '#ffff00';
          // Stamp glow sprite instead of shadowBlur
          ctx.drawImage(
            glowYellow,
            x - glowYellow.width / 2 + FONT_SIZE / 2,
            realY - glowYellow.height / 2,
          );
        } else {
          ctx.fillStyle = '#00ffff';
          // Stamp subtle cyan glow
          ctx.drawImage(
            glowCyan,
            x - glowCyan.width / 2 + FONT_SIZE / 2,
            realY - glowCyan.height / 2,
          );
        }

        const charIdx = (i * 7 + (drops[i] | 0)) % CHARS.length;
        ctx.fillText(CHARS[charIdx], x, realY + (isNear ? -50 : 0));

        drops[i] += speeds[i] / FONT_SIZE;
        if (drops[i] * FONT_SIZE > H + FONT_SIZE) {
          drops[i] = 0;
          speeds[i] = 2 + Math.random() * 3;
        }
      }
    }

    // ---- Animation loop throttled to ~30 fps ----
    const FRAME_INTERVAL = 1000 / 30;
    let lastFrameTime = 0;

    function animate(now: number) {
      if (!isRunningRef.current) return;
      animationRef.current = requestAnimationFrame(animate);

      if (now - lastFrameTime < FRAME_INTERVAL) return;
      lastFrameTime = now;

      draw();
    }
    animationRef.current = requestAnimationFrame(animate);

    // ---- Event listeners ----
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleResize = () => updateSize();

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      isRunningRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ backgroundColor: '#0f0f23', willChange: 'transform' }}
    />
  );
});

AsciiBackground.displayName = 'AsciiBackground';

export default AsciiBackground;
