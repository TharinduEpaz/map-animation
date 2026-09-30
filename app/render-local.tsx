import { ActionFunction } from "react-router";
import { errorAsJson } from "./lib/return-error-as-json";
import { startLocalRender } from "./lib/render-local.server";
import { RenderRequest, RESOLUTION_SCALES } from "./remotion/schemata";

export const action: ActionFunction = errorAsJson(async ({ request }) => {
  const { id, inputProps, resolution } = RenderRequest.parse(
    await request.json(),
  );
  return startLocalRender({
    composition: id,
    inputProps,
    scale: RESOLUTION_SCALES[resolution],
  });
});
