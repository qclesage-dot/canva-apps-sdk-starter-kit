import { useState, useEffect } from "react";

const STORAGE_KEY = "iconflow_recent_colors";
const DEFAULT_COLORS = ["#000000", "#ffffff", "#00c4cc"];

export const useColorHistory = () => {
  // 1. Initialize state from LocalStorage
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_COLORS;
    } catch {
      return DEFAULT_COLORS;
    }
  });

  // 2. Persist to LocalStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentColors));
  }, [recentColors]);

  // 3. Helper to update the list
  const addColor = (color: string) => {
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== color.toLowerCase());
      return [color, ...filtered].slice(0, 6);
    });
  };

  const clearHistory = () => setRecentColors(DEFAULT_COLORS);

  return { recentColors, addColor, clearHistory };
};