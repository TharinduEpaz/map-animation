import { Composition } from "remotion";
import {
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
  routeMapDurationInFrames,
} from "./constants.mjs";
import { RouteMap } from "./components/RouteMap";
import { CountryHighlight } from "./components/CountryHighlight";
import {
  routeMapCompositions,
  routeMapRenderSchema,
  countryHighlightDefaultProps,
  countryHighlightRenderSchema,
} from "./schemata";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CountryHighlight"
        component={CountryHighlight}
        schema={countryHighlightRenderSchema}
        durationInFrames={routeMapDurationInFrames(COMPOSITION_FPS)}
        fps={COMPOSITION_FPS}
        width={COMPOSITION_WIDTH}
        height={COMPOSITION_HEIGHT}
        defaultProps={countryHighlightDefaultProps}
        calculateMetadata={({ props }) => {
          const fps = props.fps ?? COMPOSITION_FPS;
          return { fps, durationInFrames: routeMapDurationInFrames(fps) };
        }}
      />
      {routeMapCompositions.map((composition) => (
        <Composition
          key={composition.id}
          id={composition.id}
          component={RouteMap}
          schema={routeMapRenderSchema}
          durationInFrames={routeMapDurationInFrames(COMPOSITION_FPS)}
          fps={COMPOSITION_FPS}
          width={COMPOSITION_WIDTH}
          height={COMPOSITION_HEIGHT}
          defaultProps={composition.defaultProps}
          calculateMetadata={({ props }) => {
            const fps = props.fps ?? COMPOSITION_FPS;
            return { fps, durationInFrames: routeMapDurationInFrames(fps) };
          }}
        />
      ))}
    </>
  );
};
