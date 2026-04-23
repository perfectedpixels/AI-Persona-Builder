import React from 'react';
import type { ToolBarProps } from '../types/types';
import '../styles/ToolBar.css';

export default function ToolBar({
  value,
  onChange,
  onSend,
  placeholder = 'Chat',
  fuse = true,
  accentColor,
  disabled = false,
  actions,
}: ToolBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim() && !disabled) {
      onSend();
    }
  };

  const fuseActive = fuse && !disabled;

  return (
    <div className="toolbar-wrapper">
      <div
        className={`toolbar toolbar-chat${fuseActive ? ' toolbar-fuse' : ''}`}
        style={
          accentColor && fuseActive
            ? ({ '--rad-toolbar-accent': accentColor } as React.CSSProperties)
            : undefined
        }
      >
        <input
          className="toolbar-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Chat input"
        />
        <span className="toolbar-shortcut">⌘K</span>
      </div>
      {actions && (
        <div className="toolbar toolbar-actions">{actions}</div>
      )}
    </div>
  );
}

export { ToolBar };
