import { useRef, useEffect } from 'react';

const AsciiBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight,
      );
    };
    updateSize();

    const observer = new MutationObserver(() => {
      updateSize();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const chars = '01#%@$&*+-/\\|~<>[]{}()=!"£€¥¢§°';
    const fontSize = 12;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array.from(
      { length: Math.floor(columns) + 50 },
      () => (Math.random() * canvas.height) / fontSize,
    );

    let mouseX = 0;
    let mouseY = 0;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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

      ctx.fillStyle = '#00ffff';
      ctx.font = `${fontSize}px monospace`;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;

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

    let rafId: number;
    const animate = () => {
      draw();
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = window.scrollY + e.clientY;
    };

    document.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      updateSize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ backgroundColor: '#0f0f23' }}
    />
  );
};

export default AsciiBackground;
