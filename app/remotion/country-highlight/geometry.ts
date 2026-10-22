import { area, bbox, polygon } from "@turf/turf";
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";

export type CountryFeature = Feature<Polygon | MultiPolygon>;

// Select the shortest longitude interval so Fiji/Russia fit across the date line.
// Shift whole rings together, preserving holes and the original polygon topology.
export const prepareCountry = (
  feature: CountryFeature,
  framing: "all" | "mainland",
) => {
  const polygons =
    feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
  const cameraPolygons =
    framing === "mainland"
      ? [
          polygons.reduce((largest, next) =>
            area(polygon(next)) > area(polygon(largest)) ? next : largest,
          ),
        ]
      : polygons;
  const longitudes = cameraPolygons
    .flatMap((rings) => rings[0].map(([lng]) => ((lng % 360) + 360) % 360))
    .sort((a, b) => a - b);
  let largestGap = -1;
  let west = longitudes[0];
  for (let i = 0; i < longitudes.length; i++) {
    const next =
      longitudes[(i + 1) % longitudes.length] +
      (i === longitudes.length - 1 ? 360 : 0);
    if (next - longitudes[i] > largestGap) {
      largestGap = next - longitudes[i];
      west = next % 360;
    }
  }
  const center = west + (360 - largestGap) / 2;
  const worldOffset = 360 * Math.floor((center + 180) / 360);
  const unwrap = (rings: Position[][]) => {
    // Use the ring's average longitude to choose the same world copy for every
    // coordinate, avoiding a 360-degree edge through a date-line island.
    const ringCenter =
      rings[0].reduce((sum, p) => sum + p[0], 0) / rings[0].length;
    const offset = 360 * Math.round((center - ringCenter) / 360) - worldOffset;
    return rings.map((ring) => ring.map(([lng, lat]) => [lng + offset, lat]));
  };
  const geometry: MultiPolygon = {
    type: "MultiPolygon",
    coordinates: polygons.map(unwrap),
  };
  const cameraGeometry: MultiPolygon = {
    type: "MultiPolygon",
    coordinates: cameraPolygons.map(unwrap),
  };
  const bounds = bbox(cameraGeometry);
  // Web Mercator cannot display either pole. Antarctica still gets a useful view.
  bounds[1] = Math.max(-80, Math.min(80, bounds[1]));
  bounds[3] = Math.max(bounds[1] + 0.01, Math.min(80, bounds[3]));
  return {
    feature: { ...feature, geometry } as Feature<MultiPolygon>,
    bounds: [
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]],
    ] as [[number, number], [number, number]],
  };
};
