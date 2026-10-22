import countries from "../data/countries.json";

export const COUNTRIES = countries;
export const COUNTRY_IDS = new Set(COUNTRIES.map((country) => country.id));

export const getCountryName = (id: string) =>
  COUNTRIES.find((country) => country.id === id)?.name ?? id;
