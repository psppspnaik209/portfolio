'use client';

import { cn } from '../../lib/utils';

interface AnimatedShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: AnimatedShinyTextProps) {
  return (
    <span
      style={
        {
          '--shimmer-width': `${shimmerWidth}px`,
        } as React.CSSProperties
      }
      className={cn(
        'mx-auto max-w-md text-neutral-400/70',

        // Shimmer effect
        'animate-shiny-text bg-clip-text bg-no-repeat [background-position:0_0] [background-size:var(--shimmer-width)_100%] [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]',

        // Shimmer gradient — cyan/white only, no pink/purple
        'bg-gradient-to-r from-transparent via-white/80 via-50% to-transparent',

        className,
      )}
    >
      {children}
    </span>
  );
}
