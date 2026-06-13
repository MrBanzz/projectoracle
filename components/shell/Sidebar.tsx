import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  /** Display label, hidden at <lg (icon-rail mode). */
  label: string;
  /** Inline SVG path data for the icon (24x24 viewBox). */
  icon: ReactNode;
  /** Whether this item is the current page. */
  active?: boolean;
  /** Disable the item (renders as a muted, non-interactive row). */
  disabled?: boolean;
  /** Optional click handler. */
  onSelect?: () => void;
}

interface SidebarProps {
  /** Override the default nav items. */
  items?: NavItem[];
  className?: string;
}

const DEFAULT_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    active: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Roadmap",
    disabled: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 6h16M4 12h10M4 18h16" />
        <circle cx="18" cy="12" r="2" />
      </svg>
    ),
  },
];

/**
 * Persistent left navigation rail.
 *
 * Renders an expanded layout (240 px) at the `lg` breakpoint (≥1024 px) and
 * collapses to a 64 px icon rail below it. Active item uses the cyan accent
 * with a subtle glow; disabled items are muted and non-interactive.
 */
export function Sidebar({ items = DEFAULT_ITEMS, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border-subtle bg-surface-panel",
        "lg:w-60 w-16",
        className,
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-3 border-b border-border-subtle px-4">
        <span
          aria-hidden="true"
          className="grid h-7 w-7 shrink-0 place-items-center rounded border border-accent-cyan/40 bg-surface-raised text-accent-cyan shadow-glow-cyan"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M4 7l8-4 8 4-8 4-8-4z" />
            <path d="M4 12l8 4 8-4" />
            <path d="M4 17l8 4 8-4" />
          </svg>
        </span>
        <div className="hidden min-w-0 flex-col leading-tight lg:flex">
          <span className="truncate font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
            Repo
          </span>
          <span className="truncate font-mono text-sm font-semibold text-text-primary">
            Mind
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Primary" className="flex-1 px-2 py-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.label}>
              <NavRow item={item} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer build tag */}
      <div className="border-t border-border-subtle px-4 py-3">
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim lg:block">
          build · 0.1.0
        </p>
        <p
          aria-hidden="true"
          className="hidden text-center font-mono text-[10px] text-text-dim lg:hidden"
        >
          0.1
        </p>
      </div>
    </aside>
  );
}

function NavRow({ item }: { item: NavItem }) {
  const interactive = !item.disabled;

  return (
    <button
      type="button"
      onClick={interactive ? item.onSelect : undefined}
      disabled={!interactive}
      aria-current={item.active ? "page" : undefined}
      aria-disabled={item.disabled || undefined}
      title={item.label}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-left",
        "font-mono text-xs uppercase tracking-[0.18em] transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-0",
        item.active
          ? "bg-accent-cyan/10 text-accent-cyan"
          : "text-text-muted hover:bg-surface-raised hover:text-text-primary",
        item.disabled && "cursor-not-allowed text-text-dim hover:bg-transparent hover:text-text-dim",
      )}
    >
      {/* Active left rule */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1 left-0 w-0.5 rounded-r bg-accent-cyan shadow-glow-cyan",
          item.active ? "opacity-100" : "opacity-0",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center",
          item.active ? "text-accent-cyan" : "text-text-muted",
        )}
      >
        {item.icon}
      </span>
      <span className="hidden truncate lg:inline">{item.label}</span>
    </button>
  );
}
