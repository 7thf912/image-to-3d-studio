"use client";

import { useRef, useEffect, Suspense, useState, Component, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, useGLTF, Bounds, Center, Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import type { EditorState } from "@/types";

interface ModelViewerProps {
  modelUrl: string | null;
  editor: EditorState;
  onReady?: (scene: THREE.Group) => void;
}

class ViewerErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; msg: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, msg: "" };
  }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, msg: err instanceof Error ? err.message : String(err) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="text-[var(--danger)] text-xs text-center max-w-xs">
            Failed to load model<br />
            <span className="text-[var(--text-3)]">{this.state.msg}</span>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-[var(--text-2)]">
        <div className="spinner" />
        <div className="text-xs">{progress.toFixed(0)}%</div>
      </div>
    </Html>
  );
}

function Model({ url, editor, onReady }: { url: string; editor: EditorState; onReady?: (s: THREE.Group) => void }) {
  const gltf = useGLTF(url, true);
  const groupRef = useRef<THREE.Group>(null);
  const sceneRef = useRef<THREE.Group>(gltf.scene);

  useEffect(() => {
    const scene = gltf.scene;
    sceneRef.current = scene;
    // apply material overrides
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial;
          if (!mat) return;
          mat.wireframe = editor.wireframe;
          mat.flatShading = editor.flatShading;
          if (editor.materialColor) {
            if (!mat.userData._origColor) mat.userData._origColor = mat.color.clone();
            mat.color.set(editor.materialColor);
          } else {
            if (mat.userData._origColor) mat.color.copy(mat.userData._origColor);
          }
          mat.metalness = editor.metalness;
          mat.roughness = editor.roughness;
          mat.needsUpdate = true;
        });
      }
    });
  }, [gltf.scene, editor.wireframe, editor.flatShading, editor.materialColor, editor.metalness, editor.roughness]);

  useEffect(() => {
    if (onReady) onReady(gltf.scene);
  }, [gltf.scene, onReady]);

  return (
    <group
      ref={groupRef}
      position={editor.position}
      rotation={editor.rotation}
      scale={editor.scale}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

export function ModelViewer({ modelUrl, editor, onReady }: ModelViewerProps) {
  const bg =
    editor.background === "dark" ? "#0a0b0f"
    : editor.background === "light" ? "#f1f2f7"
    : editor.background === "transparent" ? "transparent"
    : "#12131a";

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ background: bg }}>
      <Canvas
        camera={{ position: [0, 1.2, 3], fov: 45 }}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        className="model-viewer-canvas"
      >
        <ambientLight intensity={editor.ambientIntensity} />
        <directionalLight
          position={[4, 6, 4]}
          intensity={editor.keyLightIntensity}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} />
        {editor.showGrid && (
          <Grid
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#2a2d3a"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#3a3e50"
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
          />
        )}
        {editor.showAxes && <axesHelper args={[2]} />}
        {modelUrl ? (
          <ViewerErrorBoundary>
            <Suspense fallback={<Loader />}>
              <Bounds fit clip observe margin={1.2}>
                <Center>
                  <Model url={modelUrl} editor={editor} onReady={onReady} />
                </Center>
              </Bounds>
            </Suspense>
          </ViewerErrorBoundary>
        ) : null}
        <OrbitControls
          makeDefault
          autoRotate={editor.autoRotate}
          autoRotateSpeed={1.5}
          enableDamping
          dampingFactor={0.08}
        />
        <Environment preset="studio" />
      </Canvas>
      {!modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-[var(--text-3)]">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              className="text-5xl mb-3 text-[var(--gold)]"
            >
              ✦
            </motion.div>
            <div className="text-sm">لا يوجد نموذج محمّل</div>
            <div className="text-xs mt-1">ارفع صورة للبدء</div>
          </div>
        </div>
      )}
    </div>
  );
}
