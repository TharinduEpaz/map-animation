import { MAP_THEMES, type MapStyleId } from "../map-styles";

export const MapAttribution = ({ mapStyle }: { mapStyle: MapStyleId }) => {
  const theme = MAP_THEMES[mapStyle];
  return (
    <div
      style={{
        position: "absolute",
        right: 18,
        bottom: 14,
        padding: "6px 10px",
        borderRadius: 4,
        fontFamily: "sans-serif",
        fontSize: 18,
        color: theme.ink,
        backgroundColor: theme.halo,
      }}
    >
      <a href="https://openfreemap.org/" style={{ color: "inherit" }}>
        OpenFreeMap
      </a>
      {" · "}
      <a href="https://openmaptiles.org/" style={{ color: "inherit" }}>
        © OpenMapTiles
      </a>
      {" · Data from "}
      <a
        href="https://www.openstreetmap.org/copyright"
        style={{ color: "inherit" }}
      >
        OpenStreetMap
      </a>
    </div>
  );
};
