"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import type { QualityTier, EditorState } from "@/types";

export function EditorPanel() {
  const editor = useAppStore((s) => s.editor);
  const setEditor = useAppStore((s) => s.setEditor);
  const resetEditor = useAppStore((s) => s.resetEditor);

  const Slider = ({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) => (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--text-2)]">{label}</span>
        <span className="text-[var(--text-3)]">{fmt ? fmt(value) : value.toFixed(2)}</span>
      </div>
      <input type="range" className="slider" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between">
        <div className="label">المحرر</div>
        <button className="btn btn-ghost text-xs" onClick={resetEditor}>إعادة تعيين</button>
      </div>

      <div className="card p-3 flex flex-col gap-3">
        <div className="label">التحويل</div>
        <div className="arch-divider" />
        <Slider label="المقياس" value={editor.scale} min={0.1} max={5} step={0.01} onChange={(v) => setEditor({ scale: v })} />
        <Slider label="الموقع X" value={editor.position[0]} min={-5} max={5} step={0.01} onChange={(v) => setEditor({ position: [v, editor.position[1], editor.position[2]] })} />
        <Slider label="الموقع Y" value={editor.position[1]} min={-5} max={5} step={0.01} onChange={(v) => setEditor({ position: [editor.position[0], v, editor.position[2]] })} />
        <Slider label="الموقع Z" value={editor.position[2]} min={-5} max={5} step={0.01} onChange={(v) => setEditor({ position: [editor.position[0], editor.position[1], v] })} />
        <Slider label="دوران X" value={editor.rotation[0]} min={-Math.PI} max={Math.PI} step={0.01} onChange={(v) => setEditor({ rotation: [v, editor.rotation[1], editor.rotation[2]] })} fmt={(v) => `${(v * 180 / Math.PI).toFixed(0)}°`} />
        <Slider label="دوران Y" value={editor.rotation[1]} min={-Math.PI} max={Math.PI} step={0.01} onChange={(v) => setEditor({ rotation: [editor.rotation[0], v, editor.rotation[2]] })} fmt={(v) => `${(v * 180 / Math.PI).toFixed(0)}°`} />
        <Slider label="دوران Z" value={editor.rotation[2]} min={-Math.PI} max={Math.PI} step={0.01} onChange={(v) => setEditor({ rotation: [editor.rotation[0], editor.rotation[1], v] })} fmt={(v) => `${(v * 180 / Math.PI).toFixed(0)}°`} />
      </div>

      <div className="card p-3 flex flex-col gap-3">
        <div className="label">المادة</div>
        <div className="arch-divider" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--text-2)]">لون مخصص</label>
          <input type="color" value={editor.materialColor || "#ffffff"} onChange={(e) => setEditor({ materialColor: e.target.value })} className="w-8 h-6 rounded cursor-pointer bg-transparent border border-[var(--border-gold)]" />
          {editor.materialColor && (
            <button className="btn btn-ghost text-xs" onClick={() => setEditor({ materialColor: null })}>إلغاء</button>
          )}
        </div>
        <Slider label="المعدنية" value={editor.metalness} min={0} max={1} step={0.01} onChange={(v) => setEditor({ metalness: v })} />
        <Slider label="الخشونة" value={editor.roughness} min={0} max={1} step={0.01} onChange={(v) => setEditor({ roughness: v })} />
        <div className="flex gap-2">
          <button className={`btn text-xs flex-1 ${editor.wireframe ? "btn-primary" : ""}`} onClick={() => setEditor({ wireframe: !editor.wireframe })}>إطار سلكي</button>
          <button className={`btn text-xs flex-1 ${editor.flatShading ? "btn-primary" : ""}`} onClick={() => setEditor({ flatShading: !editor.flatShading })}>تسطيح</button>
        </div>
      </div>

      <div className="card p-3 flex flex-col gap-3">
        <div className="label">العرض</div>
        <div className="arch-divider" />
        <div className="flex gap-2">
          <button className={`btn text-xs flex-1 ${editor.showGrid ? "btn-primary" : ""}`} onClick={() => setEditor({ showGrid: !editor.showGrid })}>شبكة</button>
          <button className={`btn text-xs flex-1 ${editor.showAxes ? "btn-primary" : ""}`} onClick={() => setEditor({ showAxes: !editor.showAxes })}>محاور</button>
          <button className={`btn text-xs flex-1 ${editor.autoRotate ? "btn-primary" : ""}`} onClick={() => setEditor({ autoRotate: !editor.autoRotate })}>دوران تلقائي</button>
        </div>
        <div>
          <div className="label mb-1">الخلفية</div>
          <select className="input" value={editor.background} onChange={(e) => setEditor({ background: e.target.value as EditorState["background"] })}>
            <option value="studio">استوديو</option>
            <option value="dark">داكن</option>
            <option value="light">فاتح</option>
            <option value="transparent">شفاف</option>
          </select>
        </div>
        <Slider label="إضاءة رئيسية" value={editor.keyLightIntensity} min={0} max={4} step={0.05} onChange={(v) => setEditor({ keyLightIntensity: v })} />
        <Slider label="إضاءة محيطة" value={editor.ambientIntensity} min={0} max={2} step={0.05} onChange={(v) => setEditor({ ambientIntensity: v })} />
      </div>

      <div className="card p-3 flex flex-col gap-3">
        <div className="label">جودة التصدير</div>
        <div className="arch-divider" />
        <select className="input" value={editor.exportQuality} onChange={(e) => setEditor({ exportQuality: e.target.value as QualityTier })}>
          <option value="low">منخفضة (مبسطة)</option>
          <option value="medium">متوسطة</option>
          <option value="high">عالية (أصلية)</option>
          <option value="ultra">فائقة (أصلية)</option>
        </select>
      </div>
    </div>
  );
}
