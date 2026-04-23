import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Box from '@cloudscape-design/components/box';
import type { FocusGridProps, FocusCard } from '../types/types';

export type { FocusCard };

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const DUR = 0.4;

export default function FocusGrid({
  cards,
  defaultFocused,
  focused: controlledFocused,
  onFocusChange,
  columns,
}: FocusGridProps) {
  const [internalFocused, setInternalFocused] = useState<string | null>(
    defaultFocused || null,
  );
  const focused = controlledFocused !== undefined ? controlledFocused : internalFocused;

  const setFocused = (id: string | null) => {
    if (onFocusChange) onFocusChange(id);
    else setInternalFocused(id);
  };

  const toggle = (id: string) => {
    const next = focused === id ? null : id;
    setFocused(next);
    if (next) {
      const card = cards.find((c) => c.id === next);
      if (card?.onFocus) setTimeout(card.onFocus, 400);
    }
  };

  const hasFocus = focused !== null;
  const focusedCard = cards.find((c) => c.id === focused);
  const others = cards.filter((c) => c.id !== focused);
  const colCount = columns ?? cards.length;

  // No focus: equal columns
  if (!hasFocus) {
    return (
      <LayoutGroup>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${colCount}, 1fr)`,
            gap: 12,
          }}
        >
          {cards.map((card) => (
            <motion.div
              key={card.id}
              layoutId={card.id}
              onClick={() => toggle(card.id)}
              style={{ cursor: 'pointer', minWidth: 0 }}
              transition={{ duration: DUR, ease: EASE }}
            >
              <Thumb card={card} />
            </motion.div>
          ))}
        </div>
      </LayoutGroup>
    );
  }

  // Focused: 70% left + 30% right stacked
  return (
    <LayoutGroup>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Focused — 70% */}
        <motion.div
          key={focusedCard!.id}
          layoutId={focusedCard!.id}
          onClick={() => toggle(focusedCard!.id)}
          style={{ flex: '0 0 68%', cursor: 'pointer' }}
          transition={{ duration: DUR, ease: EASE }}
        >
          <Container
            header={<Header variant="h2">{focusedCard!.icon} {focusedCard!.title}</Header>}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              {focusedCard!.content}
            </motion.div>
          </Container>
        </motion.div>

        {/* Others — 30% stacked */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {others.map((card) => (
            <motion.div
              key={card.id}
              layoutId={card.id}
              onClick={() => toggle(card.id)}
              style={{ cursor: 'pointer' }}
              transition={{ duration: DUR, ease: EASE }}
            >
              <Thumb card={card} />
            </motion.div>
          ))}
        </div>
      </div>
    </LayoutGroup>
  );
}

function Thumb({ card }: { card: FocusCard }) {
  return (
    <Container header={<Header variant="h3">{card.icon} {card.title}</Header>}>
      <div
        style={{
          height: 90,
          overflow: 'hidden',
          position: 'relative',
          pointerEvents: 'none',
        }}
      >
        {card.thumbnail ? (
          <div style={{ padding: '4px 0' }}>{card.thumbnail}</div>
        ) : (
          <div
            style={{
              transform: 'scale(0.32)',
              transformOrigin: 'top left',
              width: '310%',
              opacity: 0.4,
              filter: 'saturate(0.35)',
            }}
          >
            {card.content}
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '20px 8px 6px',
            background:
              'linear-gradient(transparent, var(--color-background-container-content, #191D23) 70%)',
          }}
        >
          <Box color="text-body-secondary" fontSize="body-s">
            {card.summary}
          </Box>
        </div>
      </div>
    </Container>
  );
}

export { FocusGrid };
