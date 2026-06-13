"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Combobox / listbox used by the AC-7 Impact Analysis panel to pick
 * the "currently selected module" without touching the Dependency
 * Graph. The control writes through `onChange(id)` which the parent
 * translates into a URL push.
 *
 * Design notes:
 *
 * - Built on a native `<button>` + `<ul role="listbox">` so screen
 *   readers announce the role correctly without us re-implementing
 *   keyboard semantics. We implement the minimum ARIA pattern:
 *   `aria-expanded`, `aria-activedescendant`, `role="combobox"`,
 *   `aria-controls`, and `aria-haspopup="listbox"`.
 *
 * - Keyboard: `Enter` / `Space` toggles the listbox, `Escape` closes
 *   it, `ArrowDown` / `ArrowUp` move the active option, `Home` /
 *   `End` jump to the ends, `Enter` on a focused option commits it,
 *   and any character key starts a typeahead search against the
 *   option labels.
 *
 * - Visual treatment: a desaturated `surface-raised` button that
 *   brightens to cyan when a value is selected, matching the
 *   project-wide neon-accent discipline (active/selected only).
 *   The listbox sits below the button with a `surface-base`
 *   background and the same `border-subtle` border as the rest of
 *   the chrome.
 *
 * - The control is intentionally narrow — about 280 px — so it
 *   drops cleanly into the Impact Analysis panel header without
 *   forcing a wrap on the typical 1280px viewport.
 */

export interface ModuleSelectOption {
  id: string;
  label: string;
  /** Optional secondary text (e.g. layer or file count) shown muted. */
  hint?: string;
}

interface ModuleSelectProps {
  /** Currently selected id, or `null` when nothing is chosen. */
  value: string | null;
  /** Stable, display-ordered list of options. */
  options: ReadonlyArray<ModuleSelectOption>;
  /** Called with the chosen id, or `null` when the user clears. */
  onChange: (id: string | null) => void;
  /** Visible label, rendered as a HUD-style caption next to the button. */
  label?: string;
  /** Disabled state — when true, the button is non-interactive. */
  disabled?: boolean;
  /** Placeholder shown when `value` is `null`. */
  placeholder?: string;
  className?: string;
}

export function ModuleSelect({
  value,
  options,
  onChange,
  label = "Module",
  disabled = false,
  placeholder = "Select a module…",
  className,
}: ModuleSelectProps) {
  const buttonId = useId();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    const idx = options.findIndex((o) => o.id === value);
    return idx >= 0 ? idx : 0;
  });
  // Buffer for character-key typeahead.
  const [typeBuffer, setTypeBuffer] = useState("");
  const typeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected option, for the button's display text.
  const selected = useMemo<ModuleSelectOption | null>(
    () => options.find((o) => o.id === value) ?? null,
    [options, value],
  );

  // Click-outside closes the listbox.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const closeList = useCallback(() => {
    setOpen(false);
    setTypeBuffer("");
  }, []);

  const commit = useCallback(
    (id: string) => {
      onChange(id);
      closeList();
      // Return focus to the trigger so keyboard users keep their place.
      buttonRef.current?.focus();
    },
    [onChange, closeList],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          if (!open) {
            setOpen(true);
          } else {
            setActiveIndex((i) => (i + 1) % options.length);
          }
          return;
        }
        case "ArrowUp": {
          event.preventDefault();
          if (!open) {
            setOpen(true);
          } else {
            setActiveIndex((i) => (i - 1 + options.length) % options.length);
          }
          return;
        }
        case "Home": {
          if (open) {
            event.preventDefault();
            setActiveIndex(0);
          }
          return;
        }
        case "End": {
          if (open) {
            event.preventDefault();
            setActiveIndex(options.length - 1);
          }
          return;
        }
        case "Enter":
        case " ": {
          event.preventDefault();
          if (!open) {
            setOpen(true);
          } else {
            commit(options[activeIndex]?.id ?? value ?? options[0]?.id ?? "");
          }
          return;
        }
        case "Escape": {
          if (open) {
            event.preventDefault();
            closeList();
          }
          return;
        }
        default: {
          // Typeahead against option labels.
          if (event.key.length === 1 && /\S/.test(event.key)) {
            const next = (typeBuffer + event.key).toLowerCase();
            setTypeBuffer(next);
            if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
            typeTimerRef.current = setTimeout(() => setTypeBuffer(""), 500);
            const matchIndex = options.findIndex((o) =>
              o.label.toLowerCase().startsWith(next),
            );
            if (matchIndex >= 0) {
              setActiveIndex(matchIndex);
              setOpen(true);
            }
          }
        }
      }
    },
    [activeIndex, closeList, commit, disabled, open, options, typeBuffer, value],
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <label
        htmlFor={buttonId}
        className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-dim"
      >
        {label}
      </label>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={
          open && options[activeIndex]
            ? `${listId}-opt-${activeIndex}`
            : undefined
        }
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(
          "mt-1 flex w-full min-w-[260px] items-center justify-between gap-2 rounded border bg-surface-raised px-3 py-1.5",
          "font-mono text-xs text-left",
          "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan",
          disabled
            ? "cursor-not-allowed border-border-subtle text-text-dim"
            : selected
              ? "border-accent-cyan/40 text-text-primary shadow-glow-cyan"
              : "border-border-subtle text-text-muted hover:border-border-strong",
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? (
            <span className="flex flex-col">
              <span className="truncate text-text-primary">{selected.label}</span>
              {selected.hint ? (
                <span className="truncate text-[10px] uppercase tracking-[0.18em] text-text-dim">
                  {selected.hint}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="text-text-dim">{placeholder}</span>
          )}
        </span>
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn(
            "h-3 w-3 shrink-0 transition-transform",
            open ? "rotate-180 text-accent-cyan" : "text-text-muted",
          )}
        >
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded border border-border-subtle bg-surface-base shadow-lg"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 font-mono text-[11px] text-text-dim">
              no modules in this repo
            </li>
          ) : (
            options.map((option, index) => {
              const isActive = index === activeIndex;
              const isSelected = option.id === value;
              return (
                <li
                  key={option.id}
                  id={`${listId}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    // `mousedown` rather than `click` so the option picks
                    // before the document-level `mousedown` listener
                    // (which would otherwise close the listbox first).
                    event.preventDefault();
                    commit(option.id);
                  }}
                  className={cn(
                    "flex cursor-pointer items-baseline gap-2 px-3 py-1.5 font-mono text-[11px]",
                    isActive ? "bg-accent-cyan/10" : "bg-transparent",
                    isSelected ? "text-accent-cyan" : "text-text-primary",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.hint ? (
                    <span className="shrink-0 text-[9px] uppercase tracking-[0.18em] text-text-dim">
                      {option.hint}
                    </span>
                  ) : null}
                  {isSelected ? (
                    <svg
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0"
                    >
                      <path d="M2 6.5l2.5 2.5L10 3.5" />
                    </svg>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
