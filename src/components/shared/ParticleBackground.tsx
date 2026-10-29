import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";

/**
 * Subtle animated particle background.
 * Floating dots drift slowly upward with varying speeds and opacities.
 * Runs continuously throughout the slide.
 */
interface Particle {
  x: number;       // 0-100 (% of width)
  startY: number;  // 0-100 (% of height)
  size: number;    // 1-4px
  speed: number;   // how fast it rises (pixels per frame)
  opacity: number; // 0.05-0.2
  phase: number;   // random phase offset for sine wave horizontal drift
}

interface ParticleBackgroundProps {
  particleCount?: number;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  particleCount = 40,
}) => {
  const frame = useCurrentFrame();

  // Generate deterministic particles once
  const particles = useMemo<Particle[]>(() => {
    const seed = (i: number) => {
      const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: particleCount }, (_, i) => ({
      x: seed(i * 3) * 100,
      startY: seed(i * 3 + 1) * 100,
      size: 1 + seed(i * 3 + 2) * 3,
      speed: 0.02 + seed(i * 5) * 0.04,
      opacity: 0.04 + seed(i * 7) * 0.1,
      phase: seed(i * 11) * Math.PI * 2,
    }));
  }, [particleCount]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {particles.map((p, i) => {
        // Particle rises upward and wraps around
        const y = ((p.startY - frame * p.speed) % 100 + 100) % 100;
        // Subtle horizontal sine drift
        const xOffset = Math.sin(frame * 0.008 + p.phase) * 1.5;
        const x = p.x + xOffset;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: `rgba(245, 158, 11, ${p.opacity})`,
              boxShadow: `0 0 ${p.size * 2}px rgba(245, 158, 11, ${p.opacity * 0.5})`,
            }}
          />
        );
      })}
    </div>
  );
};
