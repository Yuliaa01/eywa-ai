import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface RiskChipProps {
  title: string;
  severity: "low" | "medium" | "high";
  description: string;
}

const severityColors = {
  low: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700",
  medium: "bg-orange-500/10 border-orange-500/20 text-orange-700",
  high: "bg-red-500/10 border-red-500/20 text-red-700",
};

const severityDotColors = {
  low: "bg-yellow-500",
  medium: "bg-orange-500",
  high: "bg-red-500",
};

export default function RiskChip({ title, severity, description }: RiskChipProps) {
  return (
    <div className={`p-3 rounded-xl border ${severityColors[severity]}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${severityDotColors[severity]}`} />
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant="outline" className="ml-auto text-xs border-current">
          {severity}
        </Badge>
      </div>
      <p className="text-xs text-[#5A6B7F] ml-4">{description}</p>
    </div>
  );
}
