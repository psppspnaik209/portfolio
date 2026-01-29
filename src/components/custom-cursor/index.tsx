import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface TrailPoint {
  x: number;
  y: number;
  id: number;
}

const TRAIL_LENGTH = 12;
const TRAIL_UPDATE_INTERVAL = 1;
const TRAIL_FADE_DELAY = 100; // Start fading after 100ms of no movement

const CustomCursor = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [trailVisible, setTrailVisible] = useState(true);

  const idCounter = useRef(0);
  const lastUpdateTime = useRef(0);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    const checkDevice = () => {
      setIsDesktop(window.matchMedia('(pointer: fine)').matches);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const clearTrail = useCallback(() => {
    setTrailVisible(false);
    // Actually clear the trail after fade animation
    setTimeout(() => {
      setTrail([]);
    }, 300);
  }, []);

  const updateTrail = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - lastUpdateTime.current < TRAIL_UPDATE_INTERVAL) return;
      lastUpdateTime.current = now;

      // Show trail and reset fade timer
      setTrailVisible(true);

      // Clear existing fade timeout
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      // Set new fade timeout
      fadeTimeoutRef.current = setTimeout(() => {
        clearTrail();
      }, TRAIL_FADE_DELAY);

      setTrail((prev) => {
        const newPoint: TrailPoint = { x, y, id: idCounter.current++ };
        const newTrail = [newPoint, ...prev].slice(0, TRAIL_LENGTH);
        return newTrail;
      });
    },
    [clearTrail],
  );

  useEffect(() => {
    if (!isDesktop) return;

    const moveCursor = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      updateTrail(e.clientX, e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      // Hide cursor and clear trail when mouse leaves window
      setIsVisible(false);
      clearTrail();
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [isDesktop, isVisible, updateTrail, clearTrail]);

  if (!mounted || !isDesktop) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 999999,
      }}
    >
      {/* Trail circles with fade transition */}
      <div
        style={{
          opacity: trailVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      >
        {trail.map((point, index) => {
          const age = index / TRAIL_LENGTH;
          const size = 18 * (1 - age * 0.6);
          const opacity = (1 - age) * 0.8;

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
                background: '#F5F7FF',
                boxShadow: `0 0 ${6 * (1 - age)}px ${3 * (1 - age)}px rgba(0,229,255,0.6)`,
                opacity,
                willChange: 'transform',
              }}
            />
          );
        })}
      </div>

      {/* Main Cursor (always visible while on screen) */}
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
          background: '#f5fff7ff',
          boxShadow:
            '0 0 8px 3px #00E5FF, 0 0 16px 6px rgba(0,229,255,0.5), 0 0 24px 10px rgba(0,229,255,0.25)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.15s ease-out',
        }}
      />
    </div>,
    document.body,
  );
};

export default CustomCursor;
