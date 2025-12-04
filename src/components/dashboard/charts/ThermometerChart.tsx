interface ThermometerChartProps {
  value: number; // Current temperature
  min?: number; // Min range (default 35)
  max?: number; // Max range (default 40)
  color?: string;
  className?: string;
}

export function ThermometerChart({
  value,
  min = 35,
  max = 40,
  color = "#F59E0B",
  className = "",
}: ThermometerChartProps) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  // Define temperature zones
  const normalLow = ((36.1 - min) / (max - min)) * 100;
  const normalHigh = ((37.2 - min) / (max - min)) * 100;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Horizontal thermometer bar */}
      <div className="flex-1 relative">
        {/* Background gradient (faded) */}
        <div className="h-3 rounded-full bg-gradient-to-r from-blue-400 via-green-400 via-50% to-red-400 opacity-30" />
        {/* Progress bar - same gradient, clipped */}
        <div 
          className="absolute top-0 left-0 h-3 rounded-full overflow-hidden transition-all duration-500"
          style={{ width: `${percentage}%` }}
        >
          <div 
            className="h-full rounded-full bg-gradient-to-r from-blue-400 via-green-400 via-50% to-red-400"
            style={{ width: `${100 / (percentage / 100)}%` }}
          />
        </div>
        {/* Current value indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-500"
          style={{ 
            left: `calc(${percentage}% - 8px)`,
            backgroundColor: color,
          }}
        />
        {/* Range labels */}
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
          <span>{min}°</span>
          <span className="text-green-500">Normal</span>
          <span>{max}°</span>
        </div>
      </div>
    </div>
  );
}
