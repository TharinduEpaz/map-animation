export type PlaceKind = "country" | "city";

export type Place = {
  id: string;
  name: string;
  detail: string;
  coordinates: [number, number];
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_type?: string;
    osm_id?: number;
    name?: string;
    state?: string;
    country?: string;
  };
};

const LAYERS: Record<PlaceKind, string[]> = {
  country: ["country"],
  city: ["city", "locality", "district"],
};

// routeMapSchema validates coordinates with `.step(0.0001)`; Photon returns 7 decimals.
const round4 = (value: number) => Math.round(value * 10_000) / 10_000;

export const searchPlaces = async (
  query: string,
  kind: PlaceKind,
  signal: AbortSignal,
): Promise<Place[]> => {
  const params = new URLSearchParams({ q: query, limit: "6", lang: "en" });
  for (const layer of LAYERS[kind]) {
    params.append("layer", layer);
  }

  const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
    signal,
  });
  if (!response.ok) {
    throw new Error(`Place search failed (${response.status})`);
  }

  const { features } = (await response.json()) as {
    features: PhotonFeature[];
  };

  const seen = new Set<string>();
  const places: Place[] = [];
  for (const { geometry, properties } of features) {
    const name = properties.name;
    if (!name) {
      continue;
    }

    const detail = [properties.state, properties.country]
      .filter((part) => part && part !== name)
      .join(", ");

    // OSM often has a node and a boundary for the same place; show it once.
    const key = `${name}|${detail}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const id = `${properties.osm_type}${properties.osm_id}`;
    const [lng, lat] = geometry.coordinates;
    places.push({ id, name, detail, coordinates: [round4(lng), round4(lat)] });
  }

  return places;
};
