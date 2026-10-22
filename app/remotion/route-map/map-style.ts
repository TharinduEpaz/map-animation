import type { LayerSpecification, StyleSpecification } from "maplibre-gl";
import { interFontFaces } from "../map-fonts";
import { MAP_THEMES, type MapStyleId } from "../map-styles";

// The hosted Dark style references two images absent from its sprite sheet.
// Keep its solid woodland fill and place labels without those optional images.
const darkLayer = (layer: LayerSpecification): LayerSpecification => {
  if (
    layer.type === "fill" &&
    layer.paint?.["fill-pattern"] === "wood-pattern"
  ) {
    const paint = { ...layer.paint };
    delete paint["fill-pattern"];
    return { ...layer, paint };
  }
  if (layer.type === "symbol") {
    const icon = layer.layout?.["icon-image"];
    if (
      icon === "circle-11" ||
      (Array.isArray(icon) && icon.some((part) => part === "circle-11"))
    ) {
      const layout = { ...layer.layout };
      delete layout["icon-image"];
      return { ...layer, layout };
    }
  }
  return layer;
};

// Restyle the basemap itself so route lines and vehicles retain their colors.
// Keep the source style's filters, zoom thresholds, widths and label placement.
const vintageLayer = (layer: LayerSpecification): LayerSpecification => {
  const theme = MAP_THEMES.vintage;
  const sourceLayer = "source-layer" in layer ? layer["source-layer"] : "";

  switch (layer.type) {
    case "background":
      return { ...layer, paint: { "background-color": theme.land } };
    case "fill": {
      const paint = { ...layer.paint };
      delete paint["fill-pattern"];
      return {
        ...layer,
        paint: {
          ...paint,
          "fill-color":
            sourceLayer === "water"
              ? theme.water
              : sourceLayer === "landcover" || sourceLayer === "park"
                ? "#c8c5a0"
                : sourceLayer === "building"
                  ? "#d6c39d"
                  : theme.land,
          ...(paint["fill-outline-color"]
            ? { "fill-outline-color": "#c5b28e" }
            : {}),
        },
      };
    }
    case "line": {
      const paint = { ...layer.paint };
      delete paint["line-pattern"];
      return {
        ...layer,
        paint: {
          ...paint,
          "line-color":
            sourceLayer === "waterway"
              ? theme.water
              : sourceLayer === "boundary"
                ? "#9c805a"
                : layer.id.includes("casing")
                  ? "#c6b38f"
                  : theme.road,
        },
      };
    }
    case "symbol":
      return {
        ...layer,
        paint: {
          ...layer.paint,
          "text-color": theme.ink,
          "text-halo-color": theme.halo,
        },
      };
    default:
      return layer;
  }
};

export const prepareMapStyle = (
  style: StyleSpecification,
  id: MapStyleId,
): StyleSpecification => ({
  ...style,
  "font-faces": { ...style["font-faces"], ...interFontFaces },
  // Disable MapLibre's wall-clock paint transitions for deterministic frames.
  // eslint-disable-next-line @remotion/non-pure-animation
  transition: { duration: 0, delay: 0 },
  layers:
    id === "vintage"
      ? style.layers
          .filter((layer) => layer.type !== "raster")
          .map(vintageLayer)
      : id === "dark"
        ? style.layers.map(darkLayer)
        : style.layers,
});
