import React, { useRef, useEffect } from "react";
import { SearchInputMenu, Box } from "@canva/app-ui-kit";
import { useIntl } from "react-intl";

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
  const intl = useIntl();
  useEffect(() => {
    const input = containerRef.current?.querySelector("input");
    if (input instanceof HTMLInputElement) {
      inputRef.current = input;
    }
  }, [inputRef]);

  return (
    <Box paddingEnd="1u">
      <div ref={containerRef}>
        <SearchInputMenu
          placeholder={intl.formatMessage({
            defaultMessage: "Search icons (e.g., heart, arrow, star)",
            description: "Placeholder text in the search input field",
          })}
          value={value}
          onChange={onChange}
          onClear={onClear}
        />
      </div>
    </Box>
  );
};
