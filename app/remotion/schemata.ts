import { zColor } from "@remotion/zod-types";
import { z } from "zod";

export const CompositionProps = z.object({
  title: z.string(),
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  title: "React Router and Remotion",
};

const lngLat = z.tuple([
  z.number().min(-180).max(180).step(0.0001),
  z.number().min(-90).max(90).step(0.0001),
]);

export const routeMapSchema = z.object({
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
    defaultProps: {
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
    defaultProps: {
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
  defaultProps: RouteMapProps;
}[];

export type RouteMapCompositionId = (typeof routeMapCompositions)[number]["id"];

// Scale factors relative to the 1920x1080 composition.
export const RESOLUTION_SCALES = {
  "720p": 2 / 3,
  "1080p": 1,
  "2k": 4 / 3,
  "4k": 2,
} as const;

export const Resolution = z.enum(["720p", "1080p", "2k", "4k"]);
export type Resolution = z.infer<typeof Resolution>;

export const RenderRequest = z.object({
  id: z.string(),
  inputProps: routeMapSchema,
  resolution: Resolution,
});

export const ProgressRequest = z.object({
  bucketName: z.string(),
  id: z.string(),
});

export const LocalProgressRequest = z.object({
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
