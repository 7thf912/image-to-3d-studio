import type { StartConversionInput, StartConversionResult, TaskStatusResult } from "./types";
import { QUALITY_PRESETS } from "@/types";

const MESHY_BASE = "https://api.meshy.ai/openapi/v1";

export async function meshyStart(input: StartConversionInput): Promise<StartConversionResult> {
  const preset = QUALITY_PRESETS[input.quality].meshy;
  const body: Record<string, unknown> = {
    image_url: input.imageDataUrl,
    ai_model: "meshy-7.1",
    geometry_resolution: preset.geometry_resolution,
    should_texture: input.shouldTexture,
    enable_pbr: input.enablePbr,
    target_polycount: preset.target_polycount,
    texture_resolution: preset.texture_resolution,
    decimation_mode: preset.decimation_mode,
    should_remesh: true,
    save_pre_remeshed_model: true,
    topology: "triangle",
    target_formats: input.targetFormats.length ? input.targetFormats : ["glb", "obj", "fbx", "stl", "usdz"],
    image_enhancement: true,
    remove_lighting: true,
  };
  if (input.poseMode) body.pose_mode = input.poseMode;

  const res = await fetch(`${MESHY_BASE}/image-to-3d`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Meshy create failed (${res.status}): ${text}`);
  }
  const json = JSON.parse(text);
  if (!json.result) throw new Error("Meshy did not return a task id");
  return { taskId: json.result, provider: "meshy" };
}

export async function meshyStatus(apiKey: string, taskId: string): Promise<TaskStatusResult> {
  const res = await fetch(`${MESHY_BASE}/image-to-3d/${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Meshy status failed (${res.status}): ${text}`);
  }
  const j = JSON.parse(text);
  const modelUrls: Record<string, string> = {};
  if (j.model_urls) {
    for (const [k, v] of Object.entries(j.model_urls)) {
      if (typeof v === "string") modelUrls[k] = v;
    }
  }
  return {
    status: j.status,
    progress: j.progress ?? 0,
    modelUrls,
    thumbnailUrl: j.thumbnail_url,
    thumbnailUrls: j.thumbnail_urls,
    textureUrls: j.texture_urls,
    error: j.task_error?.message,
    consumedCredits: j.consumed_credits,
  };
}
