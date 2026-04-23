import React, { useEffect, useRef } from 'react';
import type { ScanInterstitialProps } from '../types/types';

export default function ScanInterstitial({
  progress: rawProgress,
  logEntries = [],
  onComplete,
}: ScanInterstitialProps) {
  const progress = Math.max(0, Math.min(100, rawProgress));
  const done = progress >= 100;
  const logRef = useRef<HTMLDivElement>(null);
  const completeFired = useRef(false);

  // Auto-scroll log area when new entries appear
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries]);

  // Fire onComplete when progress reaches 100
  useEffect(() => {
    if (done && onComplete && !completeFired.current) {
      completeFired.current = true;
      onComplete();
    }
  }, [done, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#0f1b2a',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
    >
      {/* Spinner */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: done ? '4px solid #3fb950' : '4px solid #2a2e33',
          borderTopColor: done ? '#3fb950' : '#33bbef',
          animation: done ? 'none' : 'spin 0.8s linear infinite',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          transition: 'border-color 0.3s ease',
        }}
      >
        {done ? '✓' : ''}
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: 400,
          maxWidth: '80%',
          height: 6,
          background: '#2a2e33',
          borderRadius: 3,
          marginBottom: 24,
          overflow: 'hidden',
        }}
      >
        <div
          data-testid="progress-bar-fill"
          style={{
            height: '100%',
            borderRadius: 3,
            background: done ? '#3fb950' : 'linear-gradient(90deg, #33bbef, #58a6ff)',
            width: `${progress}%`,
            transition: 'width 0.4s ease, background 0.3s ease',
          }}
        />
      </div>

      {/* Log entries */}
      <div
        ref={logRef}
        style={{
          width: 500,
          maxWidth: '90%',
          maxHeight: 300,
          overflowY: 'auto',
          background: '#161b22',
          border: '1px solid #2a2e33',
          borderRadius: 8,
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 13,
        }}
      >
        {logEntries.map((entry, i) => (
          <div
            key={i}
            style={{
              color: '#8b949e',
              padding: '2px 0',
              animation: 'fadeSlide 0.2s ease',
            }}
          >
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
}

export { ScanInterstitial };
