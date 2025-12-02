import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  Scale,
  TrendingUp,
  Dumbbell,
  Target,
  Activity,
  Flame,
  Droplet,
  Salad,
  Save,
} from "lucide-react";

interface BodyMetric {
  id: string;
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
}

interface BodyMetricsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (metrics: Record<string, string>) => void;
}

const defaultMetrics: BodyMetric[] = [
  { id: "weight", title: "Weight", value: "75.2", unit: "kg", icon: <Scale className="w-4 h-4" /> },
  { id: "height", title: "Height", value: "178", unit: "cm", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "bodyFat", title: "Body Fat %", value: "18.5", unit: "%", icon: <Scale className="w-4 h-4" /> },
  { id: "skeletalMuscle", title: "Skeletal Muscle Mass", value: "32.5", unit: "kg", icon: <Dumbbell className="w-4 h-4" /> },
  { id: "waist", title: "Waist", value: "82", unit: "cm", icon: <Target className="w-4 h-4" /> },
  { id: "temperature", title: "Temperature", value: "36.6", unit: "°C", icon: <Activity className="w-4 h-4" /> },
  { id: "visceralFat", title: "Visceral Fat", value: "8", unit: "level", icon: <Flame className="w-4 h-4" /> },
  { id: "bodyWater", title: "Body Water", value: "55.2", unit: "%", icon: <Droplet className="w-4 h-4" /> },
  { id: "bodyProtein", title: "Body Protein", value: "16.8", unit: "%", icon: <Salad className="w-4 h-4" /> },
  { id: "minerals", title: "Minerals", value: "4.2", unit: "kg", icon: <Scale className="w-4 h-4" /> },
  { id: "metabolicRate", title: "Metabolic Rate", value: "1680", unit: "kcal/day", icon: <Flame className="w-4 h-4" /> },
];

export function BodyMetricsModal({ open, onOpenChange, onSave }: BodyMetricsModalProps) {
  const [metrics, setMetrics] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      // Initialize with default values
      const initial: Record<string, string> = {};
      defaultMetrics.forEach(m => {
        initial[m.id] = m.value;
      });
      setMetrics(initial);
    }
  }, [open]);

  const handleValueChange = (id: string, value: string) => {
    setMetrics(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    onSave?.(metrics);
    toast({
      title: "Metrics updated",
      description: "Your body measurements have been saved.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Scale className="w-5 h-5 text-[#12AFCB]" />
            Edit Body Measurements
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-2">
            {defaultMetrics.map((metric) => (
              <div
                key={metric.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-transparent border border-gray-100"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#12AFCB]/10 text-[#12AFCB]">
                  {metric.icon}
                </div>
                <div className="flex-1">
                  <Label htmlFor={metric.id} className="text-sm font-medium text-[#0E1012]">
                    {metric.title}
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id={metric.id}
                      type="text"
                      value={metrics[metric.id] || ""}
                      onChange={(e) => handleValueChange(metric.id, e.target.value)}
                      className="h-9 w-28 text-right font-semibold"
                      placeholder="--"
                    />
                    <span className="text-sm text-[#5A6B7F] min-w-[60px]">{metric.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#12AFCB] hover:bg-[#0E9CB5] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
