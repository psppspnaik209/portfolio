import { lazy, Suspense, useRef, useEffect, useState } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

const RobotModel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showModel, setShowModel] = useState(false);

  useEffect(() => {
    // Preload resources immediately to minimize hitch on first scroll
    import('@splinetool/react-spline');
    fetch('https://prod.spline.design/e4pEQtAAYjkiADby/scene.splinecode').catch(
      () => {},
    );

    const handleScroll = () => {
      setShowModel(true);
    };

    // Check if already scrolled (accounting for different scroll containers)
    if (
      window.scrollY > 0 ||
      document.body.scrollTop > 0 ||
      document.documentElement.scrollTop > 0
    ) {
      setShowModel(true);
    } else {
      // Use capture: true to detect scroll on any element
      window.addEventListener('scroll', handleScroll, {
        capture: true,
        once: true,
      });
    }

    return () =>
      window.removeEventListener('scroll', handleScroll, {
        capture: true,
      } as AddEventListenerOptions);
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

  return (
    <div
      ref={containerRef}
      className={`hidden lg:flex w-full h-[600px] justify-center items-center relative z-10 transition-opacity duration-0 ${
        showModel ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ display: typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches ? 'none' : undefined }}
    >
      {showModel && (
        <Suspense
          fallback={<div className="text-cyan-400">Loading 3D Model...</div>}
        >
          <Spline
            scene="https://prod.spline.design/e4pEQtAAYjkiADby/scene.splinecode"
            className="w-full h-full"
          />
        </Suspense>
      )}
    </div>
  );
};

export default RobotModel;
