import { useState, useEffect } from "react";
import { Settings, Trash2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface Workout {
  id: string;
  block_name: string;
  created_at: string;
}

interface ActivitySummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  currentGoal: number;
  currentStreak: number;
}

export function ActivitySummaryDialog({
  open,
  onOpenChange,
  onSave,
  currentGoal,
  currentStreak,
}: ActivitySummaryDialogProps) {
  const [weeklyGoal, setWeeklyGoal] = useState(currentGoal);
  const [streak, setStreak] = useState(currentStreak);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setWeeklyGoal(currentGoal);
      setStreak(currentStreak);
      fetchWorkouts();
    }
  }, [open, currentGoal, currentStreak]);

  const fetchWorkouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get start of current week (Monday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      startOfWeek.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("workout_plans")
        .select("id, block_name, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startOfWeek.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from("workout_plans")
        .delete()
        .eq("id", workoutId);

      if (error) throw error;

      setWorkouts(prev => prev.filter(w => w.id !== workoutId));
      toast({
        title: "Workout deleted",
        description: "The workout has been removed",
      });
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast({
        title: "Error",
        description: "Failed to delete workout",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update weekly goal in user_profiles
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("fasting_pref")
        .eq("user_id", user.id)
        .maybeSingle();

      const currentPref = (profile?.fasting_pref as Record<string, unknown>) || {};
      
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: user.id,
          fasting_pref: {
            ...currentPref,
            weekly_workout_goal: weeklyGoal,
          },
        }, { onConflict: "user_id" });

      if (profileError) throw profileError;

      // Update streak in user_streaks
      const { data: existingStreak } = await supabase
        .from("user_streaks")
        .select("id")
        .eq("user_id", user.id)
        .eq("streak_type", "workout")
        .maybeSingle();

      if (existingStreak) {
        const { error: streakError } = await supabase
          .from("user_streaks")
          .update({
            current_count: streak,
            last_activity_date: streak > 0 ? new Date().toISOString().split("T")[0] : null,
            longest_streak: Math.max(streak, currentStreak),
          })
          .eq("id", existingStreak.id);

        if (streakError) throw streakError;
      } else {
        const { error: insertError } = await supabase
          .from("user_streaks")
          .insert({
            user_id: user.id,
            streak_type: "workout",
            current_count: streak,
            last_activity_date: streak > 0 ? new Date().toISOString().split("T")[0] : null,
            longest_streak: streak,
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Settings saved",
        description: "Your activity settings have been updated",
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetStreak = () => {
    setStreak(0);
    setShowResetConfirm(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#12AFCB]" />
              Edit Activity Summary
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Weekly Goal Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Weekly Workout Goal</label>
                <span className="text-sm text-muted-foreground">{weeklyGoal} workouts</span>
              </div>
              <Slider
                value={[weeklyGoal]}
                onValueChange={(value) => setWeeklyGoal(value[0])}
                min={1}
                max={7}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>7</span>
              </div>
            </div>

            <Separator />

            {/* This Week's Workouts */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                This Week's Workouts ({workouts.length})
              </label>
              {workouts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No workouts logged this week
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {workouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{workout.block_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(workout.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteWorkout(workout.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Streak Adjustment */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Streak Adjustment</label>
              <p className="text-xs text-muted-foreground">
                Manually adjust if you worked out but didn't log it
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-muted-foreground">Current streak:</span>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={streak}
                    onChange={(e) => setStreak(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 h-9 px-3 rounded-md border border-input bg-background text-sm"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Streak?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset your workout streak to 0 days. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetStreak}>
              Reset Streak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
