// src/components/IconItem.tsx
import React from 'react';
import { Box } from '@canva/app-ui-kit';
import { Icon } from '../types';

type Props = {
  icon: Icon;
  onInsert: (svgUrl: string) => void;
  onToggleFavorite?: (icon: Icon) => void;
  isFavorite?: (iconId: string) => boolean;
  onDragStart?: (e: React.DragEvent<HTMLElement>) => void;
};

export const IconItem: React.FC<Props> = ({
  icon,
  onInsert,
  onToggleFavorite,
  isFavorite,
  onDragStart,
}) => {
  const isIconFavorite = isFavorite?.(icon.id) ?? false;
  const isDraggable = !!onDragStart;

  return (
    <div style={{ position: 'relative' }}>
      <div
        draggable={isDraggable}
        onDragStart={onDragStart}
        onClick={() => onInsert(icon.svgUrl)}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: isDraggable ? 'grab' : 'pointer',
          width: '100%',
          padding: '4px',
        }}
      >
        <Box
          padding="0.5u"
          border='low'
          borderRadius="large"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <img src={icon.thumbnailUrl} alt={icon.title} width={48} height={48} />
        </Box>
      </div>

      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(icon);
          }}
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            padding: '0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'transform 0.1s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title={isIconFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isIconFavorite ? '❤️' : '🤍'}
        </button>
      )}
    </div>
  );
};