import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { EASE_IN_FAST } from "./EasingPresets";

interface Column {
  title: string;
  titleColor?: string;
  items: { text: string; status?: "good" | "bad" | "neutral"; subtext?: string }[];
}

interface ComparisonTableProps {
  left: Column;
  right: Column;
  delayFrames?: number;
}

const statusColors = {
  good: { text: "#10b981", icon: "✓" },
  bad: { text: "#ef4444", icon: "✗" },
  neutral: { text: "#9ca3af", icon: "—" },
};

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  left, right, delayFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const leftOpacity = interpolate(frame, [delayFrames, delayFrames + 8], [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing: EASE_IN_FAST });
  const rightOpacity = interpolate(frame, [delayFrames + 8, delayFrames + 16], [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp", easing: EASE_IN_FAST });

  const renderColumn = (col: Column, opacity: number) => (
    <div style={{ flex: 1, opacity }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: col.titleColor || "#f59e0b",
        marginBottom: 24, textAlign: "center", fontFamily: '"Noto Serif SC", serif' }}>
        {col.title}
      </div>
      {col.items.map((item, i) => {
        const s = statusColors[item.status || "neutral"];
        return (
          <div key={i} style={{ padding: "18px 24px", marginBottom: 12,
            backgroundColor: "#111827", borderRadius: 12, border: "1.5px solid #1f2937",
            fontSize: 24, color: s.text, display: "flex", alignItems: "center", gap: 14,
            fontFamily: '"Noto Serif SC", serif' }}>
            <span style={{ fontWeight: 700, fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ lineHeight: 1.4 }}>{item.text}</div>
              {item.subtext && (
                <div style={{ fontSize: 18, color: "#6b7280", marginTop: 4 }}>{item.subtext}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 60, width: "100%" }}>
      {renderColumn(left, leftOpacity)}
      {renderColumn(right, rightOpacity)}
    </div>
  );
};
