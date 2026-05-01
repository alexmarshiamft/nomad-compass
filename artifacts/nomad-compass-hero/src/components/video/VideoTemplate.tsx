import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

export const SCENE_DURATIONS: Record<string, number> = {
  hook: 6000,
  problem: 7000,
  dataReveal: 8000,
  cities: 7000,
  features: 8000,
  closing: 9000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hook: Scene1,
  problem: Scene2,
  dataReveal: Scene3,
  cities: Scene4,
  features: Scene5,
  closing: Scene6,
};

const orbPos = [
  { x: '10vw', y: '20vh', scale: 1, opacity: 0.8 },
  { x: '80vw', y: '80vh', scale: 2.5, opacity: 0.4 },
  { x: '50vw', y: '50vh', scale: 1.5, opacity: 0.6 },
  { x: '20vw', y: '70vh', scale: 0.8, opacity: 0.7 },
  { x: '70vw', y: '10vh', scale: 1.2, opacity: 0.5 },
  { x: '50vw', y: '50vh', scale: 0, opacity: 0 },
];

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-dark)] text-[var(--color-text-primary)]"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {/* Persistent Background Orb */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[60px]"
        style={{ background: 'var(--color-primary)' }}
        animate={orbPos[sceneIndex] ?? orbPos[0]}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence initial={false} mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
