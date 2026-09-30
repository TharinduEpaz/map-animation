import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { randomUUID } from "node:crypto";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import type { ProgressResponse, RouteMapProps } from "~/remotion/schemata";

const OUT_DIR = path.resolve("out/local-renders");
const ENTRY_POINT = path.resolve("app/remotion/index.ts");
const BUNDLE_WEIGHT = 0.1;

type Job = ProgressResponse & { filePath: string };

// Kept on globalThis so jobs survive Vite dev-server module reloads.
const jobs: Map<string, Job> = ((
  globalThis as { __localRenderJobs?: Map<string, Job> }
).__localRenderJobs ??= new Map());

export const getLocalRenderOutputPath = (renderId: string) =>
  path.join(OUT_DIR, `${renderId}.mp4`);

export const getLocalRenderJob = (renderId: string) => jobs.get(renderId);

export const startLocalRender = ({
  composition,
  inputProps,
  scale,
}: {
  composition: string;
  inputProps: RouteMapProps;
  scale: number;
}): { renderId: string } => {
  const renderId = randomUUID();
  const filePath = getLocalRenderOutputPath(renderId);
  jobs.set(renderId, { type: "progress", progress: 0, filePath });

  const setProgress = (progress: number) =>
    jobs.set(renderId, { type: "progress", progress, filePath });

  const run = async () => {
    await mkdir(OUT_DIR, { recursive: true });

    // Rebundled per render so edits to compositions are picked up without a restart.
    const serveUrl = await bundle({
      entryPoint: ENTRY_POINT,
      rspack: true,
      onProgress: (p) => setProgress((p / 100) * BUNDLE_WEIGHT),
    });

    const chromiumOptions = { gl: "angle" as const };
    const timeoutInMilliseconds = 120_000;

    const selected = await selectComposition({
      serveUrl,
      id: composition,
      inputProps,
      chromiumOptions,
      timeoutInMilliseconds,
    });

    await renderMedia({
      composition: selected,
      serveUrl,
      codec: "h264",
      inputProps,
      outputLocation: filePath,
      scale,
      chromiumOptions,
      timeoutInMilliseconds,
      onProgress: ({ progress }) =>
        setProgress(BUNDLE_WEIGHT + progress * (1 - BUNDLE_WEIGHT)),
    });

    const { size } = await stat(filePath);
    jobs.set(renderId, {
      type: "done",
      url: `/api/local/file/${renderId}`,
      size,
      filePath,
    });
  };

  run().catch((err: Error) => {
    jobs.set(renderId, { type: "error", message: err.message, filePath });
  });

  return { renderId };
};
