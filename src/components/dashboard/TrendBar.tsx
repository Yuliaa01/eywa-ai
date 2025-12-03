interface TrendBarProps {
  data: number[];
  className?: string;
  color?: string;
}

export function TrendBar({ data, className = "", color = "#12AFCB" }: TrendBarProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className={`flex items-end gap-0.5 h-8 ${className}`}>
      {data.map((value, index) => {
        const height = ((value - min) / range) * 100;
        return (
          <div
            key={index}
            className="flex-1 rounded-sm transition-all"
            style={{ 
              height: `${Math.max(height, 5)}%`,
              backgroundColor: color,
            }}
          />
        );
      })}
    </div>
  );
}
