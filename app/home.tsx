import { Player } from "@remotion/player";
import { useMemo, useState } from "react";
import { useLoaderData } from "react-router";
import {
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
  routeMapDurationInFrames,
} from "./remotion/constants.mjs";
import "./app.css";
import { RouteMap } from "./remotion/components/RouteMap";
import { SegmentedControl } from "./components/SegmentedControl";
import { RenderControls } from "./components/RenderControls";
import { Spacing } from "./components/Spacing";
import {
  routeMapCompositions,
  type Fps,
  type RouteMapCompositionId,
} from "./remotion/schemata";
import { isCloudRenderEnabled } from "./lib/feature-flags.server";

export const loader = () => ({
  cloudRenderEnabled: isCloudRenderEnabled(),
  remotionLicenseKey: process.env.REMOTION_LICENSE_KEY || null,
});

export default function Index() {
  const { cloudRenderEnabled, remotionLicenseKey } =
    useLoaderData<typeof loader>();
  const [compositionId, setCompositionId] = useState<RouteMapCompositionId>(
    routeMapCompositions[0].id,
  );
  const [fps, setFps] = useState<Fps>(COMPOSITION_FPS);

  const composition = useMemo(
    () => routeMapCompositions.find((c) => c.id === compositionId)!,
    [compositionId],
  );

  return (
    <div>
      <div className="max-w-screen-md m-auto mb-5">
        <div className="mt-16 mb-5">
          <SegmentedControl
            options={routeMapCompositions.map((c) => ({
              value: c.id,
              label: c.label,
            }))}
            value={compositionId}
            onChange={setCompositionId}
          />
        </div>
        <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)] mb-10">
          <Player
            key={`${composition.id}-${fps}`}
            component={RouteMap}
            inputProps={composition.defaultProps}
            durationInFrames={routeMapDurationInFrames(fps)}
            fps={fps}
            compositionHeight={COMPOSITION_HEIGHT}
            compositionWidth={COMPOSITION_WIDTH}
            style={{
              width: "100%",
            }}
            controls
            autoPlay={false}
            loop={false}
            initiallyMuted
          />
        </div>
        <RenderControls
          compositionId={composition.id}
          inputProps={composition.defaultProps}
          cloudRenderEnabled={cloudRenderEnabled}
          licenseKey={remotionLicenseKey}
          fps={fps}
          onFpsChange={setFps}
        ></RenderControls>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Spacing></Spacing>
      </div>
    </div>
  );
}
