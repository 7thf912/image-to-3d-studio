"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { useAppStore } from "@/lib/store";
import { newJobId } from "@/lib/store";
import { proxyUrl } from "@/lib/exporter";
import { startConversion, getStatus } from "@/lib/providers/client";
import { UploadPanel } from "@/components/upload/UploadPanel";
import { JobList } from "@/components/jobs/JobList";
import { ModelViewer } from "@/components/viewer/ModelViewer";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { ExportPanel } from "@/components/export/ExportPanel";
import { SettingsModal } from "@/components/settings/SettingsModal";
import type { ConversionJob, ProviderId, QualityTier } from "@/types";

const POLL_INTERVAL = 3000;

export default function Home() {
  const jobs = useAppStore((s) => s.jobs);
  const activeJobId = useAppStore((s) => s.activeJobId);
  const setActiveJob = useAppStore((s) => s.setActiveJob);
  const addJob = useAppStore((s) => s.addJob);
  const updateJob = useAppStore((s) => s.updateJob);
  const editor = useAppStore((s) => s.editor);
  const settings = useAppStore((s) => s.settings);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scene, setScene] = useState<THREE.Group | null>(null);

  const activeJob = jobs.find((j) => j.id === activeJobId) || null;

  const pollOne = useCallback(async (job: ConversionJob) => {
    if (!job.remoteTaskId) return;
    const st = useAppStore.getState();
    const apiKey =
      job.provider === "meshy" ? st.settings.meshyApiKey :
      job.provider === "tripo" ? st.settings.tripoApiKey : "";
    try {
      const data = await getStatus(job.provider, apiKey, job.remoteTaskId);
      const status = data.status;
      const mapped =
        status === "SUCCEEDED" ? "succeeded" :
        status === "FAILED" ? "failed" :
        status === "CANCELED" ? "canceled" :
        status === "PENDING" ? "queued" : "processing";
      st.updateJob(job.id, {
        status: mapped as ConversionJob["status"],
        progress: data.progress ?? job.progress,
        modelUrl: data.modelUrls?.glb || data.modelUrls?.model || job.modelUrl,
        modelUrls: data.modelUrls,
        thumbnailUrl: data.thumbnailUrl,
        thumbnailUrls: data.thumbnailUrls,
        textureUrls: data.textureUrls,
        consumedCredits: data.consumedCredits,
        error: data.error,
      });
    } catch (e: unknown) {
      st.updateJob(job.id, { status: "failed", error: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      const st = useAppStore.getState();
      const pending = st.jobs.filter((j) => (j.status === "queued" || j.status === "processing" || j.status === "uploading") && j.remoteTaskId && j.provider !== "demo");
      pending.forEach((j) => pollOne(j));
    };
    const id = setInterval(tick, POLL_INTERVAL);
    tick();
    return () => clearInterval(id);
  }, [pollOne]);

  useEffect(() => {
    setScene(null);
  }, [activeJobId]);

  const handleConvert = useCallback(async (file: File, provider: ProviderId, quality: QualityTier) => {
    setError(null);
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const job: ConversionJob = {
        id: newJobId(),
        provider,
        status: "uploading",
        progress: 0,
        createdAt: Date.now(),
        imageName: file.name,
        imagePreview: dataUrl,
      };
      addJob(job);
      setActiveJob(job.id);

      const apiKey =
        provider === "meshy" ? settings.meshyApiKey :
        provider === "tripo" ? settings.tripoApiKey : "";

      try {
        const data = await startConversion({
          provider,
          apiKey,
          imageDataUrl: dataUrl,
          quality,
          enablePbr: true,
          shouldTexture: true,
          targetFormats: ["glb", "obj", "fbx", "stl", "usdz"],
        });
        updateJob(job.id, {
          status: provider === "demo" ? "processing" : "queued",
          progress: provider === "demo" ? 100 : 0,
          remoteTaskId: data.taskId,
        });
        if (provider === "demo") {
          updateJob(job.id, {
            status: "succeeded",
            progress: 100,
            modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
            modelUrls: { glb: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb" },
          });
        }
        setBusy(false);
      } catch (e: unknown) {
        updateJob(job.id, { status: "failed", error: e instanceof Error ? e.message : String(e) });
        setError(e instanceof Error ? e.message : String(e));
        setBusy(false);
      }
    };
    reader.readAsDataURL(file);
  }, [settings, addJob, setActiveJob, updateJob]);

  const handleReady = useCallback((s: THREE.Group) => {
    setScene(s);
  }, []);

  const viewerUrl = activeJob?.modelUrl ? proxyUrl(activeJob.modelUrl) : null;

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      idle: "خامل", uploading: "رفع", queued: "في الانتظار", processing: "معالجة",
      succeeded: "مكتمل", failed: "فشل", canceled: "ملغى",
    };
    return map[s] || s;
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="h-16 flex items-center justify-between px-6 glass relative overflow-hidden"
      >
        <div className="pattern-mashrabiya absolute inset-0 opacity-40 pointer-events-none" />
        <div className="flex items-center gap-4 relative">
          <div className="medallion text-lg">✦</div>
          <div>
            <div className="title-arabic text-xl">استوديو صورة إلى ثلاثي الأبعاد</div>
            <div className="text-[11px] text-[var(--text-3)]">مولد نماذج 3D احترافي بالذكاء الاصطناعي</div>
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          {activeJob && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="badge"
            >
              <span className="pulse" style={{ color: "var(--gold)" }}>●</span>
              {statusLabel(activeJob.status)}
              {activeJob.status === "processing" && ` · ${activeJob.progress}٪`}
            </motion.span>
          )}
          <button className="btn" onClick={() => setSettingsOpen(true)}>⚙ الإعدادات</button>
        </div>
      </motion.header>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 py-2 bg-[rgba(224,122,95,0.12)] border-b border-[var(--danger)] text-[var(--danger)] text-xs flex justify-between"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 grid grid-cols-[320px_1fr_340px] gap-3 p-3 min-h-0">
        <motion.aside
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col gap-3 min-h-0"
        >
          <div className="card p-4 flex flex-col gap-3 min-h-0 overflow-auto pattern-khatam">
            <div className="label">رفع الصورة</div>
            <div className="arch-divider" />
            <UploadPanel onConvert={handleConvert} busy={busy} />
          </div>
          <div className="card p-4 flex-1 min-h-0 overflow-auto">
            <div className="label mb-2">السجل</div>
            <div className="arch-divider" />
            <JobList />
          </div>
        </motion.aside>

        <motion.main
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="min-h-0 flex flex-col gap-3"
        >
          <div className="flex-1 min-h-0 card p-1 overflow-hidden">
            <ModelViewer modelUrl={viewerUrl} editor={editor} onReady={handleReady} />
          </div>
          {activeJob?.thumbnailUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-2 flex gap-2 overflow-x-auto"
            >
              {activeJob.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeJob.thumbnailUrl} alt="thumb" className="h-16 rounded border border-[var(--border-gold)]" />
              )}
              {activeJob.thumbnailUrls &&
                Object.values(activeJob.thumbnailUrls).map((u, i) =>
                  u ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={u} alt="thumb" className="h-16 rounded border border-[var(--border-gold)]" />
                  ) : null
                )}
            </motion.div>
          )}
        </motion.main>

        <motion.aside
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-3 min-h-0"
        >
          <div className="card p-4 flex-1 min-h-0 overflow-auto">
            <EditorPanel />
          </div>
          <div className="card p-4">
            <ExportPanel scene={scene} modelUrl={activeJob?.modelUrl || null} modelUrls={activeJob?.modelUrls} jobName={activeJob?.imageName || "model"} />
          </div>
        </motion.aside>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
