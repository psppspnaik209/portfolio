import { useRef, useEffect, memo } from 'react';

const AsciiBackground = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Guard against multiple animation loops (React StrictMode)
    if (isRunningRef.current) {
      return;
    }
    isRunningRef.current = true;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();

    const chars = '01#%@$&*+-/\\|~<>[]{}()=!"£€¥¢§°';
    const fontSize = 12;
    const columns = Math.floor(canvas.width / fontSize) + 50;
    const drops: number[] = Array.from(
      { length: columns },
      () => Math.random() * (canvas.height / fontSize),
    );

    let mouseX = 0;
    let mouseY = 0;

    const draw = () => {
      // Semi-transparent black overlay for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw falling characters
      ctx.font = `${fontSize}px monospace`;

      drops.forEach((y, i) => {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const realY = (y * fontSize) % canvas.height;
        const speed = 1 + Math.random() * 2;

        const dist = Math.hypot(x - mouseX, realY - mouseY);
        const offset = dist < 150 ? -50 : 0;
        
        if (dist < 150) {
          ctx.fillStyle = '#ffff00';
          ctx.shadowColor = '#ffff00';
          ctx.shadowBlur = 20;
        } else {
          ctx.fillStyle = '#00ffff';
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 5;
        }

        ctx.fillText(text, x, realY + offset);
        ctx.shadowBlur = 0;

        if (realY < 0) {
          drops[i] = canvas.height / fontSize;
        }
        drops[i] += speed / fontSize;
      });
    };

    const animate = () => {
      if (!isRunningRef.current) return;
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY; // Use clientY directly since canvas is fixed
    };

    const handleResize = () => {
      updateSize();
    };

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
      style={{ backgroundColor: '#0f0f23' }}
    />
  );
});

AsciiBackground.displayName = 'AsciiBackground';

export default AsciiBackground;
