import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassToolbarProps {
  children: ReactNode;
  className?: string;
  position?: 'top' | 'bottom';
}

export function GlassToolbar({ children, className, position = 'bottom' }: GlassToolbarProps) {
  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-50",
        "backdrop-blur-glass bg-ultra-thin",
        "border-white/10",
        position === 'bottom' ? 'bottom-0 border-t' : 'top-0 border-b',
        "px-4 py-3",
        "safe-area-inset-bottom",
        className
      )}
    >
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
        {children}
      </div>
    </div>
  );
}
