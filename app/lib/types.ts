import type { AwsRegion } from "@remotion/lambda";

export type RenderResponse = {
  renderId: string;
  bucketName: string;
  functionName: string;
  region: AwsRegion;
};
