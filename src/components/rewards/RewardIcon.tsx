import { icons } from "lucide-react";

interface RewardIconProps {
  icon: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-8 h-8",
};

export default function RewardIcon({ icon, className = "", size = "md" }: RewardIconProps) {
  // Check if it's a Lucide icon name (PascalCase like "Play", "Heart", etc.)
  const LucideIcon = icons[icon as keyof typeof icons];
  
  if (LucideIcon) {
    return <LucideIcon className={`${sizeClasses[size]} text-blue-400 ${className}`} />;
  }
  
  // Otherwise render as emoji text
  const textSizes = {
    sm: "text-xl",
    md: "text-2xl", 
    lg: "text-3xl",
  };
  
  return <span className={`${textSizes[size]} ${className}`}>{icon}</span>;
}

