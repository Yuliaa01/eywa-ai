import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Dumbbell, Clock, Flame, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { triggerWorkoutReward } from "@/hooks/useRewardTrigger";

interface LogWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const aiSuggestions = [
  {
    type: "Walk",
    duration: "30 min",
    time: "Morning",
    benefit: "Boost energy & focus",
    calories: 120,
  },
  {
    type: "Yoga",
    duration: "20 min",
    time: "Evening",
    benefit: "Recovery & flexibility",
    calories: 70,
  },
  {
    type: "Zone 2 Cardio",
    duration: "40 min",
    time: "Afternoon",
    benefit: "Build aerobic base",
    calories: 320,
  },
  {
    type: "HIIT",
    duration: "25 min",
    time: "Any",
    benefit: "Burn fat & build strength",
    calories: 300,
  },
  {
    type: "Strength Training",
    duration: "45 min",
    time: "Morning",
    benefit: "Build muscle & boost metabolism",
    calories: 270,
  },
  {
    type: "Running",
    duration: "30 min",
    time: "Any",
    benefit: "Improve cardiovascular health",
    calories: 300,
  },
];

const workoutTypes = [
  "Walk",
  "Running",
  "Cycling",
  "HIIT",
  "Strength Training",
  "Yoga",
  "Swimming",
  "Zone 2 Cardio",
  "Stretching",
  "Other",
];

export function LogWorkoutDialog({ open, onOpenChange }: LogWorkoutDialogProps) {
  const [mode, setMode] = useState<"select" | "manual" | "ai">("select");
  const [selectedAI, setSelectedAI] = useState<number | null>(null);
  const [manualType, setManualType] = useState("Walk");
  const [manualDuration, setManualDuration] = useState("30");
  const [manualCalories, setManualCalories] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const handleLogAISuggestion = async () => {
    if (selectedAI === null) return;
    
    setIsLogging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const suggestion = aiSuggestions[selectedAI];
      const durationMinutes = parseInt(suggestion.duration);
      const durationSeconds = durationMinutes * 60;

      const { error } = await supabase.from("workout_plans").insert([{
        user_id: user.id,
        block_name: suggestion.type,
        sessions: [{
          duration: durationSeconds,
          completed_at: new Date().toISOString(),
          calories: suggestion.calories,
          benefit: suggestion.benefit,
        }],
      }]);

      if (error) throw error;

      toast({
        title: "Workout logged",
        description: `${suggestion.type} (${suggestion.duration}) has been logged.`,
      });

      await triggerWorkoutReward(user.id);
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLogging(false);
    }
  };

  const handleLogManualWorkout = async () => {
    setIsLogging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const durationMinutes = parseInt(manualDuration);
      const durationSeconds = durationMinutes * 60;
      const calories = manualCalories ? parseInt(manualCalories) : Math.round(durationMinutes * 5);

      const { error } = await supabase.from("workout_plans").insert([{
        user_id: user.id,
        block_name: manualType,
        sessions: [{
          duration: durationSeconds,
          completed_at: new Date().toISOString(),
          calories: calories,
          benefit: "Custom workout",
        }],
      }]);

      if (error) throw error;

      toast({
        title: "Workout logged",
        description: `${manualType} (${manualDuration} min) has been logged.`,
      });

      await triggerWorkoutReward(user.id);
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLogging(false);
    }
  };

  const resetState = () => {
    setMode("select");
    setSelectedAI(null);
    setManualType("Walk");
    setManualDuration("30");
    setManualCalories("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Log Workout
          </DialogTitle>
        </DialogHeader>

        {mode === "select" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">How would you like to log your workout?</p>
            <div className="grid gap-3">
              <button
                onClick={() => setMode("ai")}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">AI Suggestions</p>
                  <p className="text-sm text-muted-foreground">Choose from personalized recommendations</p>
                </div>
              </button>
              <button
                onClick={() => setMode("manual")}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="font-medium">Manual Entry</p>
                  <p className="text-sm text-muted-foreground">Add your own workout details</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === "ai" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode("select")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAI(index)}
                  className={`w-full p-3 rounded-xl border transition-all text-left ${
                    selectedAI === index
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedAI === index ? "bg-primary text-white" : "bg-muted"
                      }`}>
                        {selectedAI === index ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{suggestion.type}</p>
                        <p className="text-xs text-muted-foreground">{suggestion.benefit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3" />
                        {suggestion.duration}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Flame className="w-3 h-3" />
                        {suggestion.calories} cal
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={handleLogAISuggestion}
              disabled={selectedAI === null || isLogging}
              className="w-full"
            >
              {isLogging ? "Logging..." : "Log Selected Workout"}
            </Button>
          </div>
        )}

        {mode === "manual" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode("select")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Workout Type</Label>
                <Select value={manualType} onValueChange={setManualType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workoutTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(e.target.value)}
                  placeholder="30"
                  min="1"
                  max="300"
                />
              </div>
              <div className="space-y-2">
                <Label>Calories (optional)</Label>
                <Input
                  type="number"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(e.target.value)}
                  placeholder="Auto-estimated if empty"
                  min="0"
                />
              </div>
            </div>
            <Button
              onClick={handleLogManualWorkout}
              disabled={!manualDuration || isLogging}
              className="w-full"
            >
              {isLogging ? "Logging..." : "Log Workout"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
