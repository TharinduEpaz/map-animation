import { Composition } from "remotion";
import {
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
} from "./constants.mjs";
import { RouteMap, routeMapSchema } from "./components/RouteMap";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CountryToCountry"
        component={RouteMap}
        schema={routeMapSchema}
        durationInFrames={8 * COMPOSITION_FPS}
        fps={COMPOSITION_FPS}
        width={COMPOSITION_WIDTH}
        height={COMPOSITION_HEIGHT}
        defaultProps={{
          from: [-74.006, 40.7128],
          to: [-0.1276, 51.5072],
          fromLabel: "United States",
          toLabel: "United Kingdom",
          lineColor: "#f03b20",
          lineShape: "curved" as const,
          lineStyle: "solid" as const,
          vehicle: "plane" as const,
          curveHeight: 0.2,
          cameraAltitudeMeters: { start: 3000000, peak: 9000000 },
          cameraLatitudeOffset: { start: 2, peak: 10 },
        }}
      />
      <Composition
        id="CityToCity"
        component={RouteMap}
        schema={routeMapSchema}
        durationInFrames={8 * COMPOSITION_FPS}
        fps={COMPOSITION_FPS}
        width={COMPOSITION_WIDTH}
        height={COMPOSITION_HEIGHT}
        defaultProps={{
          from: [79.8627, 6.9271],
          to: [80.8917, 6.4372],
          fromLabel: "Colombo",
          toLabel: "Udawalawe",
          lineColor: "#ff0000",
          lineShape: "curved" as const,
          lineStyle: "dotted" as const,
          vehicle: "car" as const,
          cameraAltitudeMeters: { start: 60000, peak: 220000 },
          cameraLatitudeOffset: { start: 0.3, peak: 0.7 },
          curveHeight: -0.1,
        }}
      />
    </>
  );
};
