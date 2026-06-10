import type { DeepPartial, VideoProject } from "../../types";

export interface StepProps {
  video: VideoProject;
  patch: (p: DeepPartial<VideoProject>) => void;
}
