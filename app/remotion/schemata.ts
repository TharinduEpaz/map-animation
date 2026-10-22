import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { MAP_STYLE_IDS } from "./map-styles";
import { COUNTRY_IDS } from "../lib/countries";

const lngLat = z.tuple([
  z.number().min(-180).max(180).step(0.0001),
  z.number().min(-90).max(90).step(0.0001),
]);

export const routeMapSchema = z.object({
  mapStyle: z.enum(MAP_STYLE_IDS).default("classic"),
  from: lngLat,
  to: lngLat,
  fromLabel: z.string(),
  toLabel: z.string(),
  lineColor: zColor(),
  lineShape: z.enum(["curved", "straight"]),
  lineStyle: z.enum(["solid", "dashed", "dotted"]),
  vehicle: z.enum(["none", "plane", "car"]),
  curveHeight: z.number().optional().default(0.2),
  cameraAltitudeMeters: z.object({
    start: z.number().min(1000).step(1000),
    peak: z.number().min(1000).step(1000),
  }),
  cameraLatitudeOffset: z.object({
    start: z.number().step(0.1),
    peak: z.number().step(0.1),
  }),
});

export type RouteMapProps = z.infer<typeof routeMapSchema>;

export const routeMapCompositions = [
  {
    id: "CountryToCountry",
    label: "Country to Country",
    searchKind: "country",
    defaultProps: {
      mapStyle: "classic",
      from: [-74.006, 40.7128],
      to: [-0.1276, 51.5072],
      fromLabel: "United States",
      toLabel: "United Kingdom",
      lineColor: "#f03b20",
      lineShape: "curved",
      lineStyle: "solid",
      vehicle: "plane",
      curveHeight: 0.2,
      cameraAltitudeMeters: { start: 3000000, peak: 9000000 },
      cameraLatitudeOffset: { start: 2, peak: 10 },
    },
  },
  {
    id: "CityToCity",
    label: "Between Cities",
    searchKind: "city",
    defaultProps: {
      mapStyle: "classic",
      from: [79.8627, 6.9271],
      to: [80.8917, 6.4372],
      fromLabel: "Colombo",
      toLabel: "Udawalawe",
      lineColor: "#ff0000",
      lineShape: "curved",
      lineStyle: "dotted",
      vehicle: "car",
      cameraAltitudeMeters: { start: 60000, peak: 220000 },
      cameraLatitudeOffset: { start: 0.3, peak: 0.7 },
      curveHeight: -0.1,
    },
  },
] as const satisfies readonly {
  id: string;
  label: string;
  searchKind: "country" | "city";
  defaultProps: RouteMapProps;
}[];

export type RouteMapCompositionId = (typeof routeMapCompositions)[number]["id"];

export const countryHighlightSchema = z.object({
  countryId: z
    .string()
    .refine((id) => COUNTRY_IDS.has(id), "Choose a supported country"),
  mapStyle: z.enum(MAP_STYLE_IDS).default("classic"),
  displayName: z.string().trim().min(1).max(80),
  subtitle: z.string().max(120).default(""),
  highlightColor: zColor(),
  framing: z.enum(["all", "mainland"]).default("all"),
});

export type CountryHighlightProps = z.infer<typeof countryHighlightSchema>;

export const countryHighlightDefaultProps: CountryHighlightProps = {
  countryId: "LKA",
  mapStyle: "classic",
  displayName: "Sri Lanka",
  subtitle: "",
  highlightColor: "#e8593c",
  framing: "all",
};

export const mapAnimationSchema = z.union([
  countryHighlightSchema,
  routeMapSchema,
]);
export type MapAnimationProps = z.infer<typeof mapAnimationSchema>;
export type MapCompositionId = RouteMapCompositionId | "CountryHighlight";

// Scale factors relative to the 1920x1080 composition.
export const RESOLUTION_SCALES = {
  "720p": 2 / 3,
  "1080p": 1,
  "2k": 4 / 3,
  "4k": 2,
} as const;

const Resolution = z.enum(["720p", "1080p", "2k", "4k"]);
export type Resolution = z.infer<typeof Resolution>;

const Fps = z.union([z.literal(24), z.literal(30), z.literal(60)]);
export type Fps = z.infer<typeof Fps>;

export const FPS_OPTIONS = [
  { value: 24, label: "24 fps" },
  { value: 30, label: "30 fps" },
  { value: 60, label: "60 fps" },
] as const satisfies readonly { value: Fps; label: string }[];

// Composition-level props: `fps` drives calculateMetadata, RouteMap ignores it.
export const routeMapRenderSchema = routeMapSchema.extend({
  fps: Fps.optional(),
});
export type RouteMapRenderProps = z.infer<typeof routeMapRenderSchema>;
export const countryHighlightRenderSchema = countryHighlightSchema.extend({
  fps: Fps.optional(),
});
export type MapAnimationRenderProps = MapAnimationProps & { fps?: Fps };

export const RenderRequest = z
  .object({
    id: z.enum(["CountryToCountry", "CityToCity", "CountryHighlight"]),
    inputProps: mapAnimationSchema,
    resolution: Resolution,
    fps: Fps,
  })
  .refine(
    ({ id, inputProps }) => {
      const isHighlight = "countryId" in inputProps;
      return (id === "CountryHighlight") === isHighlight;
    },
    {
      message: "Animation settings do not match the selected composition",
      path: ["inputProps"],
    },
  );

export const ProgressRequest = z.object({
  bucketName: z.string(),
  id: z.string(),
});

export type ProgressResponse =
  | {
      type: "error";
      message: string;
    }
  | {
      type: "progress";
      progress: number;
    }
  | {
      type: "done";
      url: string;
      size: number;
    };
