import { Composition } from "remotion";
import {
  DURATION_IN_FRAMES,
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_ID,
  COMPOSITION_WIDTH,
} from "./constants.mjs";
import { Main } from "./components/Main";
import { RouteMap, routeMapSchema } from "./components/RouteMap";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id={COMPOSITION_ID}
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={COMPOSITION_FPS}
        width={COMPOSITION_WIDTH}
        height={COMPOSITION_HEIGHT}
        defaultProps={{ title: "stranger" }}
      />
      <Composition
        id="MapRoute"
        component={RouteMap}
        schema={routeMapSchema}
        durationInFrames={8 * COMPOSITION_FPS}
        fps={COMPOSITION_FPS}
        width={COMPOSITION_WIDTH}
        height={COMPOSITION_HEIGHT}
        defaultProps={{
          from: [-118.2437, 34.0522],
          to: [-74.006, 40.7128],
          fromLabel: "Los Angeles",
          toLabel: "New York",
          lineColor: "#f03b20",
          lineShape: "straight" as const,
          lineStyle: "solid" as const,
          vehicle: "car" as const,
          cameraAltitudeMeters: { start: 1800000, peak: 4200000 },
          cameraLatitudeOffset: { start: 4, peak: 10 },
        }}
      />
      <Composition
        id="ColomboToUdawalawe"
        component={RouteMap}
        schema={routeMapSchema}
        durationInFrames={8 * COMPOSITION_FPS}
        fps={COMPOSITION_FPS}
        width={COMPOSITION_WIDTH}
        height={COMPOSITION_HEIGHT}
        defaultProps={{
          from: [79.8612, 6.9271],
          to: [80.8917, 6.4372],
          fromLabel: "Colombo",
          toLabel: "Udawalawe",
          lineColor: "#1f74f0",
          lineShape: "curved" as const,
          lineStyle: "dashed" as const,
          vehicle: "car" as const,
          cameraAltitudeMeters: { start: 60000, peak: 220000 },
          cameraLatitudeOffset: { start: 0.3, peak: 0.7 },
        }}
      />
    </>
  );
};
