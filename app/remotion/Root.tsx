import { Composition } from "remotion";
import {
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
  ROUTE_MAP_DURATION_IN_FRAMES,
} from "./constants.mjs";
import { RouteMap } from "./components/RouteMap";
import { routeMapCompositions, routeMapSchema } from "./schemata";

export const RemotionRoot = () => {
  return (
    <>
      {routeMapCompositions.map((composition) => (
        <Composition
          key={composition.id}
          id={composition.id}
          component={RouteMap}
          schema={routeMapSchema}
          durationInFrames={ROUTE_MAP_DURATION_IN_FRAMES}
          fps={COMPOSITION_FPS}
          width={COMPOSITION_WIDTH}
          height={COMPOSITION_HEIGHT}
          defaultProps={composition.defaultProps}
        />
      ))}
    </>
  );
};
