import * as turf from "@turf/turf";
import * as maplibregl from "maplibre-gl";
import { type GeoJSONSource, type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { type RouteMapProps } from "../schemata";
import { INTER_LABEL_FONT, interFontFaces } from "../map-fonts";

const greatCircleLine = (from: [number, number], to: [number, number], curveHeight: number) => {
  const line = turf.lineString([from, to]);
  const length = turf.length(line);
  const midpoint = turf.midpoint(from, to);
  const bearing = turf.bearing(from, to);

  // Offset distance controls the "height" of the arc
  const offsetDistance = length * curveHeight; 
  // Offset it perpendicularly to create a control point
  const controlPoint = turf.destination(midpoint, offsetDistance, bearing - 90);

  // Generate a smooth curve through the points
  return turf.bezierSpline(turf.lineString([
    from,
    controlPoint.geometry.coordinates,
    to
  ]));
};

const routeLine = (
  from: [number, number],
  to: [number, number],
  shape: RouteMapProps["lineShape"],
  curveHeight: number = 0.2
) => {
  return shape === "straight" ? turf.lineString([from, to]) : greatCircleLine(from, to, curveHeight);
};

const lineDasharray = (style: RouteMapProps["lineStyle"]): number[] | undefined => {
  if (style === "dashed") {
    return [3, 2];
  }

  if (style === "dotted") {
    return [0.4, 1.6];
  }

  return undefined;
};

const clampProgress = (progress: number) => Math.min(1, Math.max(0, progress));

const distanceAlong = (totalDistance: number, progress: number) => {
  return Math.max(0.001, totalDistance * clampProgress(progress));
};

const planeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M32 2 L38 24 L60 34 L60 40 L38 34 L38 46 L48 54 L48 60 L32 54 L16 60 L16 54 L26 46 L26 34 L4 40 L4 34 L26 24 Z" fill="#111111" stroke="#ffffff" stroke-width="2"/>
</svg>`;

// Top-down car, with its hood pointing north to match the route bearing.
const carSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <g fill="#17212b" stroke="#ffffff" stroke-width="1.5">
    <rect x="15" y="14" width="7" height="12" rx="2.5"/>
    <rect x="42" y="14" width="7" height="12" rx="2.5"/>
    <rect x="15" y="42" width="7" height="12" rx="2.5"/>
    <rect x="42" y="42" width="7" height="12" rx="2.5"/>
  </g>
  <path d="M23 4 Q32 1 41 4 Q46 7 46 16 L46 48 Q46 59 40 60 L24 60 Q18 59 18 48 L18 16 Q18 7 23 4Z" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
  <path d="M24 8 Q32 5 40 8 L41 16 L23 16Z" fill="#60a5fa"/>
  <path d="M23 20 Q32 17 41 20 L39 30 L25 30Z" fill="#172b46" stroke="#bfdbfe" stroke-width="1"/>
  <path d="M21 25 L24 33 L24 43 L21 47Z M43 25 L40 33 L40 43 L43 47Z" fill="#172b46"/>
  <rect x="26" y="32" width="12" height="12" rx="2" fill="#60a5fa"/>
  <path d="M25 46 L39 46 L41 53 Q32 56 23 53Z" fill="#172b46" stroke="#bfdbfe" stroke-width="1"/>
  <path d="M18 23 L13 25 L13 29 L18 28 M46 23 L51 25 L51 29 L46 28" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M22 9 L25 8 M39 8 L42 9" stroke="#fef3c7" stroke-width="3" stroke-linecap="round"/>
  <path d="M22 56 L26 57 M38 57 L42 56" stroke="#fb7185" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

const startWorkerTicker = (intervalMs: number, onTick: () => void) => {
  const url = URL.createObjectURL(
    new Blob([`setInterval(() => postMessage(0), ${intervalMs});`], {
      type: "text/javascript",
    }),
  );
  const worker = new Worker(url);
  worker.onmessage = onTick;
  return () => {
    worker.terminate();
    URL.revokeObjectURL(url);
  };
};

const svgToDataUrl =(svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const loadIcon = (svg: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = svgToDataUrl(svg);
  });
};

const vehicleIconId = (vehicle: RouteMapProps["vehicle"]) => {
  return vehicle === "car" ? "car-icon" : "plane-icon";
};

export const RouteMap = ({
  from,
  to,
  fromLabel,
  toLabel,
  lineColor,
  lineShape,
  lineStyle,
  vehicle,
  curveHeight = 0.2,
  cameraAltitudeMeters,
  cameraLatitudeOffset,
}: RouteMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { delayRender, continueRender } = useDelayRender();
  const { durationInFrames, height, width } = useVideoConfig();
  const [map, setMap] = useState<Map | null>(null);
  const [loadingHandle] = useState(() => delayRender("Loading MapLibre map"));
  const waitingForIdleRef = useRef(true);

  const targetRoute = useMemo(() => routeLine(from, to, lineShape, curveHeight), [from, to, lineShape, curveHeight]);
  const targetRouteDistance = useMemo(() => turf.length(targetRoute), [targetRoute]);
  const cameraRoute = targetRoute;
  const cameraRouteDistance = targetRouteDistance;
  const cityMarkers = useMemo(
    () =>
      turf.featureCollection([
        turf.point(from, { name: fromLabel }),
        turf.point(to, { name: toLabel }),
      ]),
    [from, to, fromLabel, toLabel],
  );

  const getPartialTargetRoute = (progress: number) => {
    return turf.lineSliceAlong(
      targetRoute,
      0,
      distanceAlong(targetRouteDistance, progress),
    );
  };

  const getVehicleFeature = (progress: number) => {
    const behind = turf.along(
      targetRoute,
      distanceAlong(targetRouteDistance, Math.max(0, progress - 0.001)),
    ).geometry.coordinates;
    const ahead = turf.along(
      targetRoute,
      distanceAlong(targetRouteDistance, Math.min(1, progress + 0.001)),
    ).geometry.coordinates;
    const current = turf.along(
      targetRoute,
      distanceAlong(targetRouteDistance, progress),
    ).geometry.coordinates;

    return turf.point(current, { bearing: turf.bearing(behind, ahead) });
  };

  const getCameraOptions = (
    mapInstance: Map,
    progress: number,
    altitudeMeters: number,
    latitudeOffset: number,
  ) => {
    const target = turf.along(
      targetRoute,
      distanceAlong(targetRouteDistance, progress),
    ).geometry.coordinates;
    const camera = turf.along(
      cameraRoute,
      distanceAlong(cameraRouteDistance, progress),
    ).geometry.coordinates;

    return mapInstance.calculateCameraOptionsFromTo(
      new maplibregl.LngLat(camera[0], camera[1] - latitudeOffset),
      altitudeMeters,
      new maplibregl.LngLat(target[0], target[1]),
    );
  };

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    maplibregl.setWorkerUrl(
      URL.createObjectURL(
        new Blob(
          [
            `import "https://unpkg.com/maplibre-gl@${maplibregl.getVersion()}/dist/maplibre-gl-worker.mjs";`,
          ],
          { type: "text/javascript" },
        ),
      ),
    );

    let removed = false;
    const mapInstance = new maplibregl.Map({
      container: containerRef.current,
      projection: { type: "globe" } as any,
      center: from,
      zoom: 1,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      canvasContextAttributes: {
        preserveDrawingBuffer: true,
      },
    });

    mapInstance.setStyle("https://tiles.openfreemap.org/styles/liberty", {
      transformStyle: (_previous, next) => ({
        ...next,
        "font-faces": interFontFaces,
      }),
    });

    mapInstance.on("load", async () => {
      const [planeImage, carImage] = await Promise.all([
        loadIcon(planeSvg),
        loadIcon(carSvg),
      ]);
      if (removed) {
        return;
      }

      mapInstance.addImage("plane-icon", planeImage);
      mapInstance.addImage("car-icon", carImage);

      mapInstance.addSource("trace", {
        type: "geojson",
        data: getPartialTargetRoute(0),
      });

      mapInstance.addLayer({
        id: "trace-line",
        type: "line",
        source: "trace",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": lineColor,
          "line-width": 7,
          ...(lineDasharray(lineStyle)
            ? { "line-dasharray": lineDasharray(lineStyle) as number[] }
            : {}),
        },
      });

      mapInstance.addSource("city-markers", {
        type: "geojson",
        data: cityMarkers,
      });

      mapInstance.addLayer({
        id: "city-marker-dots",
        type: "circle",
        source: "city-markers",
        paint: {
          "circle-color": "#111111",
          "circle-radius": 12,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 4,
        },
      });

      mapInstance.addLayer({
        id: "city-marker-labels",
        type: "symbol",
        source: "city-markers",
        layout: {
          "text-allow-overlap": true,
          "text-anchor": "top",
          "text-field": ["get", "name"],
          "text-font": [INTER_LABEL_FONT],
          "text-offset": [0, 0.9],
          "text-size": 28,
        },
        paint: {
          "text-color": "#111111",
          "text-halo-color": "#ffffff",
          "text-halo-width": 3,
        },
      });

      mapInstance.addSource("vehicle", {
        type: "geojson",
        data: getVehicleFeature(0),
      });

      mapInstance.addLayer({
        id: "vehicle-icon",
        type: "symbol",
        source: "vehicle",
        layout: {
          "icon-image": vehicleIconId(vehicle),
          "icon-size": 0.7,
          "icon-rotate": ["get", "bearing"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          visibility: vehicle === "none" ? "none" : "visible",
        },
      });

      mapInstance.jumpTo(
        getCameraOptions(mapInstance, 0, cameraAltitudeMeters.start, cameraLatitudeOffset.start),
      );
      mapInstance.once("idle", () => {
        waitingForIdleRef.current = false;
        setMap(mapInstance);
        continueRender(loadingHandle);
      });
    });

    // Hidden tabs pause requestAnimationFrame, so MapLibre never reaches "idle" and the
    // render stalls. Worker timers keep firing in the background; use them to redraw by hand.
    const stopTicker = startWorkerTicker(50, () => {
      if (document.hidden && waitingForIdleRef.current) {
        mapInstance.redraw();
      }
    });

    return () => {
      removed = true;
      stopTicker();
      mapInstance.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continueRender, loadingHandle]);

  useEffect(() => {
    if (!map) {
      return;
    }

    map.setPaintProperty("trace-line", "line-color", lineColor);
    map.setPaintProperty("trace-line", "line-dasharray", lineDasharray(lineStyle));

    const citySource = map.getSource("city-markers") as GeoJSONSource | undefined;
    citySource?.setData(cityMarkers);

    map.setLayoutProperty("vehicle-icon", "visibility", vehicle === "none" ? "none" : "visible");
    if (vehicle !== "none") {
      map.setLayoutProperty("vehicle-icon", "icon-image", vehicleIconId(vehicle));
    }
  }, [map, lineColor, lineStyle, cityMarkers, vehicle]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const handle = delayRender("Rendering MapLibre frame");
    const timelineProgress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
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
    const trace = map.getSource("trace") as GeoJSONSource | undefined;
    const vehicleSource = map.getSource("vehicle") as GeoJSONSource | undefined;

    trace?.setData(getPartialTargetRoute(travelProgress));
    vehicleSource?.setData(getVehicleFeature(travelProgress));
    map.jumpTo(getCameraOptions(map, travelProgress, altitudeMeters, latitudeOffset));

    waitingForIdleRef.current = true;
    map.once("idle", () => {
      waitingForIdleRef.current = false;
      continueRender(handle);
    });
    map.triggerRepaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continueRender, delayRender, durationInFrames, frame, map, targetRoute]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#e8eef3",
        borderRadius: 19,
      }}
    >
      <div ref={containerRef} style={{ height, position: "absolute", width }} />
    </AbsoluteFill>
  );
};
