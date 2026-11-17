"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ConversionJob,
  ProviderSettings,
  EditorState,
  QualityTier,
  ProviderId,
  JobStatus,
} from "@/types";

interface AppState {
  // settings
  settings: ProviderSettings;
  setSettings: (s: Partial<ProviderSettings>) => void;

  // jobs
  jobs: ConversionJob[];
  activeJobId: string | null;
  setActiveJob: (id: string | null) => void;
  addJob: (job: ConversionJob) => void;
  updateJob: (id: string, patch: Partial<ConversionJob>) => void;
  removeJob: (id: string) => void;
  clearJobs: () => void;

  // editor
  editor: EditorState;
  setEditor: (patch: Partial<EditorState>) => void;
  resetEditor: () => void;

  // ui
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
}

const defaultEditor: EditorState = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 1,
  wireframe: false,
  flatShading: false,
  materialColor: null,
  metalness: 0.2,
  roughness: 0.6,
  showGrid: true,
  showAxes: false,
  autoRotate: false,
  background: "studio",
  keyLightIntensity: 1.4,
  ambientIntensity: 0.6,
  exportQuality: "high",
};

const defaultSettings: ProviderSettings = {
  meshyApiKey: "",
  tripoApiKey: "",
  defaultProvider: "meshy",
  defaultQuality: "high",
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),

      jobs: [],
      activeJobId: null,
      setActiveJob: (id) => set({ activeJobId: id }),
      addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs].slice(0, 50) })),
      updateJob: (id, patch) =>
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
        })),
      removeJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== id),
          activeJobId: state.activeJobId === id ? null : state.activeJobId,
        })),
      clearJobs: () => set({ jobs: [], activeJobId: null }),

      editor: defaultEditor,
      setEditor: (patch) => set((state) => ({ editor: { ...state.editor, ...patch } })),
      resetEditor: () => set({ editor: { ...defaultEditor } }),

      sidebarOpen: true,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      settingsOpen: false,
      setSettingsOpen: (v) => set({ settingsOpen: v }),
    }),
    {
      name: "image-to-3d-studio",
      partialize: (state) => ({
        settings: state.settings,
        jobs: state.jobs.map((j) => ({
          ...j,
          // don't persist blob urls
          localModelBlobUrl: undefined,
          imagePreview: j.imagePreview,
        })),
        editor: state.editor,
      }),
    }
  )
);

export const newJobId = () => `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export type { JobStatus, QualityTier, ProviderId };
