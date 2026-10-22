import type { Map } from "maplibre-gl";
import { Easing, interpolate } from "remotion";
import type { CountryHighlightProps } from "../schemata";
import type { prepareCountry } from "./geometry";

export const highlightProgress = (frame: number, duration: number) => {
  const progress = frame / Math.max(1, duration - 1);
  const options = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  } as const;
  return {
    camera: interpolate(progress, [0, 0.3], [0, 1], options),
    fill: interpolate(progress, [0.12, 0.42], [0.05, 0.48], options),
    border: interpolate(progress, [0.08, 0.32], [0.2, 1], options),
    title: interpolate(progress, [0.28, 0.48], [0, 1], options),
  };
};

export const addCountryLayers = (
  map: Map,
  country: ReturnType<typeof prepareCountry>,
  color: string,
) => {
  // Place the fill below labels so geographic context remains readable.
  const firstLabel = map
    .getStyle()
    .layers.find((layer) => layer.type === "symbol")?.id;
  map.addSource("highlight-country", {
    type: "geojson",
    data: country.feature,
  });
  map.addLayer(
    {
      id: "country-fill",
      type: "fill",
      source: "highlight-country",
      paint: { "fill-color": color, "fill-opacity": 0 },
    },
    firstLabel,
  );
  map.addLayer({
    id: "country-border",
    type: "line",
    source: "highlight-country",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": color, "line-width": 4, "line-opacity": 0 },
  });
};

export const countryCamera = (
  map: Map,
  country: ReturnType<typeof prepareCountry>,
  width: number,
  height: number,
) => {
  const camera = map.cameraForBounds(country.bounds, {
    padding: {
      top: height * 0.12,
      bottom: height * 0.29,
      left: width * 0.14,
      right: width * 0.14,
    },
    maxZoom: 12,
  });
  if (!camera) throw new Error("Could not frame this country");
  return camera;
};

export const updateCountryFrame = (
  map: Map,
  camera: ReturnType<typeof countryCamera>,
  frame: number,
  duration: number,
  color: CountryHighlightProps["highlightColor"],
) => {
  const animation = highlightProgress(frame, duration);
  map.jumpTo({
    ...camera,
    zoom: (camera.zoom ?? 1) - 0.65 * (1 - animation.camera),
    pitch: 0,
    bearing: 0,
  });
  map.setPaintProperty("country-fill", "fill-color", color);
  map.setPaintProperty("country-fill", "fill-opacity", animation.fill);
  map.setPaintProperty("country-border", "line-color", color);
  map.setPaintProperty("country-border", "line-opacity", animation.border);
};
