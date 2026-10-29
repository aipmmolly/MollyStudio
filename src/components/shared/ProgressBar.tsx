import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { EASE_INOUT } from "./EasingPresets";

interface ProgressBarProps {
  value: number;
  color?: string;
  bgColor?: string;
  height?: number;
  label?: string;
  startFrame?: number;
  durationFrames?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, color = "#ef4444", bgColor = "#1f2937", height = 28,
  label, startFrame = 0, durationFrames = 30,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, startFrame + durationFrames], [0, value],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing: EASE_INOUT });

  return (
    <div style={{ width: "100%", marginBottom: 20 }}>
      {label && (
        <div style={{ fontSize: 24, color: "#d1d5db", marginBottom: 10,
          fontFamily: '"Noto Serif SC", serif' }}>{label}</div>
      )}
      <div style={{ width: "100%", height, backgroundColor: bgColor,
        borderRadius: height / 2, overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", backgroundColor: color,
          borderRadius: height / 2 }} />
      </div>
      <div style={{ fontSize: 18, color: "#9ca3af", marginTop: 4, textAlign: "right",
        fontFamily: "monospace" }}>{Math.round(progress)}%</div>
    </div>
  );
};
