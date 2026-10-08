import React, { useEffect, useId, useState } from "react";
import { cn } from "~/lib/utils";
import { searchPlaces, type Place, type PlaceKind } from "~/lib/geocode";
import { Spinner } from "./Spinner";

type Status = "idle" | "loading" | "done" | "error";

export const LocationSearch: React.FC<{
  label: string;
  value: string;
  kind: PlaceKind;
  onSelect: (place: Place) => void;
  disabled?: boolean;
}> = ({ label, value, kind, onSelect, disabled }) => {
  const id = useId();
  const inputId = `${id}-input`;
  const listId = `${id}-list`;
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();

  useEffect(() => {
    if (!editing || trimmed.length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");
    const timer = setTimeout(() => {
      searchPlaces(trimmed, kind, controller.signal)
        .then((places) => {
          setResults(places);
          setActiveIndex(places.length > 0 ? 0 : -1);
          setStatus("done");
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setStatus("error");
          }
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, kind, editing]);

  const close = () => {
    setEditing(false);
    setActiveIndex(-1);
  };

  const select = (place: Place) => {
    onSelect(place);
    close();
  };

  const showList =
    editing && (results.length > 0 || status === "done" || status === "error");

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Escape") {
      close();
      return;
    }

    if (!showList || results.length === 0) {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      select(results[activeIndex]);
    }
  };

  return (
    <div className="relative">
      <label
        htmlFor={inputId}
        className="mb-1 block text-xs font-medium text-subtitle"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={
          showList && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={kind === "country" ? "Search a country" : "Search a city"}
        className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half pr-9 text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
        value={editing ? query : value}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          setQuery(e.currentTarget.value);
          setEditing(true);
        }}
        onKeyDown={onKeyDown}
        onBlur={close}
      />
      {editing && status === "loading" ? (
        <div className="pointer-events-none absolute right-3 bottom-[11px]">
          <Spinner size={16} />
        </div>
      ) : null}
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-geist border border-unfocused-border-color bg-background py-1 shadow-lg"
        >
          {status === "error" ? (
            <li className="px-3 py-2 text-sm text-geist-error">
              Search failed. Check your connection and try again.
            </li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-subtitle">No places found</li>
          ) : (
            results.map((place, index) => (
              <li
                key={place.id}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                // mousedown + preventDefault keeps focus, so blur doesn't close the list first
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(place);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "cursor-pointer px-3 py-2",
                  index === activeIndex && "bg-unfocused-border-color",
                )}
              >
                <div className="text-sm text-foreground">{place.name}</div>
                {place.detail ? (
                  <div className="text-xs text-subtitle">{place.detail}</div>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
};
