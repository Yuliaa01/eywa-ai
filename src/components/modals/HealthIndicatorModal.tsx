import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Star, TrendingUp, Calendar, Heart, Activity, Brain, Scale, Droplet, Dna, FileText, Zap, Moon, Apple, Smile } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ActionButton } from "@/components/glass/ActionButton";

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

  const ageDifference = bioAge !== null && actualAge !== null ? actualAge - bioAge : 0;
  const ageStatus = ageDifference > 0 ? "younger" : ageDifference < 0 ? "older" : "same as";

  const renderBioAgeContent = () => (
    <div className="space-y-5">
      {/* Header Badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className="bg-accent text-accent-foreground">Longevity</Badge>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm">
          <Star className="w-4 h-4 fill-current" />
          <span>{Math.abs(ageDifference)} years {ageStatus}</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium">
          {ageDifference >= 5 ? "Excellent" : ageDifference >= 0 ? "Good" : "Needs Attention"}
        </div>
      </div>

      {/* Primary Metric Display */}
      <div className="flex items-center justify-center gap-8 py-6 px-4 bg-accent/5 rounded-2xl">
        <div className="text-center">
          <div className="text-4xl font-bold text-accent">
            {bioAge !== null ? bioAge : actualAge !== null ? actualAge : "—"}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Biological Age</div>
        </div>
        <div className="w-px h-16 bg-accent/20" />
        <div className="text-center">
          <div className="text-4xl font-bold text-muted-foreground">
            {actualAge !== null ? actualAge : "—"}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Chronological Age</div>
        </div>
      </div>

      {/* Info Rows */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Dna className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Status</p>
            <p className="text-sm text-accent">{Math.abs(ageDifference)} years {ageStatus} chronological age</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Trend</p>
            <p className="text-sm text-muted-foreground">Improving over last 6 months</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Last Assessment</p>
            <p className="text-sm text-muted-foreground">December 1, 2025</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* About Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">About This Analysis</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
        )}
      </div>

      <Separator />

      {/* Contributing Factors */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Contributing Factors</h3>
        <div className="flex flex-wrap gap-2">
          {["Sleep Quality", "Exercise", "Nutrition", "Stress Management", "Hydration"].map((factor) => (
            <Badge key={factor} variant="secondary" className="bg-accent/10 text-accent border-0">
              {factor}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Key Metrics */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Key Metrics</h3>
        <div className="space-y-2">
          {[
            { label: "Telomere Length", value: "Above Average" },
            { label: "Inflammation Markers", value: "Optimal" },
            { label: "Metabolic Age", value: "35 years" },
            { label: "Cellular Health", value: "Good" },
          ].map((metric) => (
            <div key={metric.label} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <span className="text-sm font-medium text-foreground">{metric.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <ActionButton variant="primary" className="flex-1">View Detailed Report</ActionButton>
        <ActionButton variant="secondary" className="flex-1">Get Recommendations</ActionButton>
      </div>
    </div>
  );

  const renderHealthScoreContent = () => (
    <div className="space-y-5">
      {/* Header Badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className="bg-accent text-accent-foreground">Wellness</Badge>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-bold">
          88/100
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium">
          Very Good
        </div>
      </div>

      {/* Primary Metric Display */}
      <div className="flex items-center justify-center py-8 px-4 bg-accent/5 rounded-2xl">
        <div className="text-center">
          <div className="text-6xl font-bold text-accent">88</div>
          <div className="text-sm text-muted-foreground mt-2">out of 100</div>
        </div>
      </div>

      {/* Info Rows */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Current Score</p>
            <p className="text-sm text-accent">88 out of 100</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Trend</p>
            <p className="text-sm text-emerald-500">+3 points this month</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Last Updated</p>
            <p className="text-sm text-muted-foreground">Today</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* About Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">About Your Score</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
        )}
      </div>

      <Separator />

      {/* Score Components */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Score Components</h3>
        <div className="space-y-2">
          {[
            { category: "Activity", score: 92, status: "Excellent", icon: Activity, color: "text-emerald-500" },
            { category: "Sleep", score: 85, status: "Good", icon: Moon, color: "text-purple-500" },
            { category: "Nutrition", score: 88, status: "Very Good", icon: Apple, color: "text-amber-500" },
            { category: "Mental Health", score: 82, status: "Good", icon: Smile, color: "text-pink-500" },
            { category: "Vitals", score: 90, status: "Excellent", icon: Heart, color: "text-red-500" },
          ].map((item) => (
            <div key={item.category} className="flex items-center justify-between py-2.5 px-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-sm text-foreground">{item.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground">{item.score}</span>
                <Badge variant="secondary" className="bg-accent/10 text-accent border-0 text-xs">
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Improvement Areas */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Areas to Improve</h3>
        <div className="flex flex-wrap gap-2">
          {["Hydration", "Stress Management"].map((area) => (
            <Badge key={area} variant="secondary" className="bg-amber-500/10 text-amber-600 border-0">
              {area}
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <ActionButton variant="primary" className="flex-1">Track Progress</ActionButton>
        <ActionButton variant="secondary" className="flex-1">Improve Score</ActionButton>
      </div>
    </div>
  );

  const renderVitalsContent = () => (
    <div className="space-y-5">
      {/* Header Badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className="bg-accent text-accent-foreground">Vitals</Badge>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium">
          All Normal
        </div>
        <div className="text-sm text-muted-foreground">Last check: 2 hours ago</div>
      </div>

      {/* Vital Readings Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Heart Rate", value: "72", unit: "bpm", status: "Normal", icon: Heart, color: "text-red-500", bgColor: "bg-red-500/10" },
          { label: "HRV", value: "58", unit: "ms", status: "Good", icon: Activity, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
          { label: "Blood Pressure", value: "120/80", unit: "mmHg", status: "Optimal", icon: Droplet, color: "text-blue-500", bgColor: "bg-blue-500/10" },
          { label: "BMI", value: "22.5", unit: "", status: "Healthy", icon: Scale, color: "text-purple-500", bgColor: "bg-purple-500/10" },
        ].map((vital) => (
          <div key={vital.label} className={`p-4 ${vital.bgColor} rounded-xl`}>
            <div className="flex items-center gap-2 mb-2">
              <vital.icon className={`w-4 h-4 ${vital.color}`} />
              <span className="text-xs text-muted-foreground">{vital.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {vital.value}
              {vital.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{vital.unit}</span>}
            </div>
            <Badge variant="secondary" className="mt-2 bg-white/50 text-accent border-0 text-xs">
              {vital.status}
            </Badge>
          </div>
        ))}
      </div>

      <Separator />

      {/* About Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">About Your Vitals</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
        )}
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {["Cardiovascular", "Metabolic", "Recovery"].map((cat) => (
            <Badge key={cat} variant="secondary" className="bg-accent/10 text-accent border-0">
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Detailed Readings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Detailed Readings</h3>
        <div className="space-y-2">
          {[
            { metric: "Resting HR", value: "72 bpm", reference: "60-100 bpm" },
            { metric: "SpO2", value: "98%", reference: "95-100%" },
            { metric: "Respiratory Rate", value: "14 /min", reference: "12-20 /min" },
            { metric: "Body Temperature", value: "36.6°C", reference: "36.1-37.2°C" },
          ].map((item) => (
            <div key={item.metric} className="flex items-center justify-between py-2.5 px-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">{item.metric}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{item.value}</span>
                <span className="text-xs text-muted-foreground">({item.reference})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <ActionButton variant="primary" className="flex-1">Log New Reading</ActionButton>
        <ActionButton variant="secondary" className="flex-1">View History</ActionButton>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (indicatorType) {
      case "bio-age":
        return renderBioAgeContent();
      case "health-score":
        return renderHealthScoreContent();
      case "vitals":
        return renderVitalsContent();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">{getTitle()}</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
