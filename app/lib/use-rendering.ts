import { renderMediaOnWeb } from "@remotion/web-renderer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProgress, renderVideo } from "./api";
import { RouteMap } from "~/remotion/components/RouteMap";
import {
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
  routeMapDurationInFrames,
} from "~/remotion/constants.mjs";
import {
  Fps,
  Resolution,
  RESOLUTION_SCALES,
  RouteMapProps,
  routeMapSchema,
} from "~/remotion/schemata";

export type RenderMode = "browser" | "lambda";

export type State =
  | {
      status: "init";
    }
  | {
      status: "invoking";
    }
  | {
      progress: number;
      status: "rendering";
    }
  | {
      status: "error";
      error: Error;
    }
  | {
      url: string;
      size: number;
      status: "done";
    };

const wait = async (milliSeconds: number) => {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliSeconds);
  });
};

type RenderArgs = {
  id: string;
  inputProps: RouteMapProps;
  resolution: Resolution;
  fps: Fps;
  licenseKey: string | null;
  signal: AbortSignal;
  setState: (state: State) => void;
};

const renderInBrowser = async ({
  id,
  inputProps,
  resolution,
  fps,
  licenseKey,
  signal,
  setState,
}: RenderArgs) => {
  setState({ status: "rendering", progress: 0 });
  const { getBlob } = await renderMediaOnWeb({
    composition: {
      id,
      component: RouteMap,
      width: COMPOSITION_WIDTH,
      height: COMPOSITION_HEIGHT,
      fps,
      durationInFrames: routeMapDurationInFrames(fps),
      defaultProps: inputProps,
    },
    schema: routeMapSchema,
    inputProps,
    scale: RESOLUTION_SCALES[resolution],
    container: "mp4",
    muted: true,
    // Map tiles can take a while to arrive on slow connections.
    delayRenderTimeoutInMilliseconds: 120_000,
    licenseKey,
    signal,
    onProgress: ({ progress }) => setState({ status: "rendering", progress }),
  });
  const blob = await getBlob();
  setState({ status: "done", url: URL.createObjectURL(blob), size: blob.size });
};

const renderOnLambda = async ({
  id,
  inputProps,
  resolution,
  fps,
  signal,
  setState,
}: RenderArgs) => {
  const { renderId, bucketName } = await renderVideo({
    id,
    inputProps,
    resolution,
    fps,
  });
  setState({ status: "rendering", progress: 0 });

  while (!signal.aborted) {
    const result = await getProgress({ id: renderId, bucketName });
    if (result.type === "error") {
      throw new Error(result.message);
    }

    if (result.type === "done") {
      setState({ status: "done", url: result.url, size: result.size });
      return;
    }

    setState({ status: "rendering", progress: result.progress });
    await wait(1000);
  }
};

export const useRendering = ({
  mode,
  id,
  inputProps,
  resolution,
  fps,
  licenseKey,
}: {
  mode: RenderMode;
  id: string;
  inputProps: RouteMapProps;
  resolution: Resolution;
  fps: Fps;
  licenseKey: string | null;
}) => {
  const [state, setState] = useState<State>({
    status: "init",
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const renderMedia = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const update = (next: State) => {
      if (!controller.signal.aborted) {
        setState(next);
      }
    };

    update({ status: "invoking" });
    try {
      const render = mode === "browser" ? renderInBrowser : renderOnLambda;
      await render({
        id,
        inputProps,
        resolution,
        fps,
        licenseKey,
        signal: controller.signal,
        setState: update,
      });
    } catch (err) {
      update({ status: "error", error: err as Error });
    }
  }, [mode, id, inputProps, resolution, fps, licenseKey]);

  const undo = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => {
      if (prev.status === "done" && prev.url.startsWith("blob:")) {
        URL.revokeObjectURL(prev.url);
      }

      return { status: "init" };
    });
  }, []);

  return useMemo(() => {
    return {
      renderMedia,
      state,
      undo,
    };
  }, [renderMedia, state, undo]);
};
