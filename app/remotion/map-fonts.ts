import type { StyleSpecification } from "maplibre-gl";
import latin400 from "@fontsource/inter/files/inter-latin-400-normal.woff2";
import latinExt400 from "@fontsource/inter/files/inter-latin-ext-400-normal.woff2";
import latin400Italic from "@fontsource/inter/files/inter-latin-400-italic.woff2";
import latinExt400Italic from "@fontsource/inter/files/inter-latin-ext-400-italic.woff2";
import latin600 from "@fontsource/inter/files/inter-latin-600-normal.woff2";
import latinExt600 from "@fontsource/inter/files/inter-latin-ext-600-normal.woff2";
import latin700 from "@fontsource/inter/files/inter-latin-700-normal.woff2";
import latinExt700 from "@fontsource/inter/files/inter-latin-ext-700-normal.woff2";

// Copied from @fontsource/inter's CSS so non-Latin scripts (e.g. Sinhala, Tamil)
// still fall through to the style's glyph server.
const LATIN = [
  "U+0000-00FF",
  "U+0131",
  "U+0152-0153",
  "U+02BB-02BC",
  "U+02C6",
  "U+02DA",
  "U+02DC",
  "U+0304",
  "U+0308",
  "U+0329",
  "U+2000-206F",
  "U+20AC",
  "U+2122",
  "U+2191",
  "U+2193",
  "U+2212",
  "U+2215",
  "U+FEFF",
  "U+FFFD",
];
const LATIN_EXT = [
  "U+0100-02BA",
  "U+02BD-02C5",
  "U+02C7-02CC",
  "U+02CE-02D7",
  "U+02DD-02FF",
  "U+1D00-1DBF",
  "U+1E00-1E9F",
  "U+1EF2-1EFF",
  "U+2020",
  "U+20A0-20AB",
  "U+20AD-20C0",
  "U+2113",
  "U+2C60-2C7F",
  "U+A720-A7FF",
];

const face = (latin: string, latinExt: string) => [
  { url: latin, "unicode-range": LATIN },
  { url: latinExt, "unicode-range": LATIN_EXT },
];

export const INTER_LABEL_FONT = "Inter SemiBold";

// Maps every font the base map style asks for (OpenFreeMap Liberty uses Noto Sans) onto Inter.
export const interFontFaces: NonNullable<StyleSpecification["font-faces"]> = {
  "Noto Sans Regular": face(latin400, latinExt400),
  "Noto Sans Italic": face(latin400Italic, latinExt400Italic),
  "Noto Sans Bold": face(latin700, latinExt700),
  [INTER_LABEL_FONT]: face(latin600, latinExt600),
};
