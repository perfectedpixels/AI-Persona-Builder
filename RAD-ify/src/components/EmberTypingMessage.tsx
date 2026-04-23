import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/EmberTypingMessage.css';

export interface EmberTypingMessageProps {
  text: string;
  show: boolean;
  typeSpeed?: number;
  dotDelay?: number;
  typeStartDelay?: number;
  showCheck?: boolean;
  onComplete?: () => void;
  onClick?: () => void;
}

export default function EmberTypingMessage({
  text,
  show,
  typeSpeed = 60,
  dotDelay = 600,
  typeStartDelay = 500,
  showCheck = false,
  onComplete,
  onClick,
}: EmberTypingMessageProps) {
  const [dotVisible, setDotVisible] = useState(false);
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!show) {
      setDotVisible(false);
      setDisplayed('');
      setDone(false);
      return;
    }

    let charTimer: ReturnType<typeof setTimeout>;
    const dotTimer = setTimeout(() => setDotVisible(true), dotDelay);

    const words = text.split(/(\s+)/);
    let wordIndex = 0;
    const typeTimer = setTimeout(() => {
      const tick = () => {
        wordIndex++;
        setDisplayed(words.slice(0, wordIndex).join(''));
        if (wordIndex < words.length) {
          charTimer = setTimeout(tick, typeSpeed);
        } else {
          setDone(true);
          onCompleteRef.current?.();
        }
      };
      tick();
    }, dotDelay + typeStartDelay);

    return () => {
      clearTimeout(dotTimer);
      clearTimeout(typeTimer);
      clearTimeout(charTimer);
    };
  }, [show, text, typeSpeed, dotDelay, typeStartDelay]);

  if (!show) return null;

  return (
    <div
      className="ember-typing-message"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      {displayed && (
        <p>
          {displayed}
          {!done && <span className="ember-typing-cursor" />}
        </p>
      )}
      {dotVisible && (
        <AnimatePresence mode="wait">
          {showCheck ? (
            <motion.span
              key="check"
              className="ember-dot ember-dot-check"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              ✓
            </motion.span>
          ) : (
            <motion.span
              key="dot"
              className="ember-dot"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            />
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export { EmberTypingMessage };
