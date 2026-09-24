import { AlignEnd } from "./AlignEnd";
import { Button } from "./Button";
import { InputContainer } from "./InputContainer";
import { DownloadButton } from "./DownloadButton";
import { ErrorComp } from "./Error";
import { ProgressBar } from "./ProgressBar";
import { Spacing } from "./Spacing";
import { useRendering } from "../lib/use-rendering";
import { RouteMapProps } from "~/remotion/schemata";

export const RenderControls: React.FC<{
  compositionId: string;
  inputProps: RouteMapProps;
}> = ({ compositionId, inputProps }) => {
  const { renderMedia, state, undo } = useRendering(
    compositionId,
    inputProps,
  );

  return (
    <InputContainer>
      {state.status === "init" ||
      state.status === "invoking" ||
      state.status === "error" ? (
        <>
          <AlignEnd>
            <Button
              disabled={state.status === "invoking"}
              loading={state.status === "invoking"}
              onClick={renderMedia}
            >
              Render video
            </Button>
          </AlignEnd>
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
