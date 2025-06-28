
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
          .flame-path-group {
            animation: flicker 2.5s linear infinite;
            transform-origin: 12px 7px; /* x y of flame base */
          }

          @keyframes flicker {
            0%, 100% { transform: scale(1) rotate(-1deg); opacity: 1; }
            50% { transform: scale(1.1) rotate(1deg) translate(0, -2px); opacity: 0.9; }
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
        d="M7 9C7 8.44772 7.44772 8 8 8H16C16.5523 8 17 8.44772 17 9V23H7V9Z"
        strokeWidth="1.5"
      />
       {/* Wick */}
      <path d="M12 6.5V8" stroke="hsl(var(--foreground))" strokeWidth="1.5" strokeLinecap="round" />
      {/* Flame */}
      <g className="flame-path-group">
         <path
          d="M12 7C9.5 7 9 4.5 10.5 2C11.5 0 12 0 12 0C12 0 12.5 0 13.5 2C15 4.5 14.5 7 12 7Z"
          fill="hsl(var(--accent))"
        />
      </g>
    </svg>
  );
}
