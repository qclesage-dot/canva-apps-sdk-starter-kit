import { useEffect, useState } from "react";

/**
 * Hook to detect if dark mode is active
 * Uses the standard prefers-color-scheme media query
 * @returns true if dark mode is active, false otherwise
 */
export const useDarkMode = (): boolean => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize with current preference
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    darkModeQuery.addEventListener("change", handleChange);

    return () => darkModeQuery.removeEventListener("change", handleChange);
  }, []);

  return isDarkMode;
};
