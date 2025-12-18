import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Droplet, AlertCircle, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";

interface CycleData {
  id: string;
  period_start_date: string;
  period_end_date: string | null;
  cycle_length: number | null;
  flow_intensity: string | null;
  symptoms: string[];
  notes: string | null;
}

interface CyclePreferences {
  average_cycle_length?: number;
  average_period_length?: number;
}

interface CycleLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCycle: CycleData | null;
  onSaved: () => void;
  preferences: CyclePreferences;
}

const FLOW_INTENSITIES = [
  { value: "spotting", label: "Spotting", emoji: "💧" },
  { value: "light", label: "Light", emoji: "🩸" },
  { value: "medium", label: "Medium", emoji: "🩸🩸" },
  { value: "heavy", label: "Heavy", emoji: "🩸🩸🩸" },
];

const COMMON_SYMPTOMS = [
  { id: "cramps", label: "Cramps", emoji: "😣" },
  { id: "headache", label: "Headache", emoji: "🤕" },
  { id: "bloating", label: "Bloating", emoji: "🫄" },
  { id: "mood_swings", label: "Mood Swings", emoji: "😢" },
  { id: "fatigue", label: "Fatigue", emoji: "😴" },
  { id: "breast_tenderness", label: "Breast Tenderness", emoji: "💔" },
  { id: "back_pain", label: "Back Pain", emoji: "🔙" },
  { id: "acne", label: "Acne", emoji: "😖" },
  { id: "cravings", label: "Food Cravings", emoji: "🍫" },
  { id: "nausea", label: "Nausea", emoji: "🤢" },
];

export function CycleLogModal({
  open,
  onOpenChange,
  editingCycle,
  onSaved,
  preferences,
}: CycleLogModalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [flowIntensity, setFlowIntensity] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (editingCycle) {
        setStartDate(editingCycle.period_start_date);
        setEndDate(editingCycle.period_end_date || "");
        setFlowIntensity(editingCycle.flow_intensity);
        setSelectedSymptoms(editingCycle.symptoms || []);
        setNotes(editingCycle.notes || "");
      } else {
        // Default to today for new entries
        setStartDate(format(new Date(), "yyyy-MM-dd"));
        setEndDate("");
        setFlowIntensity(null);
        setSelectedSymptoms([]);
        setNotes("");
      }
    }
  }, [open, editingCycle]);

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomId)
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSave = async () => {
    if (!startDate) {
      toast({
        title: "Start date required",
        description: "Please select when your period started",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate cycle length from previous period if available
      let cycleLength: number | null = null;
      if (!editingCycle) {
        const { data: prevCycle } = await supabase
          .from("menstrual_cycles")
          .select("period_start_date")
          .eq("user_id", user.id)
          .order("period_start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (prevCycle) {
          cycleLength = differenceInDays(
            new Date(startDate),
            new Date(prevCycle.period_start_date)
          );
        }
      }

      const cycleData = {
        user_id: user.id,
        period_start_date: startDate,
        period_end_date: endDate || null,
        flow_intensity: flowIntensity,
        symptoms: selectedSymptoms,
        notes: notes || null,
        cycle_length: cycleLength,
      };

      if (editingCycle) {
        const { error } = await supabase
          .from("menstrual_cycles")
          .update(cycleData)
          .eq("id", editingCycle.id);

        if (error) throw error;

        toast({
          title: "Cycle updated",
          description: "Your period data has been updated",
        });
      } else {
        const { error } = await supabase
          .from("menstrual_cycles")
          .insert(cycleData);

        if (error) throw error;

        toast({
          title: "Period logged",
          description: "Your period has been recorded",
        });
      }

      onSaved();
    } catch (error) {
      console.error("Error saving cycle:", error);
      toast({
        title: "Error",
        description: "Failed to save period data",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCycle) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("menstrual_cycles")
        .delete()
        .eq("id", editingCycle.id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Period record removed",
      });
      onSaved();
    } catch (error) {
      console.error("Error deleting cycle:", error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-pink-500" />
            </div>
            {editingCycle ? "Edit Period" : "Log Period"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Date Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date *</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={format(new Date(), "yyyy-MM-dd")}
              />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>
          </div>

          {/* Flow Intensity */}
          <div className="space-y-2">
            <Label>Flow Intensity</Label>
            <div className="grid grid-cols-4 gap-2">
              {FLOW_INTENSITIES.map((flow) => (
                <button
                  key={flow.value}
                  onClick={() => setFlowIntensity(flow.value)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    flowIntensity === flow.value
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-border hover:border-pink-500/50"
                  }`}
                >
                  <span className="block text-lg">{flow.emoji}</span>
                  <span className="text-xs text-muted-foreground">{flow.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div className="space-y-2">
            <Label>Symptoms</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map((symptom) => (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`px-3 py-1.5 rounded-full border text-sm flex items-center gap-1.5 transition-all ${
                    selectedSymptoms.includes(symptom.id)
                      ? "border-pink-500 bg-pink-500/10 text-pink-600"
                      : "border-border hover:border-pink-500/50"
                  }`}
                >
                  <span>{symptom.emoji}</span>
                  <span>{symptom.label}</span>
                  {selectedSymptoms.includes(symptom.id) && (
                    <Check className="w-3 h-3" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Tracking your cycle helps predict future periods and understand your body's patterns.
              This data is kept private and secure.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {editingCycle && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !startDate}
            className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
          >
            {saving ? "Saving..." : editingCycle ? "Update" : "Log Period"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
