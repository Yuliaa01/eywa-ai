import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

interface InsightRowProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  value?: string;
  badge?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function InsightRow({ 
  title, 
  subtitle, 
  icon, 
  value, 
  badge, 
  onClick, 
  className 
}: InsightRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3",
        "rounded-control backdrop-blur-glass",
        "bg-ultra-thin border border-white/10",
        "transition-all duration-standard",
        "hover:bg-glass hover:border-accent-teal/30",
        "active:scale-[0.98]",
        "min-h-[48px]", // Accessibility: min hit target
        className
      )}
      aria-label={`${title}${subtitle ? ` - ${subtitle}` : ''}`}
    >
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-teal/10 flex items-center justify-center text-accent-teal">
          {icon}
        </div>
      )}
      
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-body font-medium text-foreground truncate">{title}</h4>
          {badge}
        </div>
        {subtitle && (
          <p className="text-caption text-ink-muted truncate">{subtitle}</p>
        )}
      </div>

      {value && (
        <span className="text-body font-semibold text-accent-teal">{value}</span>
      )}
      
      {onClick && (
        <ChevronRight className="w-5 h-5 text-ink-muted flex-shrink-0" />
      )}
    </button>
  );
}
