import { z } from "zod";
import {
  LocalProgressRequest,
  ProgressRequest,
  ProgressResponse,
  RenderRequest,
} from "~/remotion/schemata";
import { RenderResponse } from "./types";

export type ApiResponse<Res> =
  | {
      type: "error";
      message: string;
    }
  | {
      type: "success";
      data: Res;
    };

const makeRequest = async <Res>(
  endpoint: string,
  body: unknown,
): Promise<Res> => {
  const result = await fetch(endpoint, {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
  const json = (await result.json()) as ApiResponse<Res>;
  if (json.type === "error") {
    throw new Error(json.message);
  }

  return json.data;
};

export const renderVideo = async (body: z.infer<typeof RenderRequest>) => {
  return makeRequest<RenderResponse>("/api/lambda/render", body);
};

export const renderVideoLocal = async (
  body: z.infer<typeof RenderRequest>,
) => {
  return makeRequest<{ renderId: string }>("/api/local/render", body);
};

export const getLocalProgress = async ({ id }: { id: string }) => {
  const body: z.infer<typeof LocalProgressRequest> = { id };

  return makeRequest<ProgressResponse>("/api/local/progress", body);
};

export const getProgress = async ({
  id,
  bucketName,
}: {
  id: string;
  bucketName: string;
}) => {
  const body: z.infer<typeof ProgressRequest> = {
    id,
    bucketName,
  };

  return makeRequest<ProgressResponse>("/api/lambda/progress", body);
};
