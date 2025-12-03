interface RingProgressProps {
  progress: number; // 0-100
  color: string;
  trackColor?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function RingProgress({
  progress,
  color,
  trackColor = "#E5E7EB",
  size = 40,
  strokeWidth = 4,
  className = "",
}: RingProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className={`flex items-center justify-center ${className}`}>
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
      <span
        className="absolute text-[10px] font-semibold"
        style={{ color, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        {Math.round(progress)}%
      </span>
    </div>
  );
}
