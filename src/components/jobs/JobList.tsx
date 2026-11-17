"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import type { ConversionJob, JobStatus } from "@/types";

const STATUS_COLOR: Record<JobStatus, string> = {
  idle: "var(--text-3)",
  uploading: "var(--gold)",
  queued: "var(--warn)",
  processing: "var(--turquoise)",
  succeeded: "var(--success)",
  failed: "var(--danger)",
  canceled: "var(--text-3)",
};

const STATUS_LABEL: Record<JobStatus, string> = {
  idle: "خامل", uploading: "رفع", queued: "انتظار", processing: "معالجة",
  succeeded: "مكتمل", failed: "فشل", canceled: "ملغى",
};

export function JobList() {
  const jobs = useAppStore((s) => s.jobs);
  const activeJobId = useAppStore((s) => s.activeJobId);
  const setActiveJob = useAppStore((s) => s.setActiveJob);
  const removeJob = useAppStore((s) => s.removeJob);

  if (!jobs.length) {
    return <div className="text-xs text-[var(--text-3)] text-center py-6">لا توجد تحويلات بعد</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence>
        {jobs.map((job) => (
          <motion.button
            key={job.id}
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setActiveJob(job.id)}
            className={`text-right p-2.5 rounded-lg border transition ${
              activeJobId === job.id
                ? "border-[var(--gold)] bg-[rgba(212,175,55,0.10)] shadow-[0_0_12px_var(--gold-glow)]"
                : "border-[var(--border-gold)] bg-[var(--bg-2)] hover:border-[var(--gold)]"
            }`}
          >
            <div className="flex items-center gap-2">
              {job.imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={job.imagePreview} alt="" className="w-9 h-9 rounded object-cover border border-[var(--border-gold)]" />
              ) : (
                <div className="w-9 h-9 rounded bg-[var(--bg-3)] flex items-center justify-center text-[var(--text-3)]">◇</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{job.imageName || "بدون عنوان"}</div>
                <div className="text-[10px] text-[var(--text-3)] flex items-center gap-1.5 mt-0.5">
                  <span style={{ color: STATUS_COLOR[job.status] }}>●</span>
                  <span>{STATUS_LABEL[job.status]}</span>
                  {job.status === "processing" && <span>· {job.progress}٪</span>}
                </div>
              </div>
              <span
                className="text-[var(--text-3)] hover:text-[var(--danger)] text-xs px-1"
                onClick={(e) => { e.stopPropagation(); removeJob(job.id); }}
              >
                ✕
              </span>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
