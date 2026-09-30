import { useCallback, useMemo, useState } from "react";
import {
  getLocalProgress,
  getProgress,
  renderVideo,
  renderVideoLocal,
} from "./api";
import { z } from "zod";
import {
  ProgressResponse,
  RenderRequest,
  Resolution,
  RouteMapProps,
} from "~/remotion/schemata";

export type RenderMode = "local" | "lambda";

export type State =
  | {
      status: "init";
    }
  | {
      status: "invoking";
    }
  | {
      renderId: string;
      progress: number;
      status: "rendering";
    }
  | {
      renderId: string | null;
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

const startRender = async (
  mode: RenderMode,
  request: z.infer<typeof RenderRequest>,
): Promise<{ renderId: string; poll: () => Promise<ProgressResponse> }> => {
  if (mode === "local") {
    const { renderId } = await renderVideoLocal(request);
    return { renderId, poll: () => getLocalProgress({ id: renderId }) };
  }

  const { renderId, bucketName } = await renderVideo(request);
  return { renderId, poll: () => getProgress({ id: renderId, bucketName }) };
};

export const useRendering = (
  mode: RenderMode,
  id: string,
  inputProps: RouteMapProps,
  resolution: Resolution,
) => {
  const [state, setState] = useState<State>({
    status: "init",
  });

  const renderMedia = useCallback(async () => {
    setState({
      status: "invoking",
    });
    try {
      const { renderId, poll } = await startRender(mode, {
        id,
        inputProps,
        resolution,
      });
      setState({
        status: "rendering",
        progress: 0,
        renderId: renderId,
      });

      let pending = true;

      while (pending) {
        const result = await poll();
        switch (result.type) {
          case "error": {
            setState({
              status: "error",
              renderId: renderId,
              error: new Error(result.message),
            });
            pending = false;
            break;
          }
          case "done": {
            setState({
              size: result.size,
              url: result.url,
              status: "done",
            });
            pending = false;
            break;
          }
          case "progress": {
            setState({
              status: "rendering",
              progress: result.progress,
              renderId: renderId,
            });
            await wait(1000);
          }
        }
      }
    } catch (err) {
      setState({
        status: "error",
        error: err as Error,
        renderId: null,
      });
    }
  }, [mode, id, inputProps, resolution]);

  const undo = useCallback(() => {
    setState({ status: "init" });
  }, []);

  return useMemo(() => {
    return {
      renderMedia,
      state,
      undo,
    };
  }, [renderMedia, state, undo]);
};
