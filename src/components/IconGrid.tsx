// src/components/IconGrid.tsx
import React from "react";
import type { Icon } from "../types";
import { IconItem } from "./IconItem";

type Props = {
  icons: Icon[];
  onInsert: (svgUrl: string) => void;
  onToggleFavorite?: (icon: Icon) => void;
  isFavorite?: (iconId: string) => boolean;
  createDragHandler?: (icon: Icon) => (e: React.DragEvent<HTMLElement>) => void;
};

export const IconGrid: React.FC<Props> = ({
  icons,
  onInsert,
  onToggleFavorite,
  isFavorite,
  createDragHandler,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "8px",
      }}
    >
      {icons.map((icon) => (
        <IconItem
          key={icon.id}
          icon={icon}
          onInsert={onInsert}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite}
          onDragStart={createDragHandler?.(icon)}
        />
      ))}
    </div>
  );
};
