import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { EASE_IN_FAST } from "./EasingPresets";

interface CardProps {
  children: React.ReactNode;
  delayFrames?: number;
  accentColor?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  delayFrames = 0,
  accentColor = "#374151",
  style,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame, [delayFrames, delayFrames + 10], [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing: EASE_IN_FAST }
  );
  const translateY = interpolate(
    frame, [delayFrames, delayFrames + 10], [12, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing: EASE_IN_FAST }
  );

  return (
    <div
      style={{
        backgroundColor: "#111827",
        border: `1.5px solid ${accentColor}`,
        borderRadius: 16,
        padding: "36px 44px",
        opacity,
        transform: `translateY(${translateY}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
