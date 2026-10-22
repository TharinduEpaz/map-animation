import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { COUNTRIES } from "../app/lib/countries";
import {
  prepareCountry,
  type CountryFeature,
} from "../app/remotion/country-highlight/geometry";
import { highlightProgress } from "../app/remotion/country-highlight/scene";
import {
  countryHighlightDefaultProps,
  countryHighlightSchema,
  RenderRequest,
  routeMapCompositions,
} from "../app/remotion/schemata";

const country = (id: string): CountryFeature =>
  JSON.parse(
    readFileSync(
      new URL(`../public/countries/${id}.geojson`, import.meta.url),
      "utf8",
    ),
  );
const span = (id: string, framing: "all" | "mainland" = "all") => {
  const { bounds } = prepareCountry(country(id), framing);
  return bounds[1][0] - bounds[0][0];
};

test("every selectable country has finite, nonempty framing and a matching asset", () => {
  for (const { id } of COUNTRIES) {
    const feature = country(id);
    assert.equal(feature.properties?.id, id);
    for (const framing of ["all", "mainland"] as const) {
      const { bounds } = prepareCountry(feature, framing);
      assert.ok(bounds.flat().every(Number.isFinite), id);
      assert.ok(bounds[1][0] > bounds[0][0] && bounds[1][1] > bounds[0][1], id);
      assert.ok(bounds[1][0] - bounds[0][0] <= 360.01, id);
    }
  }
});

test("date-line countries use a local extent rather than the opposite side of the world", () => {
  assert.ok(span("FJI") < 10);
  assert.ok(span("RUS") < 200);
  assert.ok(span("USA") < 150);
  const source = country("FJI");
  const original = JSON.stringify(source);
  const result = prepareCountry(source, "all");
  assert.equal(
    JSON.stringify(source),
    original,
    "source geometry must remain unchanged",
  );
  for (const rings of result.feature.geometry.coordinates) {
    for (const ring of rings) {
      assert.deepEqual(ring[0], ring.at(-1), "polygon ring stays closed");
      for (let i = 1; i < ring.length; i++)
        assert.ok(Math.abs(ring[i][0] - ring[i - 1][0]) < 180);
    }
  }
});

test("mainland framing excludes distant territories without deleting their geometry", () => {
  assert.ok(span("FRA", "mainland") < 15);
  assert.ok(span("FRA") > 50);
  assert.equal(
    prepareCountry(country("FRA"), "mainland").feature.geometry.coordinates
      .length,
    prepareCountry(country("FRA"), "all").feature.geometry.coordinates.length,
  );
  assert.ok(span("SGP") > 0 && span("SGP") < 1);
});

test("export requests accept each mode and reject mismatched props and unsupported country IDs", () => {
  const request = {
    id: "CountryHighlight",
    inputProps: countryHighlightDefaultProps,
    resolution: "720p",
    fps: 24,
  };
  assert.ok(RenderRequest.safeParse(request).success);
  assert.equal(
    RenderRequest.safeParse({ ...request, id: "CityToCity" }).success,
    false,
  );
  assert.equal(
    countryHighlightSchema.safeParse({
      ...countryHighlightDefaultProps,
      countryId: "../FRA",
    }).success,
    false,
  );
  for (const preset of routeMapCompositions) {
    assert.ok(
      RenderRequest.safeParse({
        ...request,
        id: preset.id,
        inputProps: preset.defaultProps,
      }).success,
    );
  }
});

test("animation holds its completed title and highlight across frame rates and reverse seeks", () => {
  for (const fps of [24, 30, 60]) {
    const duration = fps * 8;
    const end = highlightProgress(duration - 1, duration);
    assert.equal(end.title, 1);
    assert.equal(end.border, 1);
    assert.equal(end.camera, 1);
    assert.deepEqual(
      highlightProgress(Math.round(duration * 0.8), duration),
      end,
    );
    assert.equal(highlightProgress(0, duration).title, 0);
    assert.deepEqual(highlightProgress(duration - 1, duration), end);
  }
});
