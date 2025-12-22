import { useState, useEffect } from "react";
import { Play, Pause, Square, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { triggerWorkoutReward } from "@/hooks/useRewardTrigger";

const workoutTypes = [
  "HIIT",
  "Yoga",
  "Cycling",
  "Running",
  "Strength Training",
  "Swimming",
  "Walking",
  "Pilates",
];

export default function WorkoutTimer() {
  const [selectedType, setSelectedType] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!selectedType) return;
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = async () => {
    try {
      setIsRunning(false);

      // Only log if we actually have a session
      if (!selectedType || seconds <= 0) {
        setSeconds(0);
        setSelectedType("");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to log workouts",
          variant: "destructive",
        });
        setSeconds(0);
        setSelectedType("");
        return;
      }

      const { error } = await supabase.from("workout_plans").insert({
        user_id: user.id,
        block_name: selectedType,
        sessions: [{
          duration: seconds,
          completed_at: new Date().toISOString(),
        }],
      });

      if (error) throw error;

      toast({
        title: "Workout logged!",
        description: `${selectedType} (${formatTime(seconds)}) saved to your activity.`,
      });

      await triggerWorkoutReward(user.id);
    } catch (error) {
      console.error("Error logging workout timer:", error);
      toast({
        title: "Error",
        description: "Failed to save your workout",
        variant: "destructive",
      });
    } finally {
      setSeconds(0);
      setSelectedType("");
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-accent-teal/10 to-accent-teal-alt/5 backdrop-blur-xl border border-accent-teal/20 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.1)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-accent-teal" />
        </div>
        <h3 className="font-rounded text-xl font-semibold text-foreground">Fitness Workout</h3>
      </div>

      <div className="space-y-6">
        {/* Workout Type Selection */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground font-rounded font-medium">
            Activity Type
          </label>
          <Select value={selectedType} onValueChange={setSelectedType} disabled={isRunning}>
            <SelectTrigger className="w-full bg-card/60 border-border">
              <SelectValue placeholder="Choose activity type" />
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

        {/* Timer Display */}
        <div className="py-8 text-center">
          <div className="text-6xl font-bold font-rounded bg-gradient-to-r from-accent-teal to-accent-teal-alt bg-clip-text text-transparent">
            {formatTime(seconds)}
          </div>
          {selectedType && (
            <p className="mt-2 text-sm text-muted-foreground">
              {isRunning ? `${selectedType} in progress` : `Ready for ${selectedType}`}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              disabled={!selectedType}
              className="flex-1 bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white hover:shadow-[0_4px_20px_rgba(18,175,203,0.3)]"
            >
              <Play className="w-5 h-5 mr-2" />
              Start
            </Button>
          ) : (
            <>
              <Button
                onClick={handlePause}
                variant="outline"
                className="flex-1 border-accent-teal/30 hover:bg-accent-teal/10 hover:text-foreground"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
              <Button
                onClick={handleStop}
                variant="outline"
                className="flex-1 border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
