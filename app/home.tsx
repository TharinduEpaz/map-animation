import { Player } from "@remotion/player";
import { useMemo, useState } from "react";
import {
  ROUTE_MAP_DURATION_IN_FRAMES,
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
} from "./remotion/constants.mjs";
import "./app.css";
import { RouteMap } from "./remotion/components/RouteMap";
import { Button } from "./components/Button";
import { RenderControls } from "./components/RenderControls";
import { Spacing } from "./components/Spacing";
import { Tips } from "./components/Tips";
import {
  routeMapCompositions,
  type RouteMapCompositionId,
} from "./remotion/schemata";

export default function Index() {
  const [compositionId, setCompositionId] = useState<RouteMapCompositionId>(
    routeMapCompositions[0].id,
  );

  const composition = useMemo(
    () => routeMapCompositions.find((c) => c.id === compositionId)!,
    [compositionId],
  );

  return (
    <div>
      <div className="max-w-screen-md m-auto mb-5">
        <div className="flex gap-2 mt-16 mb-5">
          {routeMapCompositions.map((c) => (
            <Button
              key={c.id}
              secondary={c.id !== compositionId}
              onClick={() => setCompositionId(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>
        <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)] mb-10">
          <Player
            key={composition.id}
            component={RouteMap}
            inputProps={composition.defaultProps}
            durationInFrames={ROUTE_MAP_DURATION_IN_FRAMES}
            fps={COMPOSITION_FPS}
            compositionHeight={COMPOSITION_HEIGHT}
            compositionWidth={COMPOSITION_WIDTH}
            style={{
              width: "100%",
            }}
            controls
            autoPlay
            loop
            initiallyMuted
          />
        </div>
        <RenderControls
          compositionId={composition.id}
          inputProps={composition.defaultProps}
        ></RenderControls>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Spacing></Spacing>
      </div>
    </div>
  );
}
