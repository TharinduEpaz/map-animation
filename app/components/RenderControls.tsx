import { AlignEnd } from "./AlignEnd";
import { Button } from "./Button";
import { InputContainer } from "./InputContainer";
import { DownloadButton } from "./DownloadButton";
import { ErrorComp } from "./Error";
import { ProgressBar } from "./ProgressBar";
import { Spacing } from "./Spacing";
import { SegmentedControl } from "./SegmentedControl";
import { RenderMode, useRendering } from "../lib/use-rendering";
import { Resolution, RouteMapProps } from "~/remotion/schemata";
import { useState } from "react";

const renderModes = [
  { value: "local", label: "Local machine" },
  { value: "lambda", label: "Cloud Render (PRO)" },
] as const;

const resolutions = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
  { value: "2k", label: "2K" },
  { value: "4k", label: "4K" },
] as const;

export const RenderControls: React.FC<{
  compositionId: string;
  inputProps: RouteMapProps;
  cloudRenderEnabled: boolean;
}> = ({ compositionId, inputProps, cloudRenderEnabled }) => {
  const [mode, setMode] = useState<RenderMode>("local");
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const { renderMedia, state, undo } = useRendering(
    mode,
    compositionId,
    inputProps,
    resolution,
  );

  return (
    <InputContainer>
      {state.status === "init" ||
      state.status === "invoking" ||
      state.status === "error" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              {cloudRenderEnabled ? (
                <SegmentedControl
                  options={renderModes}
                  value={mode}
                  onChange={setMode}
                  disabled={state.status === "invoking"}
                />
              ) : null}
              <SegmentedControl
                options={resolutions}
                value={resolution}
                onChange={setResolution}
                disabled={state.status === "invoking"}
              />
            </div>
            <Button
              disabled={state.status === "invoking"}
              loading={state.status === "invoking"}
              onClick={renderMedia}
            >
              Render video
            </Button>
          </div>
          {state.status === "error" ? (
            <ErrorComp message={state.error.message}></ErrorComp>
          ) : null}
        </>
      ) : null}
      {state.status === "rendering" || state.status === "done" ? (
        <>
          <ProgressBar
            progress={state.status === "rendering" ? state.progress : 1}
          />
          <Spacing></Spacing>
          <AlignEnd>
            <DownloadButton undo={undo} state={state}></DownloadButton>
          </AlignEnd>
        </>
      ) : null}
    </InputContainer>
  );
};
