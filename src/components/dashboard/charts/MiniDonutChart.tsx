interface MiniDonutChartProps {
  segments: { value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function MiniDonutChart({
  segments,
  size = 40,
  strokeWidth = 6,
  className = "",
}: MiniDonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1;

  let accumulatedOffset = 0;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {segments.map((segment, index) => {
          const segmentLength = (segment.value / total) * circumference;
          const offset = circumference - segmentLength;
          const rotation = (accumulatedOffset / total) * 360;
          accumulatedOffset += segment.value;

          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeLinecap="round"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "center",
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
