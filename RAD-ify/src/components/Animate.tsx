import React from 'react';
import { motion, AnimatePresence as FramerAnimatePresence } from 'framer-motion';
import type {
  FadeInProps,
  StaggerChildrenProps,
  PopInProps,
  AnimatedPresenceProps,
  LayoutAnimateProps,
} from '../types/types';

export function FadeIn({ children, delay = 0, duration = 0.3, disabled = false }: FadeInProps) {
  if (disabled) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerChildren({ children, stagger = 0.06, disabled = false }: StaggerChildrenProps) {
  if (disabled) return <div>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {React.Children.map(children, (child) =>
        child ? (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
            }}
          >
            {child}
          </motion.div>
        ) : null,
      )}
    </motion.div>
  );
}

export function PopIn({ children, duration = 0.2, disabled = false }: PopInProps) {
  if (disabled) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedPresence({ children, id, disabled = false }: AnimatedPresenceProps) {
  if (disabled) return <div>{children}</div>;
  return (
    <FramerAnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </FramerAnimatePresence>
  );
}

export function LayoutAnimate({ children, className, disabled = false }: LayoutAnimateProps) {
  if (disabled) return <div className={className}>{children}</div>;
  return (
    <motion.div layout transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }} className={className}>
      {children}
    </motion.div>
  );
}
