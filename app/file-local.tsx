import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { LoaderFunction } from "react-router";
import { getLocalRenderJob } from "./lib/render-local.server";

export const loader: LoaderFunction = ({ params }) => {
  const job = params.id ? getLocalRenderJob(params.id) : undefined;
  if (!job || job.type !== "done") {
    throw new Response("Not found", { status: 404 });
  }

  const stream = Readable.toWeb(
    createReadStream(job.filePath),
  ) as ReadableStream;

  return new Response(stream, {
    headers: {
      "content-type": "video/mp4",
      "content-length": String(job.size),
      "content-disposition": `attachment; filename="map-animation.mp4"`,
    },
  });
};
