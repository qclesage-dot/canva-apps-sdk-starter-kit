// src/hooks/useFavorites.ts
import { useState, useEffect } from 'react';
import { Icon } from '../types';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Icon[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('iconvault_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to load favorites:', err);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('iconvault_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggle = (icon: Icon) => {
    setFavorites(prev => {
      const exists = prev.find(fav => fav.id === icon.id);
      if (exists) {
        return prev.filter(fav => fav.id !== icon.id);
      }
      return [...prev, icon];
    });
  };

  const isFavorite = (iconId: string) => favorites.some(fav => fav.id === iconId);

  const remove = (iconId: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== iconId));
  };

  return { favorites, toggle, isFavorite, remove };
};