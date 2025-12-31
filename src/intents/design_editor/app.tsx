// src/app.tsx
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Rows, Title, LoadingIndicator, Box, Button, Text } from '@canva/app-ui-kit';
import { addElementAtPoint, ui, addNativeElement } from '@canva/design';
import { Flyout } from '@canva/app-ui-kit';
import { upload } from '@canva/asset';
import { useFeatureSupport } from '@canva/app-hooks';

import { SearchBar } from '../../components/SearchBar';
import { IconGrid } from '../../components/IconGrid';
import { FavoritesSection } from '../../components/FavoritesSection';
import { useFavorites } from '../../hooks/useFavorites';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Icon } from '../../types';



export const App = () => {
  const [query, setQuery] = useState('');
  const [icons, setIcons] = useState<Icon[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const isSupported = useFeatureSupport();
  const { favorites, toggle: toggleFavorite, isFavorite } = useFavorites();
  const isDarkMode = useDarkMode();

  const ITEMS_PER_PAGE = 20;
  const FAVORITES_PER_PAGE = 8;
  const totalPages = Math.ceil(icons.length / ITEMS_PER_PAGE);
  const totalFavoritesPages = Math.ceil(favorites.length / FAVORITES_PER_PAGE);

  const paginatedIcons = icons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const paginatedFavorites = favorites.slice(
    (favoritesPage - 1) * FAVORITES_PER_PAGE,
    favoritesPage * FAVORITES_PER_PAGE
  );

  // Fetch icons when query changes
  useEffect(() => {
    if (query.length < 2) {
      setIcons([]);
      setIsOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=50`
        );
        const data = await res.json();
        const results = data.icons.map((icon: string) => ({
          id: icon,
          title: icon,
          thumbnailUrl: `https://api.iconify.design/${icon}.svg?height=48&width=48`,
          svgUrl: `https://api.iconify.design/${icon}.svg?height=80&width=80`,
        }));
        setIcons(results);
        setIsOpen(true);
      } catch (err) {
        console.error(err);
        setIcons([]);
      }
      setLoading(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, [query]);

  // Keep focus on search input when flyout is open
  useLayoutEffect(() => {
    if (!isOpen) return;

    const inputElement = searchInputRef.current;
    if (!inputElement) return;

    // Focus immediately before browser paint
    inputElement.focus();

    // Add document-level focus capture to prevent any focus theft
    const preventFocusTheft = (e: FocusEvent) => {
      if (e.target !== inputElement && e.target instanceof HTMLElement) {
        e.preventDefault();
        inputElement.focus();
      }
    };

    // Use capture phase (true) to intercept focus before it reaches target
    document.addEventListener('focus', preventFocusTheft, true);

    return () => {
      document.removeEventListener('focus', preventFocusTheft, true);
    };
  }, [isOpen]);

  const uploadIconSvg = async (svgUrl: string) => {
    const res = await fetch(svgUrl);
    const svg = await res.text();
    const bytes = new TextEncoder().encode(svg);
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
    const base64 = btoa(binString);
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    return upload({
      type: 'image',
      mimeType: 'image/svg+xml',
      url: dataUrl,
      thumbnailUrl: dataUrl,
      width: 80,
      height: 80,
      aiDisclosure: 'none',
    });
  };

  const createDragHandler = (icon: Icon) => async (e: React.DragEvent<HTMLElement>) => {
    try {
      const dragData = {
        type: 'image' as const,
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
      console.error('Drag failed:', err);
    }
  };

  const insertIcon = async (svgUrl: string) => {
    try {
      const uploadResult = await uploadIconSvg(svgUrl);

      await addNativeElement({
        type: 'image',
        ref: uploadResult.ref,
        altText: undefined,
      });

      setIsOpen(false);
    } catch (err) {
      console.error('Failed to insert icon:', err);
      alert('Failed to insert icon. Please try again.');
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setIcons([]);
    setIsOpen(false);
  };

  const handleCloseFlyout = () => {
    setIsOpen(false);
    setCurrentPage(1);
  };

  //const favoriteIcons = icons.filter(icon => isFavorite(icon.id));

  return (
    <>
      <Rows spacing="1u">
        <Title size="medium">IconFlow – 200k+ Icons</Title>

        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={handleClearSearch}
          inputRef={searchInputRef}
        />

        <Flyout
          open={isOpen}
          onRequestClose={handleCloseFlyout}
          trigger={<div style={{ height: '0' }} />}
          placement="bottom-start"
        >
          <div
            style={{
              padding: '2px',
              minWidth: '240px',
              maxWidth: '245px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center', // This perfectly centers everything
              gap: '12px',
            }}
            onMouseEnter={() => searchInputRef.current?.focus()}
            onMouseMove={() => {
              if (document.activeElement !== searchInputRef.current) {
                searchInputRef.current?.focus();
              }
            }}
          >
            {loading && <LoadingIndicator size="medium" />}

            {icons.length === 0 && !loading && query.length >= 2 && (
              <Text tone="secondary" >
                No results – try "home" or "user"
              </Text>
            )}

            {paginatedIcons.length > 0 && (
              <>
                {/* Icon Grid – full width, centered items */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '4px',
                    width: '100%',
                    padding: '0 4px',
                    boxSizing: 'border-box',
                  }}
                >
                  {paginatedIcons.map((icon) => {
                    const handleDragStart = createDragHandler(icon);

                    return (
                      <div key={icon.id} style={{ position: 'relative' }}>
                        <div
                          draggable={true}
                          onDragStart={(e) => {
                            handleDragStart(e);
                            // Hide the thumbnail during drag
                            e.currentTarget.style.opacity = '0';
                          }}
                          onDragEnd={(e) => {
                            // Restore visibility after drag
                            e.currentTarget.style.opacity = '1';
                          }}
                          onClick={() => {
                            insertIcon(icon.svgUrl);
                            searchInputRef.current?.focus();
                          }}
                          style={{
                            cursor: 'grab',
                            width: '100%',
                            padding: 0,
                            background: 'transparent',
                            border: 'none',
                            boxSizing: 'border-box',
                            transition: 'opacity 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: isDarkMode ? '#E8E8E8' : undefined,
                              borderRadius: '4px',
                            }}
                          >
                            <Box
                              padding="0.5u"
                              border='low'
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
                        </div>

                        {/* Favorite toggle button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(icon);
                            searchInputRef.current?.focus();
                          }}
                          style={{
                            position: 'absolute',
                            top: '0px',
                            right: '0px',
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
                          title={isFavorite(icon.id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {isFavorite(icon.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination – edges aligned with icons */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '8px 1px 4px 7px',
                    }}
                  >
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        searchInputRef.current?.focus();
                      }}
                      tabIndex={-1}
                      style={{ outline: 'none' }}
                    >
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setCurrentPage((prev) => Math.max(1, prev - 1));
                          searchInputRef.current?.focus();
                        }}
                        disabled={currentPage === 1}
                      >
                        Prev
                      </Button>
                    </div>
                    <Text size="small" tone="secondary">
                      {currentPage} / {totalPages}
                    </Text>
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        searchInputRef.current?.focus();
                      }}
                      tabIndex={-1}
                      style={{ outline: 'none' }}
                    >
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                          searchInputRef.current?.focus();
                        }}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Flyout>
      </Rows>

      {/* Fixed Favorites Section */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '17px',
          right: '11px',
          zIndex: 100,
        }}
      >
        <Box padding="2u" border="low" borderRadius="standard">
          {favorites.length > 0 ? (
            <>
              <Text size="small" tone="secondary">
                Favorites ({favorites.length})
              </Text>
              <div style={{ marginTop: '8px' }}>
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
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '12px 0px 4px 4px',
                  }}
                >
                  <Button
                    variant="secondary"
                    onClick={() => setFavoritesPage((prev) => Math.max(1, prev - 1))}
                    disabled={favoritesPage === 1}
                  >
                    Prev
                  </Button>
                  <Text size="small" tone="secondary">
                    {favoritesPage} / {totalFavoritesPages}
                  </Text>
                  <Button
                    variant="secondary"
                    onClick={() => setFavoritesPage((prev) => Math.min(totalFavoritesPages, prev + 1))}
                    disabled={favoritesPage === totalFavoritesPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Box padding="1u" display="flex" alignItems="center" justifyContent="center">
              <Text tone="secondary" alignment="center">
                Click the heart icon on any icon to add it to favorites
              </Text>
            </Box>
          )}
        </Box>
      </div>
    </>
  );
};

export default App;