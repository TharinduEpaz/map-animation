export const MAP_STYLE_IDS = [
  "classic",
  "vintage",
  "minimal",
  "dark",
  "bright",
] as const;

export type MapStyleId = (typeof MAP_STYLE_IDS)[number];

type MapTheme = {
  label: string;
  description: string;
  baseStyle: "liberty" | "positron" | "dark" | "bright";
  land: string;
  water: string;
  road: string;
  ink: string;
  halo: string;
  routeColor?: string;
};

export const MAP_THEMES: Record<MapStyleId, MapTheme> = {
  classic: {
    label: "Classic",
    description: "The original map",
    baseStyle: "liberty",
    land: "#f8f4f0",
    water: "#9ebdff",
    road: "#ffffff",
    ink: "#111111",
    halo: "#ffffff",
  },
  vintage: {
    label: "Vintage",
    description: "Warm paper & ink",
    baseStyle: "positron",
    land: "#eee0bd",
    water: "#b9c9bc",
    road: "#faf0d6",
    ink: "#59432e",
    halo: "#f5e9cd",
    routeColor: "#a3412b",
  },
  minimal: {
    label: "Minimal",
    description: "Quiet & uncluttered",
    baseStyle: "positron",
    land: "#f2f3f0",
    water: "#c2c8ca",
    road: "#ffffff",
    ink: "#28343b",
    halo: "#ffffff",
    routeColor: "#c93635",
  },
  dark: {
    label: "Dark",
    description: "A map after hours",
    baseStyle: "dark",
    land: "#0c0c0c",
    water: "#1b1b1d",
    road: "#44444b",
    ink: "#f4f1e8",
    halo: "#17171b",
    routeColor: "#ffbd69",
  },
  bright: {
    label: "Bright",
    description: "Colorful & detailed",
    baseStyle: "bright",
    land: "#d8e8c8",
    water: "#a0c8f0",
    road: "#ffffff",
    ink: "#172c36",
    halo: "#ffffff",
    routeColor: "#c42c42",
  },
};
