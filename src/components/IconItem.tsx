// src/components/IconItem.tsx
import React from "react";
import { Box } from "@canva/app-ui-kit";
import type { Icon } from "../types";
import { useDarkMode } from "../hooks/useDarkMode";
import { useIntl } from "react-intl";

const FAVORITE_ICON = "❤️";
const UNFAVORITE_ICON = "🤍";

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
  const isDarkMode = useDarkMode();
  const intl = useIntl();

  return (
    <div style={{ position: "relative" }}>
      <div
        draggable={isDraggable}
        onDragStart={(e) => {
          if (onDragStart) {
            onDragStart(e);
            // Hide thumbnail during drag
            e.currentTarget.style.opacity = "0";
          }
        }}
        onDragEnd={(e) => {
          // Restore visibility after drag
          e.currentTarget.style.opacity = "1";
        }}
        onClick={() => onInsert(icon.svgUrl)}
        style={{
          border: "none",
          background: "transparent",
          cursor: isDraggable ? "grab" : "pointer",
          width: "100%",
          padding: "4px",
          transition: "opacity 0.15s ease",
        }}
      >
        <div
          style={{
            backgroundColor: isDarkMode ? "#5c5c5cf5" : "#ffffff",
            borderRadius: "8px",
          }}
        >
          <Box
            padding="0.5u"
            border="low"
            borderRadius="large"
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

      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(icon);
          }}
          style={{
            position: "absolute",
            top: "-5px",
            right: "-5px",
            width: "22px",
            height: "22px",
            borderRadius: "100%",
            border: isDarkMode ? "1px solid #3a3a3a" : "1px solid #ddd",
            background: "rgba(255, 255, 255, 0.9)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            padding: "0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "transform 0.1s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          title={
            isIconFavorite
              ? intl.formatMessage({
                  defaultMessage: "Remove from favorites",
                  description:
                    "Tooltip for button to remove an icon from favorites",
                })
              : intl.formatMessage({
                  defaultMessage: "Add to favorites",
                  description: "Tooltip for button to add an icon to favorites",
                })
          }
          aria-label={
            isIconFavorite
              ? intl.formatMessage({
                  defaultMessage: "Remove from favorites",
                  description:
                    "Tooltip for button to remove an icon from favorites",
                })
              : intl.formatMessage({
                  defaultMessage: "Add to favorites",
                  description: "Tooltip for button to add an icon to favorites",
                })
          }
        >
          {isIconFavorite ? FAVORITE_ICON : UNFAVORITE_ICON}
        </button>
      )}
    </div>
  );
};
