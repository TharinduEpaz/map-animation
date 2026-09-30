import { ActionFunction } from "react-router";
import { errorAsJson } from "./lib/return-error-as-json";
import { getLocalRenderJob } from "./lib/render-local.server";
import { LocalProgressRequest, ProgressResponse } from "./remotion/schemata";

export const action: ActionFunction = errorAsJson(
  async ({ request }): Promise<ProgressResponse> => {
    const { id } = LocalProgressRequest.parse(await request.json());
    const job = getLocalRenderJob(id);
    if (!job) {
      return { type: "error", message: `No local render with id ${id}` };
    }

    if (job.type === "progress") {
      return { type: "progress", progress: Math.max(0.03, job.progress) };
    }

    if (job.type === "done") {
      return { type: "done", url: job.url, size: job.size };
    }

    return { type: "error", message: job.message };
  },
);
