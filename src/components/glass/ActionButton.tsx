import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles = {
  primary: 'bg-accent-teal text-white shadow-glow-teal hover:bg-accent-teal-alt',
  secondary: 'bg-glass border border-white/20 text-foreground hover:border-accent-teal/30',
  ghost: 'bg-transparent text-foreground hover:bg-white/10',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-caption',
  md: 'px-6 py-3 text-body',
  lg: 'px-8 py-4 text-h3',
};

export function ActionButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  className,
  type = 'button',
}: ActionButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control",
        "font-medium backdrop-blur-glass",
        "transition-all duration-standard ease-out",
        "active:scale-[0.97]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "min-h-[48px] min-w-[48px]", // Accessibility
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
