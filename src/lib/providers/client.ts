import { meshyStart, meshyStatus } from "./meshy";
import { tripoStart, tripoStatus } from "./tripo";
import type { StartConversionInput, TaskStatusResult, StartConversionResult } from "./types";

export async function startConversion(input: StartConversionInput): Promise<StartConversionResult> {
  if (input.provider === "demo") {
    return { taskId: "demo", provider: "demo" };
  }
  if (input.provider === "meshy") return meshyStart(input);
  if (input.provider === "tripo") return tripoStart(input);
  throw new Error(`Unknown provider: ${input.provider}`);
}

export async function getStatus(provider: string, apiKey: string, taskId: string): Promise<TaskStatusResult> {
  if (provider === "demo") {
    return {
      status: "SUCCEEDED",
      progress: 100,
      modelUrls: {
        glb: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
      },
      thumbnailUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/screenshot/screenshot.png",
    };
  }
  if (provider === "meshy") return meshyStatus(apiKey, taskId);
  if (provider === "tripo") return tripoStatus(apiKey, taskId);
  throw new Error(`Unknown provider: ${provider}`);
}
