import { ActionFunction } from "react-router";
import { renderVideo } from "./lib/render-video.server";
import { SITE_NAME } from "./remotion/constants.mjs";
import { errorAsJson } from "./lib/return-error-as-json";
import { RenderRequest } from "./remotion/schemata";

export const action: ActionFunction = errorAsJson(async ({ request }) => {
  const formData = await request.json();
  const { id, inputProps } = RenderRequest.parse(formData);

  const renderData = await renderVideo({
    serveUrl: SITE_NAME,
    composition: id,
    inputProps,
    outName: `map-animation.mp4`,
    metadata: null,
  });

  return renderData;
});
