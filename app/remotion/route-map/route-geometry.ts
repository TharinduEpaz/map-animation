import * as turf from "@turf/turf";
import { type RouteMapProps } from "../schemata";

const unwrapCoordinate = (
  coordinate: [number, number],
  referenceLongitude: number,
): [number, number] => [
  coordinate[0] + 360 * Math.round((referenceLongitude - coordinate[0]) / 360),
  coordinate[1],
];

const createCurvedRoute = (
  from: [number, number],
  to: [number, number],
  curveHeight: number,
) => {
  const line = turf.lineString([from, to]);
  const length = turf.length(line);
  const midpoint = turf.midpoint(from, to);
  const bearing = turf.bearing(from, to);

  // Offset distance controls the "height" of the arc
  const offsetDistance = length * curveHeight;
  // Offset it perpendicularly to create a control point
  const controlPoint = turf.destination(midpoint, offsetDistance, bearing - 90);
  // The spline interpolates longitude numerically. Keep all three points in the
  // same world copy so a Pacific crossing cannot turn into a near-global detour.
  const unwrappedControlPoint = unwrapCoordinate(
    controlPoint.geometry.coordinates as [number, number],
    (from[0] + to[0]) / 2,
  );

  // Generate a smooth curve through the points
  return turf.bezierSpline(turf.lineString([from, unwrappedControlPoint, to]));
};

const createRouteLine = (
  from: [number, number],
  to: [number, number],
  shape: RouteMapProps["lineShape"],
  curveHeight: number = 0.2,
) => {
  const unwrappedTo = unwrapCoordinate(to, from[0]);
  return shape === "straight"
    ? turf.lineString([from, unwrappedTo])
    : createCurvedRoute(from, unwrappedTo, curveHeight);
};

const clampProgress = (progress: number) => Math.min(1, Math.max(0, progress));

const distanceAlong = (totalDistance: number, progress: number) => {
  return Math.max(0.001, totalDistance * clampProgress(progress));
};

export const createRoute = (
  from: RouteMapProps["from"],
  to: RouteMapProps["to"],
  shape: RouteMapProps["lineShape"],
  curveHeight: number,
) => {
  const line = createRouteLine(from, to, shape, curveHeight);
  return { line, distance: turf.length(line) };
};

export type RouteGeometry = ReturnType<typeof createRoute>;

export const createCityMarkers = (
  from: RouteMapProps["from"],
  to: RouteMapProps["to"],
  fromLabel: string,
  toLabel: string,
) =>
  turf.featureCollection([
    turf.point(from, { name: fromLabel }),
    turf.point(to, { name: toLabel }),
  ]);

export const getRoutePosition = (route: RouteGeometry, progress: number) =>
  turf.along(route.line, distanceAlong(route.distance, progress)).geometry
    .coordinates;

export const getPartialRoute = (route: RouteGeometry, progress: number) =>
  turf.lineSliceAlong(route.line, 0, distanceAlong(route.distance, progress));

export const getVehicleFeature = (route: RouteGeometry, progress: number) => {
  const behind = getRoutePosition(route, Math.max(0, progress - 0.001));
  const ahead = getRoutePosition(route, Math.min(1, progress + 0.001));
  const current = getRoutePosition(route, progress);
  return turf.point(current, { bearing: turf.bearing(behind, ahead) });
};
