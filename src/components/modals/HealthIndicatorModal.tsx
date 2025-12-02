import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HealthIndicatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicatorType: "bio-age" | "health-score" | "vitals" | null;
  bioAge: number | null;
  actualAge: number | null;
}

export function HealthIndicatorModal({
  open,
  onOpenChange,
  indicatorType,
  bioAge,
  actualAge,
}: HealthIndicatorModalProps) {
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && indicatorType) {
      fetchExplanation();
    }
  }, [open, indicatorType]);

  const fetchExplanation = async () => {
    setLoading(true);
    setExplanation("");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-health-indicator", {
        body: {
          indicatorType,
          bioAge,
          actualAge,
        },
      });

      if (error) throw error;

      setExplanation(data.explanation);
    } catch (error) {
      console.error("Error fetching explanation:", error);
      toast.error("Failed to load explanation. Please try again.");
      setExplanation("Unable to load explanation at this time.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (indicatorType) {
      case "bio-age":
        return "Biological Age Analysis";
      case "health-score":
        return "Health Score Breakdown";
      case "vitals":
        return "Key Vitals Overview";
      default:
        return "Health Indicator";
    }
  };

  const getMetricDisplay = () => {
    switch (indicatorType) {
      case "bio-age":
        return (
          <div className="flex items-center justify-center gap-4 py-6 px-4 bg-[#12AFCB]/5 rounded-2xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0E1012]">
                {bioAge !== null ? bioAge : actualAge !== null ? actualAge : "—"}
              </div>
              <div className="text-sm text-[#5A6B7F] mt-1">Biological Age</div>
            </div>
            <div className="w-px h-12 bg-[#12AFCB]/20" />
            <div className="text-center">
              <div className="text-3xl font-bold text-[#5A6B7F]">
                {actualAge !== null ? actualAge : "—"}
              </div>
              <div className="text-sm text-[#5A6B7F] mt-1">Chronological Age</div>
            </div>
          </div>
        );
      case "health-score":
        return (
          <div className="flex items-center justify-center py-6 px-4 bg-[#12AFCB]/5 rounded-2xl">
            <div className="text-center">
              <div className="text-5xl font-bold text-[#0E1012]">88</div>
              <div className="text-sm text-[#5A6B7F] mt-1">out of 100</div>
            </div>
          </div>
        );
      case "vitals":
        return (
          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="p-4 bg-[#12AFCB]/5 rounded-xl text-center">
              <div className="text-2xl font-bold text-[#0E1012]">72</div>
              <div className="text-xs text-[#5A6B7F] mt-1">Heart Rate (bpm)</div>
            </div>
            <div className="p-4 bg-[#12AFCB]/5 rounded-xl text-center">
              <div className="text-2xl font-bold text-[#0E1012]">58</div>
              <div className="text-xs text-[#5A6B7F] mt-1">HRV (ms)</div>
            </div>
            <div className="p-4 bg-[#12AFCB]/5 rounded-xl text-center">
              <div className="text-2xl font-bold text-[#0E1012]">120/80</div>
              <div className="text-xs text-[#5A6B7F] mt-1">Blood Pressure</div>
            </div>
            <div className="p-4 bg-[#12AFCB]/5 rounded-xl text-center">
              <div className="text-2xl font-bold text-[#0E1012]">22.5</div>
              <div className="text-xs text-[#5A6B7F] mt-1">BMI</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#0E1012]">{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {getMetricDisplay()}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#0E1012]">Analysis & Explanation</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#12AFCB]" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="text-[#0E1012] whitespace-pre-wrap leading-relaxed">
                  {explanation}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
