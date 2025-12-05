import { cn } from "@/lib/utils";

interface PillToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  gradientClass?: string;
  disabled?: boolean;
  className?: string;
}

export function PillToggle({ 
  checked, 
  onCheckedChange, 
  gradientClass = "from-orange-400 to-orange-500",
  disabled = false,
  className 
}: PillToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12AFCB] focus-visible:ring-offset-2",
        checked 
          ? "bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" 
          : "bg-gray-200",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Track inner glow when checked */}
      {checked && (
        <span className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
      )}
      
      {/* Capsule knob */}
      <span
        className={cn(
          "pointer-events-none absolute h-6 w-6 rounded-full shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          checked 
            ? "translate-x-7 bg-white scale-110" 
            : `translate-x-1 bg-gradient-to-br ${gradientClass}`,
        )}
      >
        {/* Pill shine effect */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
        
        {/* Checkmark when taken */}
        {checked && (
          <svg 
            className="absolute inset-0 m-auto w-4 h-4 text-emerald-500 animate-scale-in"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
    </button>
  );
}
