"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { PROVIDER_INFO } from "@/types";
import type { ProviderId, QualityTier } from "@/types";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const [local, setLocal] = useState(settings);

  useEffect(() => {
    if (open) setLocal(settings);
  }, [open, settings]);

  if (!open) return null;

  const save = () => {
    setSettings(local);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="card w-full max-w-lg p-6 flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="title-arabic text-lg">الإعدادات</div>
            <button className="btn btn-ghost" onClick={onClose}>✕</button>
          </div>
          <div className="arch-divider" />

          <div className="flex flex-col gap-3">
            <div>
              <div className="label mb-1">مفتاح Meshy AI</div>
              <input
                className="input"
                type="password"
                placeholder={PROVIDER_INFO.meshy.keyPlaceholder}
                value={local.meshyApiKey}
                onChange={(e) => setLocal({ ...local, meshyApiKey: e.target.value })}
              />
              <div className="text-[10px] text-[var(--text-3)] mt-1">
                احصل على مفتاح: <a className="text-[var(--gold-light)]" href={PROVIDER_INFO.meshy.signupUrl} target="_blank" rel="noreferrer">{PROVIDER_INFO.meshy.signupUrl}</a>
              </div>
            </div>
            <div>
              <div className="label mb-1">مفتاح Tripo AI</div>
              <input
                className="input"
                type="password"
                placeholder={PROVIDER_INFO.tripo.keyPlaceholder}
                value={local.tripoApiKey}
                onChange={(e) => setLocal({ ...local, tripoApiKey: e.target.value })}
              />
              <div className="text-[10px] text-[var(--text-3)] mt-1">
                احصل على مفتاح: <a className="text-[var(--gold-light)]" href={PROVIDER_INFO.tripo.signupUrl} target="_blank" rel="noreferrer">{PROVIDER_INFO.tripo.signupUrl}</a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="label mb-1">المزوّد الافتراضي</div>
                <select className="input" value={local.defaultProvider} onChange={(e) => setLocal({ ...local, defaultProvider: e.target.value as ProviderId })}>
                  <option value="meshy">Meshy AI</option>
                  <option value="tripo">Tripo AI</option>
                  <option value="demo">تجريبي</option>
                </select>
              </div>
              <div>
                <div className="label mb-1">الجودة الافتراضية</div>
                <select className="input" value={local.defaultQuality} onChange={(e) => setLocal({ ...local, defaultQuality: e.target.value as QualityTier })}>
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="ultra">فائقة</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button className="btn" onClick={onClose}>إلغاء</button>
            <button className="btn btn-primary" onClick={save}>حفظ</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
