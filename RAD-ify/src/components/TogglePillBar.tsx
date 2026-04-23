import React from 'react';
import Toggle from '@cloudscape-design/components/toggle';

export interface TogglePillOption {
  id: string;
  label: string;
}

export interface TogglePillBarProps {
  label?: string;
  labelIcon?: string;
  options: TogglePillOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function TogglePillBar({
  label,
  labelIcon = '🎯',
  options,
  selected,
  onChange,
}: TogglePillBarProps) {
  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(next);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        padding: '10px 16px',
        background: 'var(--rad-surface-secondary, #1a2332)',
        borderRadius: 10,
        border: '1px solid var(--rad-border-color, #2a2e33)',
      }}
    >
      {label && (
        <span
          style={{
            color: '#33bbef',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginRight: 4,
          }}
        >
          {labelIcon} {label}
        </span>
      )}
      {options.map((opt) => (
        <Toggle
          key={opt.id}
          checked={selected.includes(opt.id)}
          onChange={() => toggle(opt.id)}
        >
          {opt.label}
        </Toggle>
      ))}
    </div>
  );
}

export { TogglePillBar };
