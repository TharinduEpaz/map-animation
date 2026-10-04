import { ActionFunction } from "react-router";
import { renderVideo } from "./lib/render-video.server";
import { SITE_NAME } from "./remotion/constants.mjs";
import { errorAsJson } from "./lib/return-error-as-json";
import { isCloudRenderEnabled } from "./lib/feature-flags.server";
import { RenderRequest, RESOLUTION_SCALES } from "./remotion/schemata";

export const action: ActionFunction = errorAsJson(async ({ request }) => {
  if (!isCloudRenderEnabled()) {
    throw new Error("Cloud rendering is disabled.");
  }

  const formData = await request.json();
  const { id, inputProps, resolution, fps } = RenderRequest.parse(formData);

  const renderData = await renderVideo({
    serveUrl: SITE_NAME,
    composition: id,
    inputProps: { ...inputProps, fps },
    scale: RESOLUTION_SCALES[resolution],
    outName: `map-animation.mp4`,
    metadata: null,
  });

  return renderData;
});
