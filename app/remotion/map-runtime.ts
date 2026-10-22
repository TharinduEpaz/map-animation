import * as maplibregl from "maplibre-gl";
import { MAP_THEMES, type MapStyleId } from "./map-styles";
import { prepareMapStyle } from "./route-map/map-style";

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

let mapWorkerUrl: string | undefined;

export const createMap = (
  container: HTMLDivElement,
  center: [number, number],
  mapStyle: MapStyleId,
) => {
  mapWorkerUrl ??= URL.createObjectURL(
    new Blob(
      [
        `import "https://unpkg.com/maplibre-gl@${maplibregl.getVersion()}/dist/maplibre-gl-worker.mjs";`,
      ],
      { type: "text/javascript" },
    ),
  );
  maplibregl.setWorkerUrl(mapWorkerUrl);

  const map = new maplibregl.Map({
    container,
    center,
    zoom: 1,
    interactive: false,
    attributionControl: false,
    fadeDuration: 0,
    canvasContextAttributes: { preserveDrawingBuffer: true },
  });
  map.setStyle(
    `https://tiles.openfreemap.org/styles/${MAP_THEMES[mapStyle].baseStyle}`,
    {
      transformStyle: (_previous, next) => prepareMapStyle(next, mapStyle),
    },
  );
  return map;
};
