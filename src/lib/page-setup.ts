export type PageSizeKey = "A4" | "A5" | "Letter" | "Legal";
export type Orientation = "portrait" | "landscape";
export type MarginKey = "narrow" | "normal" | "wide";

export type PageSetup = {
  size: PageSizeKey;
  orientation: Orientation;
  margin: MarginKey;
};

export const DEFAULT_PAGE_SETUP: PageSetup = {
  size: "A4",
  orientation: "portrait",
  margin: "normal",
};

const DPI = 96;

// Width / height in inches (portrait).
export const PAGE_SIZES: Record<PageSizeKey, { label: string; w: number; h: number }> = {
  A4: { label: "A4 · 210 × 297 mm", w: 8.27, h: 11.69 },
  A5: { label: "A5 · 148 × 210 mm", w: 5.83, h: 8.27 },
  Letter: { label: 'Letter · 8.5 × 11"', w: 8.5, h: 11 },
  Legal: { label: 'Legal · 8.5 × 14"', w: 8.5, h: 14 },
};

export const MARGINS: Record<MarginKey, { label: string; inches: number }> = {
  narrow: { label: 'Narrow · 0.5"', inches: 0.5 },
  normal: { label: 'Normal · 1"', inches: 1 },
  wide: { label: 'Wide · 1.5"', inches: 1.5 },
};

export function pageMetrics(setup: PageSetup) {
  const size = PAGE_SIZES[setup.size] ?? PAGE_SIZES.A4;
  const portrait = setup.orientation !== "landscape";
  const width = (portrait ? size.w : size.h) * DPI;
  const height = (portrait ? size.h : size.w) * DPI;
  const margin = (MARGINS[setup.margin] ?? MARGINS.normal).inches * DPI;
  return {
    width: Math.round(width),
    height: Math.round(height),
    margin: Math.round(margin),
    contentHeight: Math.round(height - margin * 2),
  };
}

export function normalizePageSetup(value: unknown): PageSetup {
  const raw = (value ?? {}) as Partial<PageSetup>;
  return {
    size: raw.size && raw.size in PAGE_SIZES ? raw.size : DEFAULT_PAGE_SETUP.size,
    orientation: raw.orientation === "landscape" ? "landscape" : "portrait",
    margin: raw.margin && raw.margin in MARGINS ? raw.margin : DEFAULT_PAGE_SETUP.margin,
  };
}
