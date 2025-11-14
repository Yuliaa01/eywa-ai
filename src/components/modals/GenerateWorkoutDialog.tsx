import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

interface GenerateWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GenerateWorkoutDialog({ open, onOpenChange, onSuccess }: GenerateWorkoutDialogProps) {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    duration: "30",
    type: "strength",
    equipment: "full",
    difficulty: "intermediate",
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate workout based on filters
      const workoutTemplates = {
        hiit: {
          name: "HIIT Blast",
          exercises: ["Burpees", "Mountain Climbers", "Jump Squats", "High Knees"],
          structure: "30s work, 15s rest, 4 rounds"
        },
        cardio: {
          name: "Cardio Circuit",
          exercises: ["Running", "Jump Rope", "Cycling", "Rowing"],
          structure: "5 min each exercise"
        },
        strength: {
          name: "Strength Builder",
          exercises: ["Squats", "Deadlifts", "Bench Press", "Pull-ups"],
          structure: "4 sets x 8-12 reps"
        },
        recovery: {
          name: "Active Recovery",
          exercises: ["Light Stretching", "Yoga Flow", "Foam Rolling", "Walking"],
          structure: "10 min each"
        },
      };

      const template = workoutTemplates[filters.type as keyof typeof workoutTemplates];
      const workoutName = `${filters.difficulty.charAt(0).toUpperCase() + filters.difficulty.slice(1)} ${template.name} (${filters.duration}min)`;

      const sessions = {
        duration: `${filters.duration} minutes`,
        type: filters.type,
        difficulty: filters.difficulty,
        equipment: filters.equipment,
        exercises: template.exercises,
        structure: template.structure,
      };

      const { error } = await supabase.from("workout_plans").insert([{
        user_id: user.id,
        block_name: workoutName,
        sessions: sessions,
      }]);

      if (error) throw error;

      toast({
        title: "Workout generated!",
        description: "Your custom workout has been created.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-rounded flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Generate Custom Workout
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={filters.duration} onValueChange={(v) => setFilters({ ...filters, duration: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Workout Type</Label>
            <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hiit">HIIT</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="recovery">Recovery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Equipment Available</Label>
            <Select value={filters.equipment} onValueChange={(v) => setFilters({ ...filters, equipment: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Equipment</SelectItem>
                <SelectItem value="minimal">Minimal (Bands, Dumbbells)</SelectItem>
                <SelectItem value="full">Full Gym Access</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={filters.difficulty} onValueChange={(v) => setFilters({ ...filters, difficulty: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerate} className="flex-1" disabled={loading}>
              {loading ? "Generating..." : "Generate Workout"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
