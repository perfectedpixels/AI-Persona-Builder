import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/ThinkingReasoning.css';

export interface ThinkingReasoningProps {
  steps?: string[];
  prefix?: string;
  stepDuration?: number;
  initiallyComplete?: boolean;
  centered?: boolean;
  onComplete?: () => void;
}

const DEFAULT_STEPS = [
  'analyzing requirements',
  'selecting relevant data',
  'calibrating parameters',
  'building plan',
  'evaluating results',
  'optimizing structure',
];

export default function ThinkingReasoning({
  steps = DEFAULT_STEPS,
  prefix: _prefix = 'Processing',
  stepDuration = 1000,
  initiallyComplete = false,
  centered = false,
  onComplete,
}: ThinkingReasoningProps) {
  const [currentStep, setCurrentStep] = useState(initiallyComplete ? steps.length - 1 : 0);
  const [isComplete, setIsComplete] = useState(initiallyComplete);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const totalSteps = steps.length;

  const advance = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setIsComplete(true);
      onCompleteRef.current?.();
    }
  }, [currentStep, totalSteps]);

  useEffect(() => {
    if (isComplete) return;
    const timer = setTimeout(advance, stepDuration);
    return () => clearTimeout(timer);
  }, [advance, stepDuration, isComplete]);

  const GRID_SIZE = 5;
  const SWEEP_DURATION = 4;
  const radialDelay = (row: number, col: number): number => {
    const center = (GRID_SIZE - 1) / 2;
    const distance = Math.sqrt((row - center) ** 2 + (col - center) ** 2);
    const maxDistance = Math.sqrt(center ** 2 + center ** 2);
    return (distance / maxDistance) * (SWEEP_DURATION * 0.35);
  };

  if (isComplete) return null;

  return (
    <motion.div
      className={`thinking-reasoning${centered ? ' thinking-centered' : ''}`}
      {...(centered
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } }
        : {})}
    >
      <div className="thinking-layout">
        <div className="thinking-step-line">
          <div className="pixel-dot-grid" style={{ '--sweep-duration': `${SWEEP_DURATION}s` } as React.CSSProperties}>
            {Array.from({ length: GRID_SIZE }, (_, row) => (
              <div className="pixel-dot-row" key={row}>
                {Array.from({ length: GRID_SIZE }, (_, col) => (
                  <span
                    key={col}
                    className="pixel-dot variant-radial"
                    style={{ animationDelay: `${radialDelay(row, col)}s` }}
                  />
                ))}
              </div>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={currentStep}
              className="thinking-step-text"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {steps[currentStep].charAt(0).toUpperCase() + steps[currentStep].slice(1).toLowerCase()}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export { ThinkingReasoning };
