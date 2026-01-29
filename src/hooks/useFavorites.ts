// src/hooks/useFavorites.ts
import { useState, useEffect } from "react";
import type { Icon } from "../types";

const MAX_FAVORITES = 100;

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Icon[]>([]);
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("iconvault_favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("iconvault_favorites", JSON.stringify(favorites));
  }, [favorites]);

  // A reasonable limit

  const toggle = (icon: Icon) => {
    setIsLimitReached(false); // Reset the error on every click

    setFavorites((prev) => {
      const exists = prev.find((fav) => fav.id === icon.id);
      if (exists) {
        return prev.filter((fav) => fav.id !== icon.id);
      }

      if (prev.length >= MAX_FAVORITES) {
        setIsLimitReached(true); // Trigger the alert state
        return prev;
      }

      return [icon, ...prev];
    });
  };

  const isFavorite = (iconId: string) =>
    favorites.some((fav) => fav.id === iconId);

  return {
    favorites,
    toggle,
    isFavorite,
    isLimitReached,
    setIsLimitReached, 
  };
};
