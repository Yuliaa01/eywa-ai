import { ReactNode } from "react";

interface RingProgressProps {
  progress: number; // 0-100
  color: string;
  trackColor?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
  showPercentage?: boolean;
}

export function RingProgress({
  progress,
  color,
  trackColor = "#E5E7EB",
  size = 40,
  strokeWidth = 4,
  className = "",
  children,
  showPercentage = true,
}: RingProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      ) : showPercentage ? (
        <span
          className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold"
          style={{ color }}
        >
          {Math.round(progress)}%
        </span>
      ) : null}
    </div>
  );
}
