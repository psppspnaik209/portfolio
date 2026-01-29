import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface TrailPoint {
  x: number;
  y: number;
  id: number;
}

const TRAIL_LENGTH = 12; // Number of trail circles
const TRAIL_UPDATE_INTERVAL = 1; // Update interval in milliseconds

const CustomCursor = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  const idCounter = useRef(0);
  const lastUpdateTime = useRef(0);

  useEffect(() => {
    setMounted(true);
    const checkDevice = () => {
      setIsDesktop(window.matchMedia('(pointer: fine)').matches);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const updateTrail = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < TRAIL_UPDATE_INTERVAL) return;
    lastUpdateTime.current = now;

    setTrail(prev => {
      const newPoint: TrailPoint = { x, y, id: idCounter.current++ };
      const newTrail = [newPoint, ...prev].slice(0, TRAIL_LENGTH);
      return newTrail;
    });
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const moveCursor = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      updateTrail(e.clientX, e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [isDesktop, isVisible, updateTrail]);

  if (!mounted || !isDesktop) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999999 }}>
      {/* Trail circles (oldest to newest, so newest renders on top) */}
      {trail.map((point, index) => {
        const age = index / TRAIL_LENGTH; // 0 = newest, 1 = oldest
        const size = 16 * (1 - age * 0.6); // Shrink from 12px to ~5px
        const opacity = (1 - age) * 0.8; // Fade from 0.8 to 0
        
        return (
          <div
            key={point.id}
            style={{
              position: 'fixed',
              left: point.x,
              top: point.y,
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              borderRadius: '50%',
              background: '#FFFF00',
              boxShadow: `0 0 ${4 * (1 - age)}px ${2 * (1 - age)}px rgba(255,255,0,0.5)`,
              opacity,
              willChange: 'transform',
            }}
          />
        );
      })}

      {/* Main Cursor (bright white/yellow core with glow) */}
      <div
        style={{
          position: 'fixed',
          left: cursorPos.x,
          top: cursorPos.y,
          width: 16,
          height: 16,
          marginLeft: -8,
          marginTop: -8,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fff 0%, #FFFF00 60%, #FFFF00 100%)',
          boxShadow: '0 0 12px 4px rgba(255,255,255,0.6), 0 0 20px 8px rgba(255,255,0,0.5)',
          opacity: isVisible ? 1 : 0,
        }}
      />
    </div>,
    document.body
  );
};

export default CustomCursor;
