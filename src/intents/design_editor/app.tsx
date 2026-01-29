// src/app.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Rows,
  Title,
  LoadingIndicator,
  Box,
  Button,
  Text,
  ColorSelector,
  Alert,
} from "@canva/app-ui-kit";
import { ui, addElementAtPoint } from "@canva/design";
import { upload } from "@canva/asset";
import { useFeatureSupport } from "@canva/app-hooks";

import { SearchBar } from "../../components/SearchBar";
import { IconGrid } from "../../components/IconGrid";
import { useFavorites } from "../../hooks/useFavorites";
import { useDarkMode } from "../../hooks/useDarkMode";
import { useColorHistory } from "../../hooks/useColorHistory";
import type { Icon } from "../../types";
import { useIntl, FormattedMessage } from "react-intl";

// UI Text Constants
const FAVORITE_ICON = "❤️";
const UNFAVORITE_ICON = "🤍";

export const App = () => {
  const [query, setQuery] = useState("");
  const [icons, setIcons] = useState<Icon[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>("#000000");
  const [insertError, setInsertError] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const intl = useIntl();
  const isSupported = useFeatureSupport();
  const {
    favorites,
    toggle: toggleFavorite,
    isFavorite,
    isLimitReached,
    setIsLimitReached,
  } = useFavorites();
  const isDarkMode = useDarkMode();
  const { recentColors, addColor } = useColorHistory();

  const ITEMS_PER_PAGE = 24;
  const FAVORITES_PER_PAGE = 8;
  const totalPages = Math.ceil(icons.length / ITEMS_PER_PAGE);
  const totalFavoritesPages = Math.ceil(favorites.length / FAVORITES_PER_PAGE);
  const [draftColor, setDraftColor] = useState(selectedColor);
  const [committedColor, setCommittedColor] = useState(selectedColor);
  const pickerOpen = useRef(false);
  const cache = useRef<Map<string, Icon[]>>(new Map());

  const paginatedIcons = icons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const paginatedFavorites = favorites.slice(
    (favoritesPage - 1) * FAVORITES_PER_PAGE,
    favoritesPage * FAVORITES_PER_PAGE,
  );

  const fetchIcons = async (q: string, color: string) => {
    if (q.length < 2) return;

    const key = `${q.toLowerCase()}_${color.toUpperCase()}`;

    // 1️⃣ Cache hit → instant UI update, no API call
    if (cache.current.has(key)) {
      setIcons(cache.current.get(key)!);
      setLoading(false);
      return;
    }
    if (cache.current.size > 100) {
      cache.current.clear();
    }

    setLoading(true);

    try {
      const hexParam = color.replace("#", "%23");

      const res = await fetch(
        `https://iconflow-api-568416828650.us-central1.run.app/search?query=${encodeURIComponent(q)}&limit=72`,
      );

      const data = await res.json();

      const results = data.icons.map((icon: string) => ({
        id: icon,
        title: icon,
        thumbnailUrl: `https://iconflow-api-568416828650.us-central1.run.app/${icon}.svg?height=48&width=48&color=${hexParam}`,
        svgUrl: `https://iconflow-api-568416828650.us-central1.run.app/${icon}.svg?height=80&width=80&color=${hexParam}`,
      }));

      setIcons(results);
      cache.current.set(key, results);
    } catch (err) {
      console.error("Search failed:", err);
      setIcons([]);
    } finally {
      setLoading(false);
    }
  };
  const commitColor = (color: string) => {
    setSelectedColor(color);
    setDraftColor(color);
    setCommittedColor(color);
    addColor(color);

    // only search if query is valid
    if (query.length >= 2) {
      fetchIcons(query, color);
    }
  };

  // Default search on load
  useEffect(() => {
    fetchIcons("icon", committedColor);
  }, []);

  // User typing debounce
  useEffect(() => {
    if (pickerOpen.current) return;
    if (query.length < 2 && icons.length === 0) return;

    setCurrentPage(1);
    const timeout = setTimeout(() => {
      fetchIcons(query || "icon", committedColor);
    }, 600);

    return () => clearTimeout(timeout);
  }, [query, committedColor]);

  const uploadIconSvg = async (svgUrl: string) => {
    const res = await fetch(svgUrl);
    const svg = await res.text();
    const bytes = new TextEncoder().encode(svg);
    const binString = Array.from(bytes, (byte) =>
      String.fromCodePoint(byte),
    ).join("");
    const base64 = btoa(binString);
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    return upload({
      type: "image",
      mimeType: "image/svg+xml",
      url: dataUrl,
      thumbnailUrl: dataUrl,
      width: 80,
      height: 80,
      aiDisclosure: "none",
    });
  };

  const createDragHandler =
    (icon: Icon) => async (e: React.DragEvent<HTMLElement>) => {
      try {
        const dragData = {
          type: "image" as const,
          resolveImageRef: () => uploadIconSvg(icon.svgUrl),
          previewUrl: icon.thumbnailUrl,
          previewSize: { width: 48, height: 48 },
          fullSize: { width: 80, height: 80 },
        };

        if (isSupported(ui.startDragToPoint)) {
          ui.startDragToPoint(e, dragData);
        } else if (isSupported(ui.startDragToCursor)) {
          ui.startDragToCursor(e, dragData);
        }
      } catch (err) {
        console.error("Drag failed:", err);
      }
    };

  const insertIcon = async (svgUrl: string) => {
    try {
      const uploadResult = await uploadIconSvg(svgUrl);

      await addElementAtPoint({
        type: "image",
        ref: uploadResult.ref,
        altText: undefined,
      });
    } catch (err) {
      console.error("Failed to insert icon:", err);
      setInsertError(true);
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setIcons([]);
  };

  return (
    <>
      <Rows spacing="1u">
        <Title size="medium">
          <FormattedMessage
            defaultMessage="IconFlow – 200k+ Icons"
            description="Main app title shown at the top"
          />
        </Title>
        {insertError && (
          <Alert
            tone="critical"
            title={intl.formatMessage({
              defaultMessage: "Insert failed",
              description: "Alert title when icon insertion fails",
            })}
            onDismiss={() => setInsertError(false)}
          >
            {intl.formatMessage({
              defaultMessage: "Failed to insert icon. Please try again.",
              description: "Alert message when icon insertion fails",
            })}
          </Alert>
        )}
        <div style={{ width: "99%" }}>
          <SearchBar
            value={query}
            onChange={setQuery}
            onClear={handleClearSearch}
            inputRef={searchInputRef}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "8.2px",
            alignItems: "center",
            marginBottom: "0px",
          }}
        >
          {/* Color selector */}
          <ColorSelector
            color={draftColor}
            triggerMode="addColorButton"
            onOpen={() => {
              pickerOpen.current = true;
            }}
            onClose={() => {
              pickerOpen.current = false;

              if (draftColor !== committedColor) {
                setCommittedColor(draftColor);
                addColor(draftColor);
              }
            }}
            onChange={(hex) => {
              setDraftColor(hex);
              setSelectedColor(hex); // visual only
            }}
          />

          {recentColors.map((c, i) => {
            const color = i === 0 ? draftColor : c;

            return (
              <button
                key={i === 0 ? "live" : c}
                onClick={() => commitColor(color)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: color,
                  border:
                    color === selectedColor
                      ? "3px solid #00000086"
                      : "2px solid #dddddd9c",
                  cursor: "pointer",
                }}
                aria-label={intl.formatMessage(
                  {
                    defaultMessage: "Search icons in color {color}",
                    description: "Aria label for color selector button",
                  },
                  { color },
                )}
              />
            );
          })}
        </div>
        <Box padding="1u">
          {loading && <LoadingIndicator size="medium" />}

          {icons.length === 0 && !loading && query.length >= 2 && (
            <Text tone="secondary">
              {intl.formatMessage({
                defaultMessage: 'No results – try "home" or "user"',
                description:
                  "Message when no icons are found for a search query",
              })}
            </Text>
          )}

          {paginatedIcons.length > 0 && (
            <>
              {" "}
              <Text size="small" tone="secondary">
                {query.length > 0
                  ? intl.formatMessage(
                      {
                        defaultMessage: "Results · {query}",
                        description: "Results count with search query",
                      },
                      { query },
                    )
                  : intl.formatMessage({
                      defaultMessage: "Popular icons",
                      description: "Title for popular icons section",
                    })}
              </Text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "6px",
                  width: "99%",
                }}
              >
                {paginatedIcons.map((icon) => {
                  const handleDragStart = createDragHandler(icon);

                  return (
                    <div
                      key={icon.id}
                      style={{
                        backgroundColor: isDarkMode ? "#5c5c5cf5" : "#ffffff",
                        position: "relative",
                      }}
                    >
                      <div
                        draggable
                        onDragStart={handleDragStart}
                        onClick={() => insertIcon(icon.svgUrl)}
                        style={{
                          cursor: "grab",
                          borderRadius: "6px",
                        }}
                      >
                        <Box
                          padding="0.5u"
                          border="low"
                          borderRadius="standard"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <img
                            src={icon.thumbnailUrl}
                            alt={icon.title}
                            width={48}
                            height={48}
                          />
                        </Box>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(icon);
                        }}
                        style={{
                          position: "absolute",
                          top: -5,
                          right: -5,
                          background: isDarkMode ? "#2b2b2b" : "#ffffff",
                          color: isFavorite(icon.id)
                            ? "#e25555"
                            : isDarkMode
                              ? "#999"
                              : "#666",
                          borderRadius: "100%",
                          border: isDarkMode
                            ? "1px solid #3a3a3a"
                            : "1px solid #ddd",
                          fontSize: "14px",
                          width: "22px",
                          height: "22px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "none",
                          opacity: isFavorite(icon.id) ? 0.9 : 0.6,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.1)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      >
                        {isFavorite(icon.id) ? FAVORITE_ICON : UNFAVORITE_ICON}
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "99%",
                    padding: "8px 10px 4px 0px",
                  }}
                >
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    {intl.formatMessage({
                      defaultMessage: "Prev",
                      description: "Previous page button text",
                    })}
                  </Button>

                  <Text tone="secondary">
                    {currentPage} / {totalPages}
                  </Text>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    {intl.formatMessage({
                      defaultMessage: "Next",
                      description: "Next page button text",
                    })}
                  </Button>
                </div>
              )}
            </>
          )}
        </Box>
      </Rows>

      {/* Favorites Section */}
      <div
        style={{
          position: "fixed",
          bottom: "8px",
          left: "23px",
          right: "10px",
          zIndex: 100,
        }}
      >
        <Box padding="2u" border="low" borderRadius="standard">
          {favorites.length > 0 ? (
            <>
              <Text size="small" tone="secondary">
                <FormattedMessage
                  defaultMessage="Favorites ({count})"
                  description="Label showing number of favorite icons"
                  values={{ count: favorites.length }}
                />
              </Text>
              {isLimitReached && (
                <Box padding="1u">
                  <Alert
                    tone="warn"
                    title={intl.formatMessage({
                      defaultMessage: "Limit reached",
                      description: "Alert title when favorite limit is reached",
                    })}
                    onDismiss={() => setIsLimitReached(false)}
                  >
                    {intl.formatMessage({
                      defaultMessage: "Remove an icon to add a new favorite.",
                      description:
                        "Alert message when favorite limit is reached",
                    })}
                  </Alert>
                </Box>
              )}
              <div style={{ marginTop: "8px" }}>
                <IconGrid
                  icons={paginatedFavorites}
                  onInsert={insertIcon}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={isFavorite}
                  createDragHandler={createDragHandler}
                />
              </div>

              {/* Favorites Pagination */}
              {totalFavoritesPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "4px 0px 4px 4px",
                  }}
                >
                  <Button
                    variant="secondary"
                    onClick={() => setFavoritesPage((p) => Math.max(1, p - 1))}
                    disabled={favoritesPage === 1}
                  >
                    {intl.formatMessage({
                      defaultMessage: "Prev",
                      description: "Previous page button text",
                    })}
                  </Button>

                  <Text size="small" tone="secondary">
                    {favoritesPage} / {totalFavoritesPages}
                  </Text>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      setFavoritesPage((p) =>
                        Math.min(totalFavoritesPages, p + 1),
                      )
                    }
                    disabled={favoritesPage === totalFavoritesPages}
                  >
                    {intl.formatMessage({
                      defaultMessage: "Next",
                      description: "Next page button text",
                    })}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Box
              padding="1u"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text tone="secondary" alignment="center">
                {intl.formatMessage({
                  defaultMessage:
                    "Click the heart icon on any icon to add it to favorites",
                  description:
                    "Message shown when the user has no favorite icons",
                })}
              </Text>
            </Box>
          )}
        </Box>
      </div>
    </>
  );
};

export default App;
