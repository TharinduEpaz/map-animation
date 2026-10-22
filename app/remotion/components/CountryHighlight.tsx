import "maplibre-gl/dist/maplibre-gl.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/400.css";
import { useEffect, useRef, useState } from "react";
import type { Map } from "maplibre-gl";
import {
  AbsoluteFill,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useRemotionEnvironment,
  useVideoConfig,
} from "remotion";
import type { CountryHighlightProps } from "../schemata";
import { MAP_THEMES } from "../map-styles";
import { createMap, startWorkerTicker } from "../map-runtime";
import {
  prepareCountry,
  type CountryFeature,
} from "../country-highlight/geometry";
import {
  addCountryLayers,
  countryCamera,
  highlightProgress,
  updateCountryFrame,
} from "../country-highlight/scene";
import { MapAttribution } from "./MapAttribution";

export const CountryHighlight = (props: CountryHighlightProps) => (
  <CountryHighlightScene
    key={`${props.countryId}-${props.mapStyle}-${props.framing}`}
    {...props}
  />
);

const CountryHighlightScene = (props: CountryHighlightProps) => {
  const { countryId, mapStyle, displayName, subtitle, highlightColor } = props;
  const theme = MAP_THEMES[mapStyle];
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const { isRendering, isClientSideRendering } = useRemotionEnvironment();
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<{
    map: Map;
    camera: ReturnType<typeof countryCamera>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const waiting = useRef(true);
  const initial = useRef({ props, frame, width, height, durationInFrames });
  const [loadHandle] = useState(() =>
    delayRender("Loading country boundaries and map"),
  );

  useEffect(() => {
    if (!container.current) return;
    const { props, frame, width, height, durationInFrames } = initial.current;
    const controller = new AbortController();
    let map: Map | null = null;
    let disposed = false;
    const fail = (cause: unknown) => {
      if (disposed) return;
      const message =
        "Unable to load this country. Check your connection and select the country again.";
      setError(message);
      waiting.current = false;
      if (isRendering || isClientSideRendering)
        cancelRender(new Error(message, { cause }));
      else continueRender(loadHandle);
    };

    const load = async () => {
      const response = await fetch(
        staticFile(`countries/${props.countryId}.geojson`),
        { signal: controller.signal },
      );
      if (!response.ok)
        throw new Error(`Country boundary request failed (${response.status})`);
      const country = prepareCountry(
        (await response.json()) as CountryFeature,
        props.framing,
      );
      await Promise.all([
        document.fonts.load("700 72px Inter"),
        document.fonts.load("400 32px Inter"),
      ]);
      if (disposed || !container.current) return;
      const [[west, south], [east, north]] = country.bounds;
      const instance = createMap(
        container.current,
        [(west + east) / 2, (south + north) / 2],
        props.mapStyle,
      );
      map = instance;
      instance.on("error", (event) => fail(event.error));
      instance.on("load", () => {
        if (disposed) return;
        try {
          addCountryLayers(instance, country, props.highlightColor);
          const camera = countryCamera(instance, country, width, height);
          updateCountryFrame(
            instance,
            camera,
            frame,
            durationInFrames,
            props.highlightColor,
          );
          instance.once("idle", () => {
            if (disposed) return;
            waiting.current = false;
            setReady({ map: instance, camera });
            continueRender(loadHandle);
          });
        } catch (cause) {
          fail(cause);
        }
      });
    };
    void load().catch(fail);
    const stopTicker = startWorkerTicker(50, () => {
      if (document.hidden && waiting.current) map?.redraw();
    });
    return () => {
      disposed = true;
      controller.abort();
      stopTicker();
      map?.remove();
      continueRender(loadHandle);
    };
  }, [
    cancelRender,
    continueRender,
    loadHandle,
    isRendering,
    isClientSideRendering,
  ]);

  useEffect(() => {
    if (!ready) return;
    const handle = delayRender("Rendering country highlight frame");
    waiting.current = true;
    const onIdle = () => {
      waiting.current = false;
      continueRender(handle);
    };
    ready.map.once("idle", onIdle);
    updateCountryFrame(
      ready.map,
      ready.camera,
      frame,
      durationInFrames,
      highlightColor,
    );
    ready.map.triggerRepaint();
    return () => {
      ready.map.off("idle", onIdle);
      continueRender(handle);
    };
  }, [
    ready,
    frame,
    durationInFrames,
    highlightColor,
    delayRender,
    continueRender,
  ]);

  const { title } = highlightProgress(frame, durationInFrames);
  return (
    <AbsoluteFill style={{ backgroundColor: theme.land, overflow: "hidden" }}>
      <div
        ref={container}
        data-country={countryId}
        data-map-ready={Boolean(ready)}
        data-map-style={mapStyle}
        style={{ position: "absolute", width, height }}
      />
      <div
        style={{
          position: "absolute",
          left: 100,
          bottom: 85,
          maxWidth: width - 200,
          opacity: title,
          transform: `translateY(${24 * (1 - title)}px)`,
          padding: "24px 36px",
          borderLeft: `8px solid ${highlightColor}`,
          backgroundColor: theme.halo,
          color: theme.ink,
          borderRadius: 6,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: displayName.length > 28 ? 52 : 80,
            lineHeight: 1.12,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            overflowWrap: "anywhere",
          }}
        >
          {displayName}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              marginTop: 12,
              maxWidth: 1200,
              overflowWrap: "anywhere",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      <MapAttribution mapStyle={mapStyle} />
      {error ? (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 100,
            backgroundColor: theme.land,
            color: theme.ink,
            fontSize: 32,
            textAlign: "center",
          }}
        >
          <p role="alert">{error}</p>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
