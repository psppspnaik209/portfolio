import { lazy, Suspense, useRef, useEffect, useState } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

// ============================================
// EDIT THESE VALUES TO ADJUST
// ============================================
const ROBOT_CONFIG = {
  // Container dimensions
  width: '100%',           // Container width (use '100%' or specific like '800px')
  height: '1050px',        // Container height - increase to make robot taller
  
  // Position adjustments (negative values pull up/left, positive push down/right)
  marginTop: '-180px',      // Pull robot up (negative) or push down (positive)
  marginBottom: '0px',  // Reduce bottom space (negative) or add space (positive)
  marginLeft: '100px',       // Shift left (negative) or right (positive)
  marginRight: '0px',      // Shift left (positive) or right (negative)
  
  // CSS Transform for additional adjustments (applied to the Spline canvas)
  scale: 1,                // Scale multiplier (1 = 100%, 1.2 = 120%, 0.8 = 80%)
  translateX: '0px',       // Horizontal shift
  translateY: '0px',       // Vertical shift
  
  // Spline scene URL
  sceneUrl: 'https://prod.spline.design/e4pEQtAAYjkiADby/scene.splinecode',
};
// ============================================

const RobotModel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showModel, setShowModel] = useState(false);
  const [splineKey, setSplineKey] = useState(0); // Key to force remount

  useEffect(() => {
    // Only load on desktop (pointer: fine)
    const isDesktop = window.matchMedia('(pointer: fine)').matches;
    if (!isDesktop) return;

    // Preload Spline runtime to minimize hitch on first scroll
    import('@splinetool/react-spline');

    const handleScroll = () => {
      setShowModel(true);
    };

    // Check if already scrolled
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

    return () =>
      window.removeEventListener('scroll', handleScroll);
  }, []);

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

      const mouseEvent = new MouseEvent('mousemove', eventInit);
      const pointerEvent = new PointerEvent('pointermove', {
        ...eventInit,
        pointerType: 'mouse',
      });

      canvas.dispatchEvent(mouseEvent);
      canvas.dispatchEvent(pointerEvent);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [showModel]);

  // Build transform string from config
  const transformStyle = `scale(${ROBOT_CONFIG.scale}) translate(${ROBOT_CONFIG.translateX}, ${ROBOT_CONFIG.translateY})`;

  return (
    <div
      ref={containerRef}
      className={`hidden lg:flex w-full justify-center items-center relative z-10 transition-opacity duration-0 ${
        showModel ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        width: ROBOT_CONFIG.width,
        height: ROBOT_CONFIG.height,
        marginTop: ROBOT_CONFIG.marginTop,
        marginBottom: ROBOT_CONFIG.marginBottom,
        marginLeft: ROBOT_CONFIG.marginLeft,
        marginRight: ROBOT_CONFIG.marginRight,
        display: typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches ? 'none' : undefined
      }}
    >
      {showModel && (
        <Suspense
          fallback={<div className="text-cyan-400">Loading 3D Model...</div>}
        >
          <Spline
            key={splineKey} // Key forces complete remount when changed
            scene={ROBOT_CONFIG.sceneUrl}
            onLoad={() => {
              // FIX: Force Spline to remount after initial load to recalculate dimensions
              // This simulates what HMR does - complete unmount/remount
              if (splineKey === 0) {
                setTimeout(() => {
                  setSplineKey(1); // This will unmount and remount Spline
                }, 200);
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              transform: transformStyle,
              transformOrigin: 'center center',
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default RobotModel;
