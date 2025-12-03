interface SleepBarsProps {
  data: number[]; // Array of sleep stage durations
  colors?: string[];
  className?: string;
}

export function SleepBars({
  data,
  colors = ["#4C1D95", "#7C3AED", "#A78BFA", "#C4B5FD"],
  className = "",
}: SleepBarsProps) {
  const total = data.reduce((sum, val) => sum + val, 0) || 1;

  return (
    <div className={`h-6 w-full ${className}`}>
      <div className="flex h-full rounded-full overflow-hidden gap-0.5">
        {data.map((value, index) => {
          const width = (value / total) * 100;
          return (
            <div
              key={index}
              className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${Math.max(width, 2)}%`,
                backgroundColor: colors[index % colors.length],
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-gray-500">
        <span>Deep</span>
        <span>Light</span>
        <span>REM</span>
        <span>Awake</span>
      </div>
    </div>
  );
}
