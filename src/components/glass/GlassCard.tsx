import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
}

export function GlassCard({ children, className, onClick, role, tabIndex }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-card backdrop-blur-glass",
        "bg-glass shadow-glass",
        "border border-white/20",
        "transition-all duration-standard ease-out",
        "hover:shadow-glow-teal hover:border-accent-teal/30",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
    >
      <div className="absolute inset-0 rounded-card bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
