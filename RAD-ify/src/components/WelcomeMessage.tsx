import React from 'react';
import { motion } from 'framer-motion';
import EmberTypingMessage from './EmberTypingMessage';
import '../styles/WelcomeMessage.css';

export interface WelcomeMessageProps {
  text: string;
  show: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  typeSpeed?: number;
  dotDelay?: number;
  typeStartDelay?: number;
}

export default function WelcomeMessage({
  text,
  show,
  onClick,
  onMouseEnter,
  onMouseLeave,
  typeSpeed = 24,
  dotDelay = 600,
  typeStartDelay = 500,
}: WelcomeMessageProps) {
  if (!show) return null;

  return (
    <motion.div
      className="welcome-message"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <EmberTypingMessage
        text={text}
        show={show}
        typeSpeed={typeSpeed}
        dotDelay={dotDelay}
        typeStartDelay={typeStartDelay}
        onClick={onClick}
      />
    </motion.div>
  );
}

export { WelcomeMessage };
