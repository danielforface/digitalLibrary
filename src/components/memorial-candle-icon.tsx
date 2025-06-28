
'use client';

import { cn } from '@/lib/utils';

export default function MemorialCandleIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("h-full w-full", className)}
    >
      <style>
        {`
          .flame-path {
            animation: flicker 2.5s linear infinite;
            transform-origin: 50% 100%;
          }

          @keyframes flicker {
            0%, 100% { transform: scaleY(1) rotate(-1deg); opacity: 1; }
            50% { transform: scaleY(1.1) rotate(1deg) translateY(-2px); opacity: 0.9; }
          }

          .candle-body {
            fill: hsl(var(--card));
            stroke: hsl(var(--border));
          }
        `}
      </style>
      {/* Candle */}
      <path 
        className="candle-body"
        d="M9 16C9 15.4477 9.44772 15 10 15H14C14.5523 15 15 15.4477 15 16V22H9V16Z" 
        strokeWidth="1"
      />
       {/* Wick */}
      <path d="M12 13.5V15" stroke="hsl(var(--foreground))" strokeWidth="1" strokeLinecap="round" />
      {/* Flame */}
      <g className="flame-path">
         <path 
          d="M12 14C11 14 10.5 12.5 11 11C11.5 9.5 12 8 12 8C12 8 12.5 9.5 13 11C13.5 12.5 13 14 12 14Z"
          fill="hsl(var(--accent))"
        />
      </g>
    </svg>
  );
}
