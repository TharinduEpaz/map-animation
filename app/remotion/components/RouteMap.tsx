import * as turf from "@turf/turf";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import * as maplibregl from "maplibre-gl";
import { type GeoJSONSource, type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const lngLat = z.tuple([
  z.number().min(-180).max(180).step(0.0001),
  z.number().min(-90).max(90).step(0.0001),
]);

export const routeMapSchema = z.object({
  from: lngLat,
  to: lngLat,
  fromLabel: z.string(),
  toLabel: z.string(),
  lineColor: zColor(),
  lineShape: z.enum(["curved", "straight"]),
  lineStyle: z.enum(["solid", "dashed", "dotted"]),
  vehicle: z.enum(["none", "plane", "car"]),
  cameraAltitudeMeters: z.object({
    start: z.number().min(1000).step(1000),
    peak: z.number().min(1000).step(1000),
  }),
  cameraLatitudeOffset: z.object({
    start: z.number().step(0.1),
    peak: z.number().step(0.1),
  }),
});

export type RouteMapProps = z.infer<typeof routeMapSchema>;

const greatCircleLine = (from: [number, number], to: [number, number]) => {
  const route = turf.greatCircle(from, to, { npoints: 100 });

  if (route.geometry.type === "LineString") {
    return turf.lineString(route.geometry.coordinates);
  }

  const longestSegment = route.geometry.coordinates.reduce((longest, segment) => {
    return segment.length > longest.length ? segment : longest;
  });

  return turf.lineString(longestSegment);
};

const routeLine = (
  from: [number, number],
  to: [number, number],
  shape: RouteMapProps["lineShape"],
) => {
  return shape === "straight" ? turf.lineString([from, to]) : greatCircleLine(from, to);
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

const carSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="20" y="8" width="24" height="48" rx="8" fill="#111111" stroke="#ffffff" stroke-width="2"/>
  <rect x="24" y="14" width="16" height="14" rx="3" fill="#ffffff"/>
  <rect x="24" y="34" width="16" height="14" rx="3" fill="#ffffff"/>
</svg>`;

const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

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
  cameraAltitudeMeters,
  cameraLatitudeOffset,
}: RouteMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { delayRender, continueRender } = useDelayRender();
  const { durationInFrames, height, width } = useVideoConfig();
  const [map, setMap] = useState<Map | null>(null);
  const [loadingHandle] = useState(() => delayRender("Loading MapLibre map"));

  const targetRoute = useMemo(() => routeLine(from, to, lineShape), [from, to, lineShape]);
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

    const mapInstance = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: from,
      zoom: 7,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      canvasContextAttributes: {
        preserveDrawingBuffer: true,
      },
    });

    mapInstance.on("load", async () => {
      const [planeImage, carImage] = await Promise.all([
        loadIcon(planeSvg),
        loadIcon(carSvg),
      ]);
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
        setMap(mapInstance);
        continueRender(loadingHandle);
      });
    });
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

    map.once("idle", () => continueRender(handle));
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
