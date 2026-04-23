import React from 'react';
import type { StepNavProps, Step } from '../types/types';

export default function StepNav({
  title,
  steps,
  activeHref,
  completedHrefs = [],
  onNavigate,
  collapsed = false,
  onToggle,
}: StepNavProps) {
  return (
    <div
      style={{
        width: collapsed ? 56 : 240,
        background: '#0f1b2a',
        borderRight: '1px solid #2a2e33',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
        height: '100vh',
      }}
    >
      {/* Collapse toggle */}
      {onToggle && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 12px 0' }}>
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            style={{
              background: '#1a2332',
              border: '1px solid #2a2e33',
              borderRadius: 8,
              color: '#8b949e',
              cursor: 'pointer',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>
      )}

      {!collapsed && (
        <>
          {/* Title section */}
          {title && (
            <div style={{ padding: '20px 20px 24px' }}>
              <div
                style={{
                  color: '#33bbef',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Progress
              </div>
              <div style={{ color: '#e6edf3', fontSize: 18, fontWeight: 600 }}>{title}</div>
            </div>
          )}

          {/* Steps */}
          <div style={{ padding: '0 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {steps.map((step, i) => {
                const isActive = step.href === activeHref;
                const isCompleted = completedHrefs.includes(step.href);
                const isDisabled = step.disabled && !isActive;

                return (
                  <div
                    key={step.href}
                    onClick={() => {
                      if (!isDisabled) onNavigate(step.href);
                    }}
                    className={isActive ? 'step-animate' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      cursor: isDisabled ? 'default' : 'pointer',
                      opacity: isDisabled ? 0.4 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {/* Number circle */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                        background: isActive ? '#33bbef' : isCompleted ? '#238636' : '#2a2e33',
                        color: isActive ? '#0f1b2a' : isCompleted ? '#fff' : '#8b949e',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      {isCompleted && !isActive ? '✓' : i + 1}
                    </div>
                    {/* Label */}
                    <div>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? '#e6edf3' : isDisabled ? '#484f58' : '#8b949e',
                          transition: 'color 0.15s',
                        }}
                      >
                        {step.label}
                      </span>
                      {step.description && (
                        <div style={{ fontSize: 12, color: '#484f58', marginTop: 2 }}>
                          {step.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Collapsed: just show step numbers */}
      {collapsed && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            marginTop: 20,
          }}
        >
          {steps.map((step, i) => {
            const isActive = step.href === activeHref;
            const isCompleted = completedHrefs.includes(step.href);
            return (
              <div
                key={step.href}
                onClick={() => !step.disabled && onNavigate(step.href)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: step.disabled ? 'default' : 'pointer',
                  background: isActive ? '#33bbef' : isCompleted ? '#238636' : '#2a2e33',
                  color: isActive ? '#0f1b2a' : isCompleted ? '#fff' : '#8b949e',
                  opacity: step.disabled && !isActive ? 0.4 : 1,
                }}
              >
                {isCompleted && !isActive ? '✓' : i + 1}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ flex: 1 }} />
    </div>
  );
}

export { StepNav };
