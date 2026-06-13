import type { Node } from "reactflow";
import type { ArchLayer } from "@/lib/types";

/**
 * Presentation-only color helpers for data visualization.
 *
 * These colors are deliberately desaturated so they sit behind the neon
 * accents reserved for active/selected/risk states. They are safe to use
 * for non-interactive data (language bars, debt severity strips, graph
 * nodes, etc.).
 */

/**
 * Display order for the four architecture layers. Used by both the
 * Architecture Map and the Dependency Graph legends so the swatch
 * order stays consistent across panels.
 */
export const LAYER_ORDER: ReadonlyArray<ArchLayer> = [
  "apps",
  "services",
  "packages",
  "infrastructure",
];

/**
 * A small palette of language colors keyed by canonical language name.
 * Unknown languages fall back to the `Other` swatch.
 */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#4a90c2",
  JavaScript: "#c4a87a",
  Go: "#5dadd4",
  Python: "#4a7ec0",
  Rust: "#c4a080",
  Shell: "#7aa87a",
  SCSS: "#b87aa0",
  CSS: "#b87aa0",
  HTML: "#c47a7a",
  Other: "#5a5a68",
};

/** Returns the palette swatch for a language name, falling back to "Other". */
export function languageColor(name: string): string {
  return LANGUAGE_COLORS[name] ?? LANGUAGE_COLORS.Other ?? "#5a5a68";
}

/**
 * Architecture-layer swatches for the AC-5 Architecture Map.
 *
 * Each color is a desaturated, mid-tone hue so multiple layer-colored
 * nodes can sit on the same canvas without competing with the neon
 * accent palette (cyan/magenta/violet/rose) reserved for active state,
 * focus rings, and risk indicators. The `infrastructure` swatch is the
 * most saturated of the four — it's the rarest node class (always 1 per
 * graph) and benefits from a slightly warmer tone to anchor the
 * composition.
 */
export const LAYER_COLORS: Record<ArchLayer, string> = {
  apps: "#4a90c2", // desaturated cyan-blue
  services: "#8a7ec0", // desaturated violet (dimmer than accent.violet)
  packages: "#7aa87a", // desaturated green
  infrastructure: "#c4a080", // desaturated rust/amber
};

/** Returns the swatch for an architecture-layer kind, with a safe fallback. */
export function layerColor(layer: ArchLayer): string {
  return LAYER_COLORS[layer] ?? "#5a5a68";
}

/**
 * Stable, deterministic swatch for the React Flow MiniMap.
 *
 * Both graph panels use this so the MiniMap always reflects the
 * main-canvas layer color (a desaturated palette swatch per layer),
 * with a neutral gray fallback for nodes that don't carry a `layer`
 * on their data payload.
 */
export function miniMapNodeColor(node: Node): string {
  const layer = (node.data as { layer?: ArchLayer } | undefined)?.layer;
  return layer ? layerColor(layer) : "#5a5a68";
}
