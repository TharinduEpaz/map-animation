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
import { LocationSearch } from "./components/LocationSearch";
import { SiteHeader } from "./components/SiteHeader";
import type { Place } from "./lib/geocode";
import {
  routeMapCompositions,
  type Fps,
  type RouteMapCompositionId,
  type RouteMapProps,
} from "./remotion/schemata";
import { isCloudRenderEnabled } from "./lib/feature-flags.server";

type RouteEnds = Pick<RouteMapProps, "from" | "to" | "fromLabel" | "toLabel">;

const defaultRoute = (id: RouteMapCompositionId): RouteEnds => {
  const { from, to, fromLabel, toLabel } = routeMapCompositions.find(
    (c) => c.id === id,
  )!.defaultProps;
  return { from: [...from], to: [...to], fromLabel, toLabel };
};

const coffeeUrl = () => {
  const url = process.env.BUY_ME_A_COFFEE_URL;
  return url?.startsWith("https://") ? url : null;
};

export const loader = () => ({
  cloudRenderEnabled: isCloudRenderEnabled(),
  remotionLicenseKey: process.env.REMOTION_LICENSE_KEY || null,
  buyMeACoffeeUrl: coffeeUrl(),
});

export default function Index() {
  const { cloudRenderEnabled, remotionLicenseKey, buyMeACoffeeUrl } =
    useLoaderData<typeof loader>();
  const [compositionId, setCompositionId] = useState<RouteMapCompositionId>(
    routeMapCompositions[0].id,
  );
  const [fps, setFps] = useState<Fps>(COMPOSITION_FPS);

  const [route, setRoute] = useState<RouteEnds>(() =>
    defaultRoute(routeMapCompositions[0].id),
  );

  const changeComposition = (id: RouteMapCompositionId) => {
    setCompositionId(id);
    setRoute(defaultRoute(id));
    setRouteError(null);
  };
  const [routeError, setRouteError] = useState<string | null>(null);

  const composition = useMemo(
    () => routeMapCompositions.find((c) => c.id === compositionId)!,
    [compositionId],
  );

  const inputProps: RouteMapProps = useMemo(
    () => ({ ...composition.defaultProps, ...route }),
    [composition, route],
  );

  const selectEnd = (end: "from" | "to", place: Place) => {
    const other = end === "from" ? route.to : route.from;
    if (
      other[0] === place.coordinates[0] &&
      other[1] === place.coordinates[1]
    ) {
      setRouteError("Start and end can't be the same place.");
      return;
    }

    setRouteError(null);
    setRoute((prev) =>
      end === "from"
        ? { ...prev, from: place.coordinates, fromLabel: place.name }
        : { ...prev, to: place.coordinates, toLabel: place.name },
    );
  };

  return (
    <div>
      <SiteHeader coffeeUrl={buyMeACoffeeUrl} />
      <div className="max-w-screen-md m-auto mb-5">
        <div className="mt-10 mb-5">
          <SegmentedControl
            options={routeMapCompositions.map((c) => ({
              value: c.id,
              label: c.label,
            }))}
            value={compositionId}
            onChange={changeComposition}
          />
        </div>
        <div className="mb-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <LocationSearch
              label="Start"
              kind={composition.searchKind}
              value={route.fromLabel}
              onSelect={(place) => selectEnd("from", place)}
            />
            <LocationSearch
              label="End"
              kind={composition.searchKind}
              value={route.toLabel}
              onSelect={(place) => selectEnd("to", place)}
            />
          </div>
          {routeError ? (
            <p className="mt-2 text-sm text-geist-error">{routeError}</p>
          ) : null}
          <p className="mt-2 text-xs text-subtitle">
             © OpenStreetMap 
          </p>
        </div>
        <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)] mb-10">
          <Player
            key={`${composition.id}-${fps}`}
            component={RouteMap}
            inputProps={inputProps}
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
          inputProps={inputProps}
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
