import { Easing, interpolate } from "remotion";
import { type RouteMapProps } from "../schemata";

// Keep timing shared by the line reveal, vehicle, and following camera.
export const getRouteAnimation = (
  frame: number,
  durationInFrames: number,
  cameraAltitudeMeters: RouteMapProps["cameraAltitudeMeters"],
  cameraLatitudeOffset: RouteMapProps["cameraLatitudeOffset"],
) => {
  const timelineProgress = interpolate(
    frame,
    [0, durationInFrames - 1],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const travelProgress = interpolate(timelineProgress, [0.12, 0.88], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.645, 0.045, 0.355, 1),
  });
  const altitudeMeters = interpolate(
    timelineProgress,
    [0, 0.24, 0.76, 1],
    [
      cameraAltitudeMeters.start,
      cameraAltitudeMeters.peak,
      cameraAltitudeMeters.peak,
      cameraAltitudeMeters.start,
    ],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.645, 0.045, 0.355, 1),
    },
  );
  const latitudeOffset = interpolate(
    timelineProgress,
    [0, 0.24, 0.76, 1],
    [
      cameraLatitudeOffset.start,
      cameraLatitudeOffset.peak,
      cameraLatitudeOffset.peak,
      cameraLatitudeOffset.start,
    ],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.645, 0.045, 0.355, 1),
    },
  );
  return { travelProgress, altitudeMeters, latitudeOffset };
};

export type RouteAnimation = ReturnType<typeof getRouteAnimation>;
