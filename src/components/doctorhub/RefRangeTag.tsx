import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Check } from "lucide-react";

interface RefRangeTagProps {
  value: number;
  refLow: number;
  refHigh: number;
}

export default function RefRangeTag({ value, refLow, refHigh }: RefRangeTagProps) {
  const isInRange = value >= refLow && value <= refHigh;
  const isHigh = value > refHigh;
  const isLow = value < refLow;

  if (isInRange) {
    return (
      <Badge className="bg-green-500/10 text-green-600 border-0">
        <Check className="w-3 h-3 mr-1" />
        Normal
      </Badge>
    );
  }

  if (isHigh) {
    return (
      <Badge className="bg-red-500/10 text-red-600 border-0">
        <TrendingUp className="w-3 h-3 mr-1" />
        High
      </Badge>
    );
  }

  return (
    <Badge className="bg-orange-500/10 text-orange-600 border-0">
      <TrendingDown className="w-3 h-3 mr-1" />
      Low
    </Badge>
  );
}
