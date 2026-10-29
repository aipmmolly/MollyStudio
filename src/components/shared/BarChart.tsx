import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { EASE_IN_FAST } from "./EasingPresets";

/**
 * A simple bar chart component. Each bar grows from 0 to its value.
 */
interface Bar {
  label: string;
  value: number; // 0-100
  color?: string;
}

interface BarChartProps {
  bars: Bar[];
  startFrame?: number;
  durationFrames?: number;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  bars,
  startFrame = 0,
  durationFrames = 40,
  height = 240,
}) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ width: "100%", maxWidth: 800 }}>
      {bars.map((bar, i) => {
        const barDelay = startFrame + i * 8;
        const progress = interpolate(
          frame,
          [barDelay, barDelay + durationFrames],
          [0, bar.value],
          {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
            easing: EASE_IN_FAST,
          }
        );

        return (
          <div
            key={i}
            style={{
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 180,
                textAlign: "right",
                fontSize: 18,
                color: "#d1d5db",
                fontFamily: '"Noto Serif SC", serif',
                flexShrink: 0,
              }}
            >
              {bar.label}
            </div>
            <div
              style={{
                flex: 1,
                height: 28,
                backgroundColor: "#1f2937",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: bar.color || "#f59e0b",
                  borderRadius: 14,
                }}
              />
            </div>
            <div
              style={{
                width: 50,
                fontSize: 16,
                color: "#9ca3af",
                fontFamily: "monospace",
              }}
            >
              {Math.round(progress)}%
            </div>
          </div>
        );
      })}
    </div>
  );
};
