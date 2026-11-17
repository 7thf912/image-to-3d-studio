import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
// FBXExporter is not bundled in this three.js version; FBX downloads use the provider's original file.
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";
import { SimplifyModifier } from "three/examples/jsm/modifiers/SimplifyModifier.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ExportFormat, QualityTier, EditorState } from "@/types";
import { FORMAT_INFO } from "@/types";

const SIMPLIFY_RATIO: Record<QualityTier, number> = {
  low: 0.15,
  medium: 0.45,
  high: 1,
  ultra: 1,
};

export function proxyUrl(url: string): string {
  // In static (Surge) builds there is no proxy server; return the URL as-is.
  // Meshy/Tripo asset URLs are served with CORS headers, so direct loading works.
  return url;
}

export async function fetchModelScene(url: string): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      proxyUrl(url),
      (gltf) => resolve(gltf.scene),
      undefined,
      (err) => reject(err)
    );
  });
}

export function applyEditorToScene(scene: THREE.Group, editor: EditorState): THREE.Group {
  const clone = scene.clone(true);
  clone.position.set(...editor.position);
  clone.rotation.set(...editor.rotation);
  clone.scale.setScalar(editor.scale);
  clone.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh && mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const mat = m as THREE.MeshStandardMaterial;
        if (!mat) return;
        mat.wireframe = editor.wireframe;
        mat.flatShading = editor.flatShading;
        if (editor.materialColor) mat.color.set(editor.materialColor);
        mat.metalness = editor.metalness;
        mat.roughness = editor.roughness;
        mat.needsUpdate = true;
      });
    }
  });
  return clone;
}

export async function simplifyScene(scene: THREE.Group, ratio: number): Promise<THREE.Group> {
  if (ratio >= 1) return scene;
  const clone = scene.clone(true);
  const tasks: Promise<void>[] = [];
  clone.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry) {
      const geo = mesh.geometry as THREE.BufferGeometry;
      const vertexCount = geo.attributes.position?.count || 0;
      if (vertexCount > 100) {
        const mod = new SimplifyModifier();
        const target = Math.max(10, Math.floor(vertexCount * ratio));
        tasks.push(
          mod.modify(geo, target).then((simplified) => {
            mesh.geometry = simplified;
          }).catch(() => { /* keep original */ })
        );
      }
    }
  });
  await Promise.all(tasks);
  return clone;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportModel(opts: {
  scene: THREE.Group;
  format: ExportFormat;
  quality: QualityTier;
  editor: EditorState;
  filename: string;
}): Promise<void> {
  const { scene, format, quality, editor, filename } = opts;
  let working = applyEditorToScene(scene, editor);
  const ratio = SIMPLIFY_RATIO[quality];
  if (ratio < 1) working = await simplifyScene(working, ratio);

  // ensure world matrices
  working.updateMatrixWorld(true);

  const baseName = filename.replace(/\.[^.]+$/, "");

  if (format === "glb" || format === "gltf") {
    const exporter = new GLTFExporter();
    const binary = format === "glb";
    return new Promise((resolve, reject) => {
      exporter.parse(
        working,
        (result) => {
          let blob: Blob;
          if (binary) {
            blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
          } else {
            const text = JSON.stringify(result);
            blob = new Blob([text], { type: "model/gltf+json" });
          }
          downloadBlob(blob, `${baseName}.${format === "glb" ? "glb" : "gltf"}`);
          resolve();
        },
        (err) => reject(err),
        { binary }
      );
    });
  }

  if (format === "obj") {
    const exporter = new OBJExporter();
    const result = exporter.parse(working);
    downloadBlob(new Blob([result], { type: "text/plain" }), `${baseName}.obj`);
    return;
  }

  if (format === "stl") {
    const exporter = new STLExporter();
    const result = exporter.parse(working, { binary: true }) as any;
    downloadBlob(new Blob([result], { type: "model/stl" }), `${baseName}.stl`);
    return;
  }

  if (format === "fbx") {
    throw new Error("FBX client export is not available in this build. Use the provider's original FBX download.");
  }

  if (format === "usdz") {
    const exporter = new USDZExporter();
    const result = await exporter.parseAsync(working);
    downloadBlob(new Blob([result as any], { type: "model/vnd.usdz+zip" }), `${baseName}.usdz`);
    return;
  }

  throw new Error(`Unsupported format: ${format}`);
}
