import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { log } from "node:console";
import { URL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";

const source =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson";
const response = await globalThis.fetch(source);
if (!response.ok)
  throw new Error(`Country download failed: ${response.status}`);
const content = Buffer.from(await response.arrayBuffer());
const expectedHash =
  "3e458fc036ad0a66411f2c1e6cac49c5d7bfb81cb1123bc513b22511a2b7fdeb";
if (createHash("sha256").update(content).digest("hex") !== expectedHash) {
  throw new Error(
    "The pinned source changed; review the boundary dataset before updating it.",
  );
}
const { features } = JSON.parse(content.toString("utf8"));
const countries = features.map(({ properties, geometry }) => ({
  id: properties.ADM0_A3,
  name: properties.NAME_EN,
  geometry,
}));
if (
  new Set(countries.map(({ id }) => id)).size !== countries.length ||
  countries.some(({ id, name }) => !/^[A-Z]{3}$/.test(id) || !name)
) {
  throw new Error("Invalid country identifiers or names");
}
const output = new URL("../public/countries/", import.meta.url);
await mkdir(output, { recursive: true });
for (const { id, name, geometry } of countries) {
  await writeFile(
    new URL(`${id}.geojson`, output),
    JSON.stringify({ type: "Feature", properties: { id, name }, geometry }) +
      "\n",
  );
}
const catalog = countries
  .map(({ id, name }) => ({ id, name }))
  .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
await writeFile(
  new URL("../app/data/countries.json", import.meta.url),
  JSON.stringify(catalog, null, 2) + "\n",
);
log(`Imported ${catalog.length} countries and territories.`);
