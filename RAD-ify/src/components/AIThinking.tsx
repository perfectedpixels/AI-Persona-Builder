import React from 'react';
import '../styles/AIThinking.css';

export type AIThinkingVariant = 'default' | 'orbit' | 'fade' | 'ripple';

export interface AIThinkingProps {
  variant?: AIThinkingVariant;
  gridCount?: number;
  size?: number;
  gap?: number;
}

function diagonalDelay(row: number, col: number, duration: number, gridCount: number): number {
  const maxDiag = (gridCount - 1) * 2;
  return maxDiag > 0 ? ((row + col) / maxDiag) * duration : 0;
}

function radialDelay(row: number, col: number, duration: number, gridCount: number): number {
  const center = (gridCount - 1) / 2;
  const dist = Math.sqrt(Math.pow(row - center, 2) + Math.pow(col - center, 2));
  const maxDist = Math.sqrt(2 * Math.pow(center, 2));
  return maxDist > 0 ? (dist / maxDist) * duration : 0;
}

function spiralDelay(row: number, col: number, duration: number, gridCount: number): number {
  const center = (gridCount - 1) / 2;
  const dx = col - center;
  const dy = row - center;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI);
  const maxDist = Math.sqrt(2 * Math.pow(center, 2));
  const normalizedDist = maxDist > 0 ? dist / maxDist : 0;
  return (normalizedDist * 0.7 + angle * 0.3) * duration;
}

function rippleDelay(row: number, col: number, duration: number, gridCount: number): number {
  const center = (gridCount - 1) / 2;
  const dist = Math.max(Math.abs(row - center), Math.abs(col - center));
  const maxDist = Math.ceil(center);
  return maxDist > 0 ? (dist / maxDist) * duration : 0;
}

const DELAY_FNS = { default: diagonalDelay, fade: radialDelay, orbit: spiralDelay, ripple: rippleDelay };
const DURATIONS = { default: 1.8, fade: 1.4, orbit: 2.0, ripple: 2.4 };

export default function AIThinking({ variant = 'default', gridCount = 3, size = 8, gap = 4 }: AIThinkingProps) {
  const total = gridCount * gridCount;
  const sweepDuration = DURATIONS[variant];
  const delayFn = DELAY_FNS[variant];

  return (
    <div className="ai-thinking-visualization">
      <div
        className="ai-thinking-grid"
        style={{ gridTemplateColumns: `repeat(${gridCount}, ${size}px)`, gap: `${gap}px` }}
      >
        {Array.from({ length: total }, (_, i) => {
          const row = Math.floor(i / gridCount);
          const col = i % gridCount;
          const delay = delayFn(row, col, sweepDuration, gridCount);
          return (
            <div
              key={`${row}-${col}`}
              className={`ai-thinking-dot ai-thinking-${variant}`}
              style={{
                width: size,
                height: size,
                borderRadius: 3,
                animationDelay: `${delay}s`,
                '--sweep-duration': `${sweepDuration}s`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>
    </div>
  );
}

export { AIThinking };
