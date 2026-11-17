"use client";

import { useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { exportModel, fetchModelScene } from "@/lib/exporter";
import type { ExportFormat, QualityTier } from "@/types";
import { FORMAT_INFO, QUALITY_PRESETS } from "@/types";

const FORMATS: ExportFormat[] = ["glb", "gltf", "obj", "stl", "usdz"];

interface ExportPanelProps {
  scene: THREE.Group | null;
  modelUrl: string | null;
  modelUrls?: Partial<Record<ExportFormat, string>>;
  jobName: string;
}

export function ExportPanel({ scene, modelUrl, modelUrls, jobName }: ExportPanelProps) {
  const editor = useAppStore((s) => s.editor);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setError(null);
    setBusy(format);
    try {
      let s = scene;
      if (!s && modelUrl) {
        s = await fetchModelScene(modelUrl);
      }
      if (!s) throw new Error("لا يوجد نموذج محمّل");
      await exportModel({
        scene: s,
        format,
        quality: editor.exportQuality,
        editor,
        filename: `${jobName || "model"}.${FORMAT_INFO[format].ext}`,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const formatLabels: Record<ExportFormat, string> = {
    glb: "GLB (ثنائي glTF)",
    gltf: "glTF (JSON)",
    obj: "OBJ",
    fbx: "FBX",
    stl: "STL",
    usdz: "USDZ",
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="label">التصدير</div>
      <div className="arch-divider" />
      <div className="text-xs text-[var(--text-3)]">
        الجودة: <span className="text-[var(--gold-light)]">{QUALITY_PRESETS[editor.exportQuality].label === "Low" ? "منخفضة" : QUALITY_PRESETS[editor.exportQuality].label === "Medium" ? "متوسطة" : QUALITY_PRESETS[editor.exportQuality].label === "High" ? "عالية" : "فائقة"}</span>
      </div>
      {error && <div className="text-xs text-[var(--danger)]">{error}</div>}
      <div className="grid grid-cols-2 gap-2">
        {FORMATS.map((f) => (
          <motion.button
            key={f}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn text-xs"
            disabled={busy !== null}
            onClick={() => handleExport(f)}
          >
            {busy === f ? <span className="spinner" /> : null}
            {formatLabels[f]}
          </motion.button>
        ))}
      </div>
      {modelUrls && Object.keys(modelUrls).length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <div className="label">ملفات أصلية من المزوّد</div>
          <div className="arch-divider" />
          <div className="flex flex-wrap gap-2">
            {Object.entries(modelUrls).map(([fmt, url]) => (
              <a key={fmt} href={url} target="_blank" rel="noreferrer" download className="btn text-xs">
                {fmt.toUpperCase()}
              </a>
            ))}
          </div>
          <div className="text-[10px] text-[var(--text-3)]">
            ملفات أصلية (أعلى جودة، بدون تعديلات).
          </div>
        </div>
      )}
      <div className="text-[10px] text-[var(--text-3)]">
        التصدير المُحرَّر يشمل التحويل والمادة والتبسيط للجودات المنخفضة.
      </div>
    </div>
  );
}
