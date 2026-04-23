import React from 'react';

export interface ScoreCellProps {
  label: string;
  score: number;
  selected?: boolean;
  onClick?: () => void;
  frictionCount?: number;
}

function getScoreColors(score: number) {
  if (score >= 0.7) return { color: '#3fb950', bg: '#0d2818', border: '#238636' };
  if (score >= 0.4) return { color: '#d29922', bg: '#2a1f00', border: '#9e6a03' };
  return { color: '#f85149', bg: '#2d0a0a', border: '#da3633' };
}

export default function ScoreCell({
  label,
  score,
  selected = false,
  onClick,
  frictionCount,
}: ScoreCellProps) {
  const { color, bg, border } = getScoreColors(score);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'center',
        padding: selected ? '16px 14px' : '14px 12px',
        borderRadius: 10,
        background: bg,
        border: `${selected ? '3px' : '2px'} solid ${border}`,
        boxShadow: selected ? `inset 0 0 20px ${border}66, 0 0 12px ${border}33` : 'none',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
        position: 'relative',
        color: 'inherit',
        font: 'inherit',
        transform: selected ? 'scale(1.08)' : 'scale(1)',
        minWidth: 120,
      }}
    >
      {selected && (
        <span style={{ position: 'absolute', top: 6, right: 8, color: '#ffffff', fontSize: 12, fontWeight: 700 }}>
          ✓
        </span>
      )}
      <div style={{ color, fontWeight: 600, fontSize: 13 }}>{label}</div>
      <div style={{ color, fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>
        {(score * 100).toFixed(0)}%
      </div>
      {frictionCount !== undefined && frictionCount > 0 && (
        <div style={{ color: '#8b949e', fontSize: 11, marginTop: 4 }}>
          {frictionCount} friction
        </div>
      )}
    </button>
  );
}

export { ScoreCell };
