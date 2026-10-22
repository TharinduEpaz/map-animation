import type { MapAnimationProps } from "../schemata";
import { CountryHighlight } from "./CountryHighlight";
import { RouteMap } from "./RouteMap";

export const MapAnimation = (props: MapAnimationProps) =>
  "countryId" in props ? (
    <CountryHighlight {...props} />
  ) : (
    <RouteMap {...props} />
  );
