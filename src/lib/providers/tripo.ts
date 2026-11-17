import type { StartConversionInput, StartConversionResult, TaskStatusResult } from "./types";

const TRIPO_BASE = "https://api.tripo3d.ai/v3";

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string; ext: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!m) throw new Error("Invalid data URL");
  const mime = m[1];
  const bin = atob(m[2]);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  return { blob: new Blob([buf], { type: mime }), mime, ext };
}

export async function tripoStart(input: StartConversionInput): Promise<StartConversionResult> {
  // 1. upload image
  const { blob, ext, mime } = dataUrlToBlob(input.imageDataUrl);
  const form = new FormData();
  form.append("file", blob, `input.${ext}`);
  const upRes = await fetch(`${TRIPO_BASE}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${input.apiKey}` },
    body: form,
  });
  const upText = await upRes.text();
  if (!upRes.ok) throw new Error(`Tripo upload failed (${upRes.status}): ${upText}`);
  const upJson = JSON.parse(upText);
  const fileToken = upJson?.data?.file_token;
  if (!fileToken) throw new Error("Tripo did not return a file_token");

  // 2. create task
  const faceLimit =
    input.quality === "low" ? 15000 : input.quality === "medium" ? 50000 : input.quality === "high" ? 150000 : 300000;
  const textureQuality =
    input.quality === "low" ? "standard" : input.quality === "medium" ? "standard" : input.quality === "high" ? "detailed" : "detailed";
  const body = {
    input: fileToken,
    model: "v3.1-20260211",
    texture: input.shouldTexture,
    pbr: input.enablePbr,
    texture_quality: textureQuality,
    face_limit: faceLimit,
    enable_image_autofix: true,
    orientation: "align_image",
  };
  const res = await fetch(`${TRIPO_BASE}/generation/image-to-model`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Tripo create failed (${res.status}): ${text}`);
  const json = JSON.parse(text);
  const taskId = json?.data?.task_id;
  if (!taskId) throw new Error("Tripo did not return a task id");
  return { taskId, provider: "tripo" };
}

export async function tripoStatus(apiKey: string, taskId: string): Promise<TaskStatusResult> {
  const res = await fetch(`${TRIPO_BASE}/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Tripo status failed (${res.status}): ${text}`);
  const json = JSON.parse(text);
  const d = json?.data || {};
  const statusRaw = (d.status || "").toLowerCase();
  let status: TaskStatusResult["status"] = "PENDING";
  if (statusRaw === "queued" || statusRaw === "pending") status = "PENDING";
  else if (statusRaw === "running" || statusRaw === "in_progress") status = "IN_PROGRESS";
  else if (statusRaw === "success" || statusRaw === "succeeded") status = "SUCCEEDED";
  else if (statusRaw === "failed") status = "FAILED";
  else if (statusRaw === "cancelled" || statusRaw === "canceled") status = "CANCELED";

  const modelUrls: Record<string, string> = {};
  const url = d?.output?.model_url;
  if (url) modelUrls.glb = url;
  const rendered = d?.output?.rendered_image_url;

  return {
    status,
    progress: d.progress ?? (status === "SUCCEEDED" ? 100 : 0),
    modelUrls: Object.keys(modelUrls).length ? modelUrls : undefined,
    thumbnailUrl: rendered,
    error: d?.error?.message || d?.message,
    consumedCredits: d?.credits_consumed,
  };
}
