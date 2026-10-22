import { type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useDelayRender,
  useRemotionEnvironment,
  useVideoConfig,
} from "remotion";
import { type RouteMapProps } from "../schemata";
import {
  addRouteLayers,
  updateRouteAppearance,
  updateRouteFrame,
} from "../route-map/map-scene";
import { getRouteAnimation } from "../route-map/route-animation";
import { createCityMarkers, createRoute } from "../route-map/route-geometry";
import { loadVehicleImages } from "../route-map/vehicle-icons";
import { MAP_THEMES } from "../map-styles";
import { createMap, startWorkerTicker } from "../map-runtime";
import { MapAttribution } from "./MapAttribution";

// A new basemap gets its own scene, including route sources and vehicle images.
// Keep the Player mounted so a style change preserves its current frame.
export const RouteMap = (props: RouteMapProps) => (
  <RouteMapScene key={props.mapStyle ?? "classic"} {...props} />
);

const RouteMapScene = (props: RouteMapProps) => {
  const {
    mapStyle = "classic",
    from,
    to,
    fromLabel,
    toLabel,
    lineShape,
    curveHeight = 0.2,
    lineColor,
    lineStyle,
    vehicle,
    cameraAltitudeMeters,
    cameraLatitudeOffset,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { durationInFrames, height, width } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const { isRendering, isClientSideRendering } = useRemotionEnvironment();
  const [map, setMap] = useState<Map | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingHandle] = useState(() => delayRender("Loading MapLibre map"));
  const waitingForIdleRef = useRef(true);

  const route = useMemo(
    () => createRoute(from, to, lineShape, curveHeight),
    [from, to, lineShape, curveHeight],
  );
  const cityMarkers = useMemo(
    () => createCityMarkers(from, to, fromLabel, toLabel),
    [from, to, fromLabel, toLabel],
  );
  // Initialize the map once. Later prop changes update the existing sources/layers.
  const initialScene = useRef({
    route,
    cityMarkers,
    props,
    frame,
    durationInFrames,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const { route, cityMarkers, props, frame, durationInFrames } =
      initialScene.current;
    const mapInstance = createMap(
      containerRef.current,
      props.from,
      props.mapStyle ?? "classic",
    );
    let removed = false;

    const fail = (error: unknown) => {
      if (removed) return;
      const message = `Unable to load the ${MAP_THEMES[props.mapStyle ?? "classic"].label} map. Check your connection and try another style.`;
      setLoadError(message);
      if (isRendering || isClientSideRendering) {
        cancelRender(new Error(message, { cause: error }));
      } else {
        continueRender(loadingHandle);
      }
    };
    mapInstance.on("error", (event) => fail(event.error));

    mapInstance.on("load", async () => {
      try {
        const images = await loadVehicleImages();
        if (removed) return;

        addRouteLayers(mapInstance, route, cityMarkers, props, images);
        updateRouteFrame(
          mapInstance,
          route,
          getRouteAnimation(
            frame,
            durationInFrames,
            props.cameraAltitudeMeters,
            props.cameraLatitudeOffset,
          ),
        );
        mapInstance.once("idle", () => {
          if (removed) return;
          waitingForIdleRef.current = false;
          setMap(mapInstance);
          continueRender(loadingHandle);
        });
      } catch (error) {
        fail(error);
      }
    });

    // Hidden tabs pause animation frames; worker ticks let MapLibre reach idle.
    const stopTicker = startWorkerTicker(50, () => {
      if (document.hidden && waitingForIdleRef.current) mapInstance.redraw();
    });

    return () => {
      removed = true;
      stopTicker();
      mapInstance.remove();
      // Style changes can unmount a scene before the tiles finish loading.
      continueRender(loadingHandle);
    };
  }, [
    continueRender,
    cancelRender,
    loadingHandle,
    isRendering,
    isClientSideRendering,
  ]);

  useEffect(() => {
    if (!map) return;
    updateRouteAppearance(map, cityMarkers, lineColor, lineStyle, vehicle);
  }, [map, cityMarkers, lineColor, lineStyle, vehicle]);

  useEffect(() => {
    if (!map) return;

    const handle = delayRender("Rendering MapLibre frame");
    const animation = getRouteAnimation(
      frame,
      durationInFrames,
      cameraAltitudeMeters,
      cameraLatitudeOffset,
    );
    updateRouteFrame(map, route, animation);

    waitingForIdleRef.current = true;
    const onIdle = () => {
      waitingForIdleRef.current = false;
      continueRender(handle);
    };
    map.once("idle", onIdle);
    // Repaint even when the camera is unchanged, so each frame releases its handle.
    map.triggerRepaint();
    return () => {
      map.off("idle", onIdle);
      continueRender(handle);
    };
  }, [
    map,
    route,
    frame,
    durationInFrames,
    cameraAltitudeMeters,
    cameraLatitudeOffset,
    delayRender,
    continueRender,
  ]);

  return (
    <AbsoluteFill
      style={{ backgroundColor: MAP_THEMES[mapStyle].land, borderRadius: 19 }}
    >
      <div
        ref={containerRef}
        data-map-style={mapStyle}
        data-map-ready={Boolean(map)}
        style={{ height, position: "absolute", width }}
      />
      <MapAttribution mapStyle={mapStyle} />
      {loadError ? (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 100,
            backgroundColor: MAP_THEMES[mapStyle].land,
            color: MAP_THEMES[mapStyle].ink,
            fontSize: 32,
            textAlign: "center",
          }}
        >
          <p role="alert">{loadError}</p>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
