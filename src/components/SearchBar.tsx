// src/components/SearchBar.tsx
import React, { useRef, useEffect } from 'react';
import { SearchInputMenu, Box } from '@canva/app-ui-kit';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

export const SearchBar: React.FC<Props> = ({
  value,
  onChange,
  onClear,
  inputRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const input = containerRef.current?.querySelector('input');
    if (input instanceof HTMLInputElement) {
      // eslint-disable-next-line no-param-reassign
      inputRef.current = input;
    }
  }, [inputRef]);

  return (
    <Box paddingEnd="1u">
      <div ref={containerRef}>
        <SearchInputMenu
          placeholder="Search icons (e.g., heart, arrow, star)"
          value={value}
          onChange={onChange}
          onClear={onClear}
        />
      </div>
    </Box>
  );
};