import { type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { type RouteMapProps } from "../schemata";
import {
  addRouteLayers,
  createMap,
  getCameraOptions,
  startWorkerTicker,
  updateRouteAppearance,
  updateRouteFrame,
} from "../route-map/map-scene";
import { getRouteAnimation } from "../route-map/route-animation";
import { createCityMarkers, createRoute } from "../route-map/route-geometry";
import { loadVehicleImages } from "../route-map/vehicle-icons";

export const RouteMap = (props: RouteMapProps) => {
  const {
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
  const { delayRender, continueRender } = useDelayRender();
  const [map, setMap] = useState<Map | null>(null);
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
  const initialScene = useRef({ route, cityMarkers, props });

  useEffect(() => {
    if (!containerRef.current) return;

    const { route, cityMarkers, props } = initialScene.current;
    const mapInstance = createMap(containerRef.current, props.from);
    let removed = false;

    mapInstance.on("load", async () => {
      const images = await loadVehicleImages();
      if (removed) return;

      addRouteLayers(mapInstance, route, cityMarkers, props, images);
      mapInstance.jumpTo(
        getCameraOptions(
          mapInstance,
          route,
          0,
          props.cameraAltitudeMeters.start,
          props.cameraLatitudeOffset.start,
        ),
      );
      mapInstance.once("idle", () => {
        waitingForIdleRef.current = false;
        setMap(mapInstance);
        continueRender(loadingHandle);
      });
    });

    // Hidden tabs pause animation frames; worker ticks let MapLibre reach idle.
    const stopTicker = startWorkerTicker(50, () => {
      if (document.hidden && waitingForIdleRef.current) mapInstance.redraw();
    });

    return () => {
      removed = true;
      stopTicker();
      mapInstance.remove();
    };
  }, [continueRender, loadingHandle]);

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
    map.once("idle", () => {
      waitingForIdleRef.current = false;
      continueRender(handle);
    });
    // Repaint even when the camera is unchanged, so each frame releases its handle.
    map.triggerRepaint();
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
    <AbsoluteFill style={{ backgroundColor: "#e8eef3", borderRadius: 19 }}>
      <div ref={containerRef} style={{ height, position: "absolute", width }} />
    </AbsoluteFill>
  );
};
