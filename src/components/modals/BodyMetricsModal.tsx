import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  Loader2,
} from "lucide-react";

interface BodyMetric {
  id: string;
  title: string;
  defaultValue: string;
  unit: string;
  icon: React.ReactNode;
  dbField?: string; // Maps to vitals_stream metric or user_profiles field
  dbType?: 'vital' | 'profile';
}

interface BodyMetricsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (metrics: Record<string, string>) => void;
}

const defaultMetrics: BodyMetric[] = [
  { id: "weight", title: "Weight", defaultValue: "", unit: "kg", icon: <Scale className="w-4 h-4" />, dbField: "weight", dbType: "vital" },
  { id: "height", title: "Height", defaultValue: "", unit: "cm", icon: <TrendingUp className="w-4 h-4" />, dbField: "height_cm", dbType: "profile" },
  { id: "bodyFat", title: "Body Fat %", defaultValue: "", unit: "%", icon: <Scale className="w-4 h-4" />, dbField: "body_fat", dbType: "vital" },
  { id: "skeletalMuscle", title: "Skeletal Muscle Mass", defaultValue: "", unit: "kg", icon: <Dumbbell className="w-4 h-4" />, dbField: "skeletal_muscle_mass", dbType: "vital" },
  { id: "waist", title: "Waist", defaultValue: "", unit: "cm", icon: <Target className="w-4 h-4" />, dbField: "waist_circumference", dbType: "vital" },
  { id: "temperature", title: "Temperature", defaultValue: "", unit: "°C", icon: <Activity className="w-4 h-4" />, dbField: "temp", dbType: "vital" },
  { id: "visceralFat", title: "Visceral Fat", defaultValue: "", unit: "level", icon: <Flame className="w-4 h-4" />, dbField: "visceral_fat", dbType: "vital" },
  { id: "bodyWater", title: "Body Water", defaultValue: "", unit: "%", icon: <Droplet className="w-4 h-4" /> },
  { id: "bodyProtein", title: "Body Protein", defaultValue: "", unit: "%", icon: <Salad className="w-4 h-4" /> },
  { id: "minerals", title: "Minerals", defaultValue: "", unit: "kg", icon: <Scale className="w-4 h-4" /> },
  { id: "metabolicRate", title: "Metabolic Rate", defaultValue: "", unit: "kcal/day", icon: <Flame className="w-4 h-4" /> },
];

export function BodyMetricsModal({ open, onOpenChange, onSave }: BodyMetricsModalProps) {
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadExistingMetrics();
    }
  }, [open]);

  const loadExistingMetrics = async () => {
    setInitialLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load from user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('height_cm, weight_kg')
        .eq('user_id', user.id)
        .maybeSingle();

      // Load latest vitals
      const { data: vitals } = await supabase
        .from('vitals_stream')
        .select('metric, value')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });

      const initial: Record<string, string> = {};
      
      // Set profile data
      if (profile?.height_cm) initial.height = String(profile.height_cm);
      if (profile?.weight_kg) initial.weight = String(profile.weight_kg);

      // Set latest vitals (get most recent for each metric)
      const latestVitals: Record<string, number> = {};
      vitals?.forEach(v => {
        if (!latestVitals[v.metric]) {
          latestVitals[v.metric] = v.value;
        }
      });

      if (latestVitals.weight && !initial.weight) initial.weight = String(latestVitals.weight);
      if (latestVitals.body_fat) initial.bodyFat = String(latestVitals.body_fat);
      if (latestVitals.temp) initial.temperature = String(latestVitals.temp);
      if (latestVitals.skeletal_muscle_mass) initial.skeletalMuscle = String(latestVitals.skeletal_muscle_mass);
      if (latestVitals.waist_circumference) initial.waist = String(latestVitals.waist_circumference);
      if (latestVitals.visceral_fat) initial.visceralFat = String(latestVitals.visceral_fat);

      setMetrics(initial);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleValueChange = (id: string, value: string) => {
    setMetrics(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save metrics.",
          variant: "destructive",
        });
        return;
      }

      const now = new Date().toISOString();
      const vitalsToInsert: Array<{
        user_id: string;
        metric: string;
        value: number;
        recorded_at: string;
        source: 'manual';
        units: string;
      }> = [];

      // Save weight to vitals_stream
      if (metrics.weight) {
        vitalsToInsert.push({
          user_id: user.id,
          metric: 'weight',
          value: parseFloat(metrics.weight),
          recorded_at: now,
          source: 'manual',
          units: 'kg',
        });
      }

      // Save body fat to vitals_stream
      if (metrics.bodyFat) {
        vitalsToInsert.push({
          user_id: user.id,
          metric: 'body_fat',
          value: parseFloat(metrics.bodyFat),
          recorded_at: now,
          source: 'manual',
          units: '%',
        });
      }

      // Save temperature to vitals_stream
      if (metrics.temperature) {
        vitalsToInsert.push({
          user_id: user.id,
          metric: 'temp',
          value: parseFloat(metrics.temperature),
          recorded_at: now,
          source: 'manual',
          units: '°C',
        });
      }

      // Save skeletal muscle mass to vitals_stream
      if (metrics.skeletalMuscle) {
        vitalsToInsert.push({
          user_id: user.id,
          metric: 'skeletal_muscle_mass',
          value: parseFloat(metrics.skeletalMuscle),
          recorded_at: now,
          source: 'manual',
          units: 'kg',
        });
      }

      // Save waist circumference to vitals_stream
      if (metrics.waist) {
        vitalsToInsert.push({
          user_id: user.id,
          metric: 'waist_circumference',
          value: parseFloat(metrics.waist),
          recorded_at: now,
          source: 'manual',
          units: 'cm',
        });
      }

      // Save visceral fat to vitals_stream
      if (metrics.visceralFat) {
        vitalsToInsert.push({
          user_id: user.id,
          metric: 'visceral_fat',
          value: parseFloat(metrics.visceralFat),
          recorded_at: now,
          source: 'manual',
          units: 'level',
        });
      }

      // Insert vitals
      if (vitalsToInsert.length > 0) {
        const { error: vitalsError } = await supabase
          .from('vitals_stream')
          .insert(vitalsToInsert as any);

        if (vitalsError) throw vitalsError;
      }

      // Update user profile for height and weight
      const profileUpdates: Record<string, number | null> = {};
      if (metrics.height) profileUpdates.height_cm = parseFloat(metrics.height);
      if (metrics.weight) profileUpdates.weight_kg = parseFloat(metrics.weight);

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(profileUpdates)
          .eq('user_id', user.id);

        if (profileError) throw profileError;
      }

      onSave?.(metrics);
      toast({
        title: "Metrics saved",
        description: "Your body measurements have been updated.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save metrics:', error);
      toast({
        title: "Error",
        description: "Failed to save metrics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Scale className="w-5 h-5 text-[#12AFCB]" />
            Edit Body Measurements
          </DialogTitle>
          <DialogDescription>
            Update your body measurements manually. Some metrics are saved to your health profile.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {initialLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#12AFCB]" />
            </div>
          ) : (
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
                      {metric.dbField && (
                        <span className="ml-2 text-xs text-[#12AFCB]">● Synced</span>
                      )}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id={metric.id}
                        type="number"
                        step="0.1"
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
          )}
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#12AFCB] hover:bg-[#0E9CB5] text-white"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
