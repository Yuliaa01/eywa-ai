import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { ReactNode, useState } from "react";

interface SnackBannerProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const typeStyles = {
  info: 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal',
  success: 'bg-green-500/10 border-green-500/30 text-green-500',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
  error: 'bg-red-500/10 border-red-500/30 text-red-500',
};

export function SnackBanner({ 
  message, 
  type = 'info', 
  action, 
  icon, 
  onDismiss, 
  className 
}: SnackBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-control",
        "backdrop-blur-glass border",
        "animate-scale-in",
        typeStyles[type],
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      
      <p className="flex-1 text-body">{message}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="text-body font-semibold hover:underline min-h-[48px] px-2"
        >
          {action.label}
        </button>
      )}

      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded-control min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="Dismiss notification"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
