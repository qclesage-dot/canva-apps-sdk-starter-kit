// src/components/FavoritesSection.tsx
import React from 'react';
import { Text } from '@canva/app-ui-kit';
import { IconGrid } from './IconGrid';
import { Icon } from '../types';

type Props = {
  favoriteIcons: Icon[];
  onInsert: (svgUrl: string) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
};

export const FavoritesSection: React.FC<Props> = ({
  favoriteIcons,
  onInsert,
  onToggleFavorite,
  isFavorite,
}) => {
  if (favoriteIcons.length === 0) return null;

  return (
    <>
      <Text size="small" tone="secondary">Favorites ❤️</Text>
      <IconGrid
        icons={favoriteIcons}
        onInsert={onInsert}
      />
    </>
  );
};