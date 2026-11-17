"use client";

import { useCallback, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { useAppStore } from "@/lib/store";
import type { ProviderId, QualityTier } from "@/types";
import { PROVIDER_INFO } from "@/types";

interface UploadPanelProps {
  onConvert: (file: File, provider: ProviderId, quality: QualityTier) => void;
  busy: boolean;
}

export function UploadPanel({ onConvert, busy }: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderId>("meshy");
  const [quality, setQuality] = useState<QualityTier>("high");
  const settings = useAppStore((s) => s.settings);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    const r = new FileReader();
    r.onload = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  useEffect(() => {
    setProvider(settings.defaultProvider);
    setQuality(settings.defaultQuality);
  }, [settings.defaultProvider, settings.defaultQuality]);

  const handleConvert = () => {
    if (!file) return;
    onConvert(file, provider, quality);
  };

  const providerNames: Record<ProviderId, string> = {
    meshy: "Meshy AI",
    tripo: "Tripo AI",
    demo: "وضع تجريبي (بدون مفتاح)",
  };

  return (
    <div className="flex flex-col gap-3">
      <motion.div
        {...(getRootProps() as any)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`dropzone p-4 cursor-pointer ${isDragActive ? "active" : ""}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="معاينة" className="max-h-40 rounded-lg object-contain border border-[var(--border-gold)]" />
            <div className="text-xs text-[var(--text-3)]">{file?.name} · {((file?.size || 0) / 1024).toFixed(0)} كيلوبايت</div>
          </motion.div>
        ) : (
          <div className="text-center py-6">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              className="text-4xl mb-2 text-[var(--gold)]"
            >
              ⬆
            </motion.div>
            <div className="text-sm text-[var(--text-2)]">أسقط الصورة هنا</div>
            <div className="text-xs text-[var(--text-3)] mt-1">PNG, JPG, WebP · حتى 20MB</div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="label mb-1">المزوّد</div>
          <select className="input" value={provider} onChange={(e) => setProvider(e.target.value as ProviderId)}>
            <option value="meshy">Meshy AI</option>
            <option value="tripo">Tripo AI</option>
            <option value="demo">تجريبي</option>
          </select>
        </div>
        <div>
          <div className="label mb-1">الجودة</div>
          <select className="input" value={quality} onChange={(e) => setQuality(e.target.value as QualityTier)}>
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
            <option value="ultra">فائقة</option>
          </select>
        </div>
      </div>

      <div className="text-xs text-[var(--text-3)]">
        {PROVIDER_INFO[provider].description}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn btn-primary w-full"
        disabled={!file || busy}
        onClick={handleConvert}
      >
        {busy ? <><span className="spinner" /> جارٍ التحويل…</> : "تحويل إلى 3D"}
      </motion.button>

      {preview && (
        <button className="btn btn-ghost text-xs" onClick={() => { setFile(null); setPreview(null); }}>
          مسح
        </button>
      )}
    </div>
  );
}
