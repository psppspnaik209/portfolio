import {
  lazy,
  Suspense,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

// ============================================
// CONFIGURATION
// ============================================
const ROBOT_CONFIG = {
  // REFERENCE DIMENSIONS
  // The Spline scene renders at this fixed size internally.
  // This prevents Spline from distorting because it always "sees" this resolution.
  refWidth: 1400,
  refHeight: 1000,

  // Position adjustments (relative to the reference size)
  marginTop: -150,
  marginLeft: 100,

  // Spline scene URL
  sceneUrl: 'https://prod.spline.design/e4pEQtAAYjkiADby/scene.splinecode',
};
// ============================================

const RobotModel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showModel, setShowModel] = useState(false);
  const [scale, setScale] = useState(1);

  // Calculate generic scale based on window width
  const handleResize = useCallback(() => {
    // Only scale down if screen is smaller than reference
    // We target a specific behavior for 1366x768 screens
    const width = window.innerWidth;

    // Breakpoint logic
    if (width < ROBOT_CONFIG.refWidth) {
      const newScale = width / ROBOT_CONFIG.refWidth;
      setScale(newScale);
    } else {
      setScale(1);
    }
  }, []);

  useEffect(() => {
    // Only load on desktop (pointer: fine)
    const isDesktop = window.matchMedia('(pointer: fine)').matches;
    if (!isDesktop) return;

    // Initial scale calc
    handleResize();

    // Preload Spline runtime
    import('@splinetool/react-spline');

    const handleScroll = () => {
      setShowModel(true);
    };

    if (
      window.scrollY > 0 ||
      document.body.scrollTop > 0 ||
      document.documentElement.scrollTop > 0
    ) {
      setShowModel(true);
    } else {
      window.addEventListener('scroll', handleScroll, {
        capture: true,
        once: true,
        passive: true,
      });
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Forward mouse events for interaction (Spline "Look At" etc.)
  useEffect(() => {
    if (!showModel) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const canvas = containerRef.current.querySelector('canvas');
      if (!canvas) return;
      if (e.target === canvas) return;

      const eventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: e.clientX,
        clientY: e.clientY,
        screenX: e.screenX,
        screenY: e.screenY,
        button: e.button,
        buttons: e.buttons,
      };

      // We might need to adjust coordinates if we are scaling,
      // but usually Spline's global listeners handle screen coords well if forwarded correctly.
      canvas.dispatchEvent(new MouseEvent('mousemove', eventInit));
      canvas.dispatchEvent(
        new PointerEvent('pointermove', { ...eventInit, pointerType: 'mouse' }),
      );
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [showModel]);

  // Calculate dynamic height for the container based on scale
  // to avoid large empty spaces when scaled down
  const containerHeight = ROBOT_CONFIG.refHeight * scale;

  return (
    <div
      ref={containerRef}
      className={`hidden lg:flex w-full justify-center items-center relative -z-10 pointer-events-none transition-opacity duration-500 ${
        showModel ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        // The outer container adjusts its height to fit the scaled content
        height: `${containerHeight}px`,
        marginTop: `${ROBOT_CONFIG.marginTop * scale}px`, // Scale margin too
        width: '100%',
        overflow: 'visible', // Allow overlap if needed
        display:
          typeof window !== 'undefined' &&
          !window.matchMedia('(pointer: fine)').matches
            ? 'none'
            : undefined,
      }}
    >
      {showModel && (
        <Suspense
          fallback={<div className="text-cyan-400">Loading 3D Model...</div>}
        >
          {/* 
            Wrapper that holds the fixed-size Spline scene.
            We scale this wrapper using CSS transform.
          */}
          <div
            style={{
              width: `${ROBOT_CONFIG.refWidth}px`,
              height: `${ROBOT_CONFIG.refHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top center', // Scale from top center
              marginLeft: `${ROBOT_CONFIG.marginLeft}px`,
              flexShrink: 0,
            }}
          >
            <Spline
              scene={ROBOT_CONFIG.sceneUrl}
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </div>
        </Suspense>
      )}
    </div>
  );
};

export default RobotModel;
