export { SparklineChart } from "./SparklineChart";
export { RingProgress } from "./RingProgress";
export { HeartRateWave } from "./HeartRateWave";
export { SleepBars } from "./SleepBars";
export { GradientBar } from "./GradientBar";
export { MiniDonutChart } from "./MiniDonutChart";
export { ThermometerChart } from "./ThermometerChart";

export const categoryColors = {
  activity: { primary: "#22C55E", secondary: "#86EFAC" },
  heart: { primary: "#EF4444", secondary: "#FCA5A5" },
  sleep: { primary: "#8B5CF6", secondary: "#C4B5FD" },
  nutrition: { primary: "#F59E0B", secondary: "#FCD34D" },
  body: { primary: "#3B82F6", secondary: "#93C5FD" },
  mental: { primary: "#10B981", secondary: "#6EE7B7" },
  medications: { primary: "#8B5CF6", secondary: "#C4B5FD" },
  respiratory: { primary: "#06B6D4", secondary: "#67E8F9" },
  symptoms: { primary: "#EC4899", secondary: "#F9A8D4" },
  records: { primary: "#6366F1", secondary: "#A5B4FC" },
} as const;

export type ChartType = "sparkline" | "ring" | "wave" | "bars" | "gradient" | "donut" | "trend" | "thermometer";
export type CategoryColorKey = keyof typeof categoryColors;
