export interface StartConversionInput {
  provider: string;
  apiKey: string;
  imageDataUrl: string; // data:image/...;base64,...
  quality: "low" | "medium" | "high" | "ultra";
  enablePbr: boolean;
  shouldTexture: boolean;
  targetFormats: string[];
  poseMode?: "a-pose" | "t-pose";
}

export interface StartConversionResult {
  taskId: string;
  provider: string;
}

export interface TaskStatusResult {
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";
  progress: number;
  modelUrls?: Record<string, string>;
  thumbnailUrl?: string;
  thumbnailUrls?: { front?: string; right?: string; back?: string; left?: string };
  textureUrls?: Array<Record<string, string>>;
  error?: string;
  consumedCredits?: number;
}
