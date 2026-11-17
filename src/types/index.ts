export type ProviderId = "meshy" | "tripo" | "demo";

export type QualityTier = "low" | "medium" | "high" | "ultra";

export type ExportFormat = "glb" | "gltf" | "obj" | "fbx" | "stl" | "usdz";

export type JobStatus = "idle" | "uploading" | "queued" | "processing" | "succeeded" | "failed" | "canceled";

export interface ConversionJob {
  id: string;
  provider: ProviderId;
  status: JobStatus;
  progress: number; // 0-100
  createdAt: number;
  imageName?: string;
  imagePreview?: string; // data url
  modelUrl?: string; // primary glb url
  modelUrls?: Partial<Record<ExportFormat, string>>;
  thumbnailUrl?: string;
  thumbnailUrls?: { front?: string; right?: string; back?: string; left?: string };
  textureUrls?: Array<{
    base_color?: string;
    metallic?: string;
    normal?: string;
    roughness?: string;
    emission?: string;
  }>;
  consumedCredits?: number;
  error?: string;
  remoteTaskId?: string;
  // local blob urls after download
  localModelBlobUrl?: string;
}

export interface ProviderSettings {
  meshyApiKey: string;
  tripoApiKey: string;
  defaultProvider: ProviderId;
  defaultQuality: QualityTier;
}

export interface MeshyCreateParams {
  imageUrl: string; // data uri or url
  quality: QualityTier;
  enablePbr: boolean;
  shouldTexture: boolean;
  targetFormats: ExportFormat[];
  poseMode?: "a-pose" | "t-pose";
}

export interface MeshyTaskResponse {
  id: string;
  type: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";
  progress: number;
  model_urls?: Record<string, string>;
  thumbnail_url?: string;
  thumbnail_urls?: { front?: string; right?: string; back?: string; left?: string };
  texture_urls?: Array<Record<string, string>>;
  task_error?: { message?: string } | null;
  consumed_credits?: number;
  created_at?: number;
  finished_at?: number;
}

export interface EditorState {
  // transform
  position: [number, number, number];
  rotation: [number, number, number]; // radians
  scale: number;
  // material
  wireframe: boolean;
  flatShading: boolean;
  materialColor: string | null; // null = original
  metalness: number;
  roughness: number;
  // view
  showGrid: boolean;
  showAxes: boolean;
  autoRotate: boolean;
  background: "studio" | "dark" | "light" | "transparent";
  // lighting
  keyLightIntensity: number;
  ambientIntensity: number;
  // simplification for export
  exportQuality: QualityTier;
}

export const QUALITY_PRESETS: Record<
  QualityTier,
  { label: string; description: string; meshy: { geometry_resolution: "standard" | "2k" | "4k"; target_polycount: number; texture_resolution: "2k" | "4k" | "8k"; decimation_mode?: 1 | 2 | 3 | 4 } }
> = {
  low: {
    label: "Low",
    description: "Fast, small file. Great for web/preview.",
    meshy: { geometry_resolution: "standard", target_polycount: 5000, texture_resolution: "2k", decimation_mode: 4 },
  },
  medium: {
    label: "Medium",
    description: "Balanced quality and size.",
    meshy: { geometry_resolution: "standard", target_polycount: 30000, texture_resolution: "2k", decimation_mode: 3 },
  },
  high: {
    label: "High",
    description: "Detailed mesh, 4K textures.",
    meshy: { geometry_resolution: "2k", target_polycount: 100000, texture_resolution: "4k", decimation_mode: 2 },
  },
  ultra: {
    label: "Ultra",
    description: "Maximum detail. Largest file.",
    meshy: { geometry_resolution: "4k", target_polycount: 300000, texture_resolution: "8k", decimation_mode: 1 },
  },
};

export const FORMAT_INFO: Record<ExportFormat, { label: string; mime: string; ext: string }> = {
  glb: { label: "GLB (Binary glTF)", mime: "model/gltf-binary", ext: "glb" },
  gltf: { label: "glTF (JSON)", mime: "model/gltf+json", ext: "gltf" },
  obj: { label: "OBJ", mime: "text/plain", ext: "obj" },
  fbx: { label: "FBX", mime: "application/octet-stream", ext: "fbx" },
  stl: { label: "STL", mime: "model/stl", ext: "stl" },
  usdz: { label: "USDZ", mime: "model/vnd.usdz+zip", ext: "usdz" },
};

export const PROVIDER_INFO: Record<ProviderId, { name: string; description: string; signupUrl: string; keyPlaceholder: string }> = {
  meshy: {
    name: "Meshy AI",
    description: "Best-in-class image-to-3D with PBR textures, multi-format export.",
    signupUrl: "https://www.meshy.ai/settings/api",
    keyPlaceholder: "msy_...",
  },
  tripo: {
    name: "Tripo AI",
    description: "Fast, high-quality generation. Alternative provider.",
    signupUrl: "https://platform.tripo3d.ai/",
    keyPlaceholder: "tsk_...",
  },
  demo: {
    name: "Demo (no key)",
    description: "Loads a sample model so you can try the viewer/exporter.",
    signupUrl: "",
    keyPlaceholder: "",
  },
};
