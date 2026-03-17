'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
}

export function MagicCard({
  children,
  className,
  gradientSize = 250,
  gradientColor = '#38bdf8', // Sky blue — premium palette
  gradientOpacity = 0.12,
  ...props
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState(-gradientSize);
  const [mouseY, setMouseY] = useState(-gradientSize);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      if (cardRef.current) {
        const { left, top } = cardRef.current.getBoundingClientRect();
        setMouseX(e.clientX - left);
        setMouseY(e.clientY - top);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn(
        'group relative flex h-full w-full overflow-hidden rounded-xl bg-base-100/90 border border-white/10 text-white transition-all duration-300 hover:border-white/20 hover:shadow-xl',
        className,
      )}
      {...props}
    >
      <div className="relative z-10 w-full">{children}</div>
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`,
          opacity: gradientOpacity,
          zIndex: 0,
        }}
      />
    </div>
  );
}
