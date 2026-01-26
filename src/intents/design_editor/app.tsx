// src/app.tsx
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  Rows,
  Title,
  LoadingIndicator,
  Box,
  Button,
  Text,
} from "@canva/app-ui-kit";
import { ui, addNativeElement } from "@canva/design";
import { upload } from "@canva/asset";
import { useFeatureSupport } from "@canva/app-hooks";

import { SearchBar } from "../../components/SearchBar";
import { IconGrid } from "../../components/IconGrid";
import { useFavorites } from "../../hooks/useFavorites";
import { useDarkMode } from "../../hooks/useDarkMode";
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
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const intl = useIntl();
  const isSupported = useFeatureSupport();
  const { favorites, toggle: toggleFavorite, isFavorite } = useFavorites();
  const isDarkMode = useDarkMode();

  const ITEMS_PER_PAGE = 24;
  const FAVORITES_PER_PAGE = 8;
  const totalPages = Math.ceil(icons.length / ITEMS_PER_PAGE);
  const totalFavoritesPages = Math.ceil(favorites.length / FAVORITES_PER_PAGE);

  const paginatedIcons = icons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const paginatedFavorites = favorites.slice(
    (favoritesPage - 1) * FAVORITES_PER_PAGE,
    favoritesPage * FAVORITES_PER_PAGE,
  );

const fetchIcons = async (q: string) => {
  if (q.length < 2) {
    setIcons([]);
    return;
  }

  setLoading(true);
  try {
    const res = await fetch(
      `https://iconflow-api-568416828650.us-central1.run.app/search?query=${encodeURIComponent(q)}&limit=50`
    );

    const data = await res.json();

    const results = data.icons.map((icon: string) => ({
      id: icon,
      title: icon,
      thumbnailUrl: `https://iconflow-api-568416828650.us-central1.run.app/${icon}.svg?height=48&width=48`,
      svgUrl: `https://iconflow-api-568416828650.us-central1.run.app/${icon}.svg?height=80&width=80`,
    }));

    setIcons(results);
    setCurrentPage(1); // important UX fix
  } finally {
    setLoading(false);
  }
};

// Default search on load
useEffect(() => {
  fetchIcons("icon");
}, []);

// User typing debounce
useEffect(() => {
  if (query.length < 2) return;   // 👈 prevent wipe
  const timeout = setTimeout(() => fetchIcons(query), 600);
  return () => clearTimeout(timeout);
}, [query]);



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

      await addNativeElement({
        type: "image",
        ref: uploadResult.ref,
        altText: undefined,
      });

    } catch (err) {
      console.error("Failed to insert icon:", err);
      alert("Failed to insert icon. Please try again.");
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

        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={handleClearSearch}
          inputRef={searchInputRef}
        />
          <Box padding="1u">
  {loading && <LoadingIndicator size="medium" />}

  {icons.length === 0 && !loading && query.length >= 2 && (
    <Text tone="secondary">
      {intl.formatMessage({
        defaultMessage: 'No results – try "home" or "user"',
      })}
    </Text>
  )}

  {paginatedIcons.length > 0 && (
    
    <>   <Text size="small" tone="secondary" >
    {query.length > 0
      ? intl.formatMessage(
          { defaultMessage: "Showing results for {query}" },
          { query }
        )
      : intl.formatMessage({ defaultMessage: "Popular icons" })}
  </Text>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "6px",
          width: "100%",
        }}
      >
        {paginatedIcons.map((icon) => {
          const handleDragStart = createDragHandler(icon);

          return (
            <div key={icon.id} style={{ position: "relative" }}>
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
                  background: "white",
                  borderRadius: "50%",
                  border: "none",
                  fontSize: "15px",
                }}
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
                    width: "100%",
                    padding: "4px 10px 4px 0px",
                  }}
                >
          
          <Button
            variant="secondary"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
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
            Next
          </Button>

        </div>
      )}
    </>
  )}
</Box>

      </Rows>

      {/* Fixed Favorites Section */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          left: "17px",
          right: "11px",
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
                    padding: "0px 0px 4px 4px",
                  }}
                >
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setFavoritesPage((p) => Math.max(1, p - 1))
                    }
                    disabled={favoritesPage === 1}
                  >
                    Prev
                  </Button>
                  
                  <Text size="small" tone="secondary">
                    {favoritesPage} / {totalFavoritesPages}
                  </Text>
                  
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setFavoritesPage((p) =>
                        Math.min(totalFavoritesPages, p + 1)
                      )
                    }
                    disabled={favoritesPage === totalFavoritesPages}
                  >
                    Next
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
