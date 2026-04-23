import React from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Box from '@cloudscape-design/components/box';

export interface SelectionCardProps {
  title: string;
  icon?: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export default function SelectionCard({
  title,
  icon,
  description,
  selected = false,
  disabled = false,
  onClick,
  children,
}: SelectionCardProps) {
  return (
    <div
      onClick={() => !disabled && onClick?.()}
      style={{
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <Container
        header={
          <Header variant="h3">
            {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
            {title}
          </Header>
        }
        footer={
          selected ? (
            <Box color="text-status-success" fontSize="body-s">✓ Selected</Box>
          ) : undefined
        }
      >
        {children || (
          description && <Box color="text-body-secondary" fontSize="body-s">{description}</Box>
        )}
      </Container>
    </div>
  );
}

export { SelectionCard };
