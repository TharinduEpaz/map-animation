import * as maplibregl from "maplibre-gl";
import { type GeoJSONSource, type Map } from "maplibre-gl";
import { INTER_LABEL_FONT, interFontFaces } from "../map-fonts";
import { type RouteMapProps } from "../schemata";
import { type RouteAnimation } from "./route-animation";
import {
  type RouteGeometry,
  createCityMarkers,
  getPartialRoute,
  getRoutePosition,
  getVehicleFeature,
} from "./route-geometry";
import {
  loadVehicleImages,
  vehicleIconId,
  vehicleIconSize,
} from "./vehicle-icons";

const lineDasharray = (
  style: RouteMapProps["lineStyle"],
): number[] | undefined => {
  if (style === "dashed") {
    return [3, 2];
  }

  if (style === "dotted") {
    return [0.4, 1.6];
  }

  return undefined;
};

export const startWorkerTicker = (intervalMs: number, onTick: () => void) => {
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

export const createMap = (
  container: HTMLDivElement,
  center: RouteMapProps["from"],
) => {
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

  const map = new maplibregl.Map({
    container,
    center,
    zoom: 1,
    interactive: false,
    attributionControl: false,
    fadeDuration: 0,
    canvasContextAttributes: { preserveDrawingBuffer: true },
  });
  map.setStyle("https://tiles.openfreemap.org/styles/liberty", {
    transformStyle: (_previous, next) => ({
      ...next,
      "font-faces": interFontFaces,
    }),
  });
  return map;
};

export type CityMarkers = ReturnType<typeof createCityMarkers>;

export const addRouteLayers = (
  mapInstance: Map,
  route: RouteGeometry,
  cityMarkers: CityMarkers,
  { lineColor, lineStyle, vehicle }: RouteMapProps,
  images: Awaited<ReturnType<typeof loadVehicleImages>>,
) => {
  const dasharray = lineDasharray(lineStyle);
  mapInstance.addImage("plane-icon", images.plane, { pixelRatio: 2 });
  mapInstance.addImage("car-icon", images.car);

  mapInstance.addSource("trace", {
    type: "geojson",
    data: getPartialRoute(route, 0),
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
      ...(dasharray ? { "line-dasharray": dasharray } : {}),
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
    data: getVehicleFeature(route, 0),
  });

  mapInstance.addLayer({
    id: "vehicle-icon",
    type: "symbol",
    source: "vehicle",
    layout: {
      "icon-image": vehicleIconId(vehicle),
      "icon-size": vehicleIconSize(vehicle),
      "icon-rotate": ["get", "bearing"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      visibility: vehicle === "none" ? "none" : "visible",
    },
  });
};

export const updateRouteAppearance = (
  map: Map,
  cityMarkers: CityMarkers,
  lineColor: RouteMapProps["lineColor"],
  lineStyle: RouteMapProps["lineStyle"],
  vehicle: RouteMapProps["vehicle"],
) => {
  map.setPaintProperty("trace-line", "line-color", lineColor);
  map.setPaintProperty(
    "trace-line",
    "line-dasharray",
    lineDasharray(lineStyle),
  );

  const citySource = map.getSource("city-markers") as GeoJSONSource | undefined;
  citySource?.setData(cityMarkers);

  map.setLayoutProperty(
    "vehicle-icon",
    "visibility",
    vehicle === "none" ? "none" : "visible",
  );
  if (vehicle !== "none") {
    map.setLayoutProperty("vehicle-icon", "icon-image", vehicleIconId(vehicle));
    map.setLayoutProperty(
      "vehicle-icon",
      "icon-size",
      vehicleIconSize(vehicle),
    );
  }
};

export const getCameraOptions = (
  map: Map,
  route: RouteGeometry,
  progress: number,
  altitudeMeters: number,
  latitudeOffset: number,
) => {
  const position = getRoutePosition(route, progress);
  return map.calculateCameraOptionsFromTo(
    new maplibregl.LngLat(position[0], position[1] - latitudeOffset),
    altitudeMeters,
    new maplibregl.LngLat(position[0], position[1]),
  );
};

export const updateRouteFrame = (
  map: Map,
  route: RouteGeometry,
  { travelProgress, altitudeMeters, latitudeOffset }: RouteAnimation,
) => {
  const trace = map.getSource("trace") as GeoJSONSource | undefined;
  const vehicle = map.getSource("vehicle") as GeoJSONSource | undefined;
  trace?.setData(getPartialRoute(route, travelProgress));
  vehicle?.setData(getVehicleFeature(route, travelProgress));
  map.jumpTo(
    getCameraOptions(
      map,
      route,
      travelProgress,
      altitudeMeters,
      latitudeOffset,
    ),
  );
};
