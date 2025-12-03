import { ReactNode } from "react";
import { ChevronRight, Pin } from "lucide-react";
import { TrendBar } from "./TrendBar";
import {
  SparklineChart,
  RingProgress,
  HeartRateWave,
  SleepBars,
  GradientBar,
  MiniDonutChart,
  ChartType,
} from "./charts";

interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  unit: string;
  timestamp?: string;
  trendData?: number[];
  hasData?: boolean;
  onClick?: () => void;
  badge?: string;
  isPinned?: boolean;
  onTogglePin?: () => void;
  category?: string;
  chartType?: ChartType;
  color?: string;
  secondaryColor?: string;
  progress?: number;
}

export function MetricCard({
  icon,
  title,
  value,
  unit,
  timestamp,
  trendData = [],
  hasData = true,
  onClick,
  badge,
  isPinned = false,
  onTogglePin,
  category,
  chartType = "trend",
  color = "#12AFCB",
  secondaryColor,
  progress,
}: MetricCardProps) {
  const renderChart = () => {
    if (!hasData) return null;

    switch (chartType) {
      case "sparkline":
        return (
          <SparklineChart
            data={trendData.length > 0 ? trendData : Array.from({ length: 7 }, () => Math.random() * 100)}
            color={color}
            gradientId={`sparkline-${title.replace(/\s/g, "-")}`}
            className="mt-2"
          />
        );
      case "ring":
        const ringProgress = progress ?? (trendData.length > 0 ? trendData[trendData.length - 1] : 70);
        return (
          <div className="mt-2 flex justify-center">
            <RingProgress
              progress={ringProgress}
              color={color}
              trackColor={`${color}20`}
              size={48}
              strokeWidth={5}
            />
          </div>
        );
      case "wave":
        return <HeartRateWave color={color} className="mt-2" />;
      case "bars":
        return (
          <SleepBars
            data={trendData.length >= 4 ? trendData.slice(0, 4) : [35, 40, 20, 5]}
            colors={["#4C1D95", "#7C3AED", "#A78BFA", "#C4B5FD"]}
            className="mt-2"
          />
        );
      case "gradient":
        const gradientValue = progress ?? (trendData.length > 0 ? trendData[trendData.length - 1] : 40);
        return <GradientBar value={gradientValue} className="mt-2" />;
      case "donut":
        return (
          <div className="mt-2 flex justify-center">
            <MiniDonutChart
              segments={[
                { value: 40, color: color },
                { value: 30, color: secondaryColor || "#60A5FA" },
                { value: 30, color: "#E5E7EB" },
              ]}
              size={48}
              strokeWidth={6}
            />
          </div>
        );
      case "trend":
      default:
        return trendData.length > 0 ? (
          <TrendBar data={trendData} color={color} className="mt-3" />
        ) : null;
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all text-left"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${color}15`,
              color: color,
            }}
          >
            {icon}
          </div>
          <h4 className="text-sm font-medium text-[#0E1012] flex items-center h-8">{title}</h4>
        </div>
        <div className="flex items-center gap-1">
          {onTogglePin && category !== "pinned" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin();
              }}
              className={`p-1 rounded-lg transition-colors ${
                isPinned
                  ? "text-[#12AFCB] bg-[#12AFCB]/10"
                  : "text-gray-400 hover:text-[#12AFCB] hover:bg-[#12AFCB]/5"
              }`}
              title={isPinned ? "Unpin metric" : "Pin metric"}
            >
              <Pin className="w-3.5 h-3.5" fill={isPinned ? "currentColor" : "none"} />
            </button>
          )}
          {badge && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
              {badge}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {hasData ? (
        <>
          <div className="mb-2">
            <span className="text-2xl font-bold text-[#0E1012]">{value}</span>
            <span className="text-sm text-[#5A6B7F] ml-1">{unit}</span>
          </div>
          {timestamp && (
            <p className="text-xs text-[#5A6B7F] mb-1">{timestamp}</p>
          )}
          {renderChart()}
        </>
      ) : (
        <div className="py-6">
          <p className="text-sm text-[#5A6B7F]">No Data Available</p>
          <div className="mt-3 h-8 bg-gray-100 rounded-sm" />
        </div>
      )}
    </button>
  );
}
