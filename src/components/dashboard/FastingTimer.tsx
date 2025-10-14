import { useState, useEffect } from "react";
import { Play, Pause, Square, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FastingTimerProps {
  fastingWindow: {
    start: string;
    end: string;
    progress: number;
    type: string;
  };
}

export default function FastingTimer({ fastingWindow }: FastingTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(fastingWindow.progress);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setCurrentProgress((prev) => {
          if (prev >= 100) {
            setIsActive(false);
            toast({
              title: "Fasting complete! 🎉",
              description: "You've completed your fasting window.",
            });
            return 100;
          }
          return prev + 0.1; // Increment progress (adjust based on actual time)
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  const handleStart = async () => {
    setIsActive(true);
    setIsPaused(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Start a new fasting window
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 16 * 60 * 60 * 1000); // 16 hours later

      await supabase.from("fasting_windows").insert({
        user_id: user.id,
        start_at: startTime.toISOString(),
        end_at: endTime.toISOString(),
        protocol: "16:8",
      });

      toast({
        title: "Fasting started",
        description: "Good luck with your fast!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    toast({
      title: "Fasting paused",
      description: "You can resume anytime.",
    });
  };

  const handleResume = () => {
    setIsPaused(false);
    toast({
      title: "Fasting resumed",
      description: "Keep going!",
    });
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentProgress(0);
    toast({
      title: "Fasting stopped",
      description: "Progress has been reset.",
    });
  };

  const hoursRemaining = Math.round((100 - currentProgress) * 0.16);

  return (
    <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-rounded text-xl font-semibold text-foreground">Fasting Window</h3>
        <span className="px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal text-sm font-rounded font-medium">
          {fastingWindow.type}
        </span>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            Start: {fastingWindow.start}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            End: {fastingWindow.end}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-rounded font-semibold text-accent-teal">
              {currentProgress.toFixed(0)}%
            </span>
          </div>
          <div className="relative h-3 rounded-full bg-accent-teal/10 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent-teal to-accent-teal-alt transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          {currentProgress < 100
            ? `${hoursRemaining} hours remaining`
            : "Fasting window complete! 🎉"}
        </p>

        {/* Timer Controls */}
        <div className="flex gap-2 pt-2">
          {!isActive ? (
            <Button
              onClick={handleStart}
              className="flex-1 bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white hover:shadow-[0_4px_20px_rgba(18,175,203,0.3)]"
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          ) : (
            <>
              {!isPaused ? (
                <Button
                  onClick={handlePause}
                  variant="outline"
                  className="flex-1 border-accent-teal/30 hover:bg-accent-teal/10"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button
                  onClick={handleResume}
                  variant="outline"
                  className="flex-1 border-accent-teal/30 hover:bg-accent-teal/10"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button
                onClick={handleStop}
                variant="outline"
                className="flex-1 border-destructive/30 hover:bg-destructive/10 text-destructive"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
