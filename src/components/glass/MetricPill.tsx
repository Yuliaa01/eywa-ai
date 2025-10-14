import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MetricPillProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

const variantStyles = {
  default: 'bg-accent-teal/10 text-accent-teal border-accent-teal/30',
  success: 'bg-green-500/10 text-green-500 border-green-500/30',
  warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  error: 'bg-red-500/10 text-red-500 border-red-500/30',
};

export function MetricPill({ 
  label, 
  value, 
  unit, 
  icon, 
  variant = 'default', 
  className 
}: MetricPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-control",
        "backdrop-blur-glass border",
        "transition-all duration-standard",
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <div className="flex items-baseline gap-1">
        <span className="text-caption opacity-70">{label}</span>
        <span className="text-body font-semibold">{value}</span>
        {unit && <span className="text-caption opacity-70">{unit}</span>}
      </div>
    </div>
  );
}
