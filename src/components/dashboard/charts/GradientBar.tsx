interface GradientBarProps {
  value: number; // 0-100
  lowColor?: string;
  midColor?: string;
  highColor?: string;
  className?: string;
  showLabels?: boolean;
}

export function GradientBar({
  value,
  lowColor = "#22C55E",
  midColor = "#FBBF24",
  highColor = "#EF4444",
  className = "",
  showLabels = true,
}: GradientBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="relative h-3 rounded-full overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(to right, ${lowColor}, ${midColor}, ${highColor})`,
          }}
        />
        {/* Value indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full shadow-md transition-all duration-300"
          style={{
            left: `calc(${clampedValue}% - 6px)`,
            borderColor: clampedValue < 33 ? lowColor : clampedValue < 66 ? midColor : highColor,
          }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1 text-[10px] text-gray-500">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      )}
    </div>
  );
}
