import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { EASE_IN_FAST } from "./EasingPresets";
import { ParticleBackground } from "./ParticleBackground";

interface SlideFrameProps {
  children: React.ReactNode;
  fadeInFrames?: number;
  title?: string;
  subtitle?: string;
  layout?: "centered" | "top-left";
}

/**
 * Unified slide container used by EVERY slide.
 * - Fade-in animation on mount
 * - Subtle floating particle background (continuous)
 * - Safe bottom margin to avoid overlapping with subtitles
 */
export const SlideFrame: React.FC<SlideFrameProps> = ({
  children,
  fadeInFrames = 12,
  title,
  subtitle,
  layout = "centered",
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, fadeInFrames], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: EASE_IN_FAST,
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: layout === "centered" ? "center" : "flex-start",
        alignItems: "stretch",
        // Top/left/right padding normal, BOTTOM padding extra to clear subtitle zone
        padding: "64px 78px 190px 78px",
        opacity,
        backgroundColor: "#0a0a0f",
        color: "#e5e7eb",
        fontFamily: '"Noto Serif SC", "Songti SC", serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Continuous animated particle background — runs entire slide */}
      <ParticleBackground particleCount={35} />

      {/* Content — above particles in z-order */}
      <div style={{ position: "relative", zIndex: 1, width: "100%",
        display: "flex", flexDirection: "column",
        flex: 1 }}>
        {title && (
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#f59e0b",
              marginBottom: subtitle ? 10 : 40,
              textAlign: "left",
              width: "100%",
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
        )}
        {subtitle && (
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: "#9ca3af",
              marginBottom: 48,
              textAlign: "left",
              width: "100%",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
        )}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          justifyContent: layout === "centered" ? "center" : "flex-start",
          alignItems: "stretch",
          width: "100%",
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};
