import { lazy, Suspense, useRef, useEffect, useState } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

const BlobModel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showModel, setShowModel] = useState(false);

  useEffect(() => {
    // Only load on desktop (pointer: fine)
    const isDesktop = window.matchMedia('(pointer: fine)').matches;
    if (!isDesktop) return;

    // Preload Spline runtime (removed scene prefetch to avoid confusion)
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

  // Forward mouse events to the Spline canvas for interaction
  useEffect(() => {
    if (!showModel) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const canvas = containerRef.current.querySelector('canvas');
      if (!canvas) return;

      // Skip if already targeting the canvas
      if (e.target === canvas) return;

      // Check if mouse is within container bounds
      const rect = containerRef.current.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }

      // Forward the event to the canvas
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

      canvas.dispatchEvent(new MouseEvent('mousemove', eventInit));
      canvas.dispatchEvent(new PointerEvent('pointermove', {
        ...eventInit,
        pointerType: 'mouse',
      }));
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [showModel]);

  // Container sized to match Spline scene (800x600), centered
  return (
    <div
      ref={containerRef}
      className={`hidden lg:flex justify-center items-center relative z-10 transition-opacity duration-0 ${
        showModel ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        width: '100%',
        height: '600px',
        marginTop: '-50px',
        marginBottom: '-50px',
        display: typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches ? 'none' : undefined
      }}
    >
      {showModel && (
        <Suspense
          fallback={<div className="text-cyan-400 text-center">Loading 3D Blob...</div>}
        >
          <div style={{ width: '800px', height: '600px' }}>
            <Spline
              scene="https://prod.spline.design/vr9OlzhlPP7q0UM5/scene.splinecode"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </Suspense>
      )}
    </div>
  );
};

export default BlobModel;
