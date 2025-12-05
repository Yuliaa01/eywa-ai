import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Square, Clock, Plus, Calendar as CalendarIcon, Edit2, Utensils, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FastingCalendar } from "./FastingCalendar";
import { MealModal } from "@/components/modals/MealModal";

// Fasting metabolic stages with hour milestones
const FASTING_STAGES = [
  { hour: 0, label: "Fed", icon: "🍽️", color: "#94a3b8", description: "Digesting food, insulin elevated" },
  { hour: 4, label: "Post-Absorptive", icon: "📉", color: "#f59e0b", description: "Blood sugar stabilizing" },
  { hour: 12, label: "Ketones Begin", icon: "🔥", color: "#f97316", description: "Body starts producing ketones" },
  { hour: 16, label: "Fat Burning", icon: "⚡", color: "#ef4444", description: "Peak fat oxidation zone" },
  { hour: 18, label: "Autophagy", icon: "🧬", color: "#8b5cf6", description: "Cellular cleanup begins" },
  { hour: 24, label: "Deep Ketosis", icon: "💫", color: "#6366f1", description: "Maximum metabolic benefits" },
];
interface FastingTimerProps {
  fastingWindow: {
    start: string;
    end: string;
    progress: number;
    type: string;
  };
  onStartFasting: () => void;
  onRefresh?: () => void;
}

export default function FastingTimer({ fastingWindow, onStartFasting, onRefresh }: FastingTimerProps) {
  const [currentProgress, setCurrentProgress] = useState(fastingWindow.progress);
  const [hasActiveFast, setHasActiveFast] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [editStartTimeOpen, setEditStartTimeOpen] = useState(false);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [newStartTime, setNewStartTime] = useState("");
  const [activeFastId, setActiveFastId] = useState<string | null>(null);

  // Sync progress with prop changes and check if there's an active fast
  useEffect(() => {
    setCurrentProgress(fastingWindow.progress);
    const isActive = fastingWindow.progress > 0 && fastingWindow.progress < 100;
    setHasActiveFast(isActive);
    setIsRunning(isActive);
  }, [fastingWindow.progress]);

  // Fetch active fast ID
  useEffect(() => {
    const fetchActiveFast = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("fasting_windows")
        .select("id, start_at")
        .eq("user_id", user.id)
        .gte("end_at", new Date().toISOString())
        .order("start_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActiveFastId(data.id);
        setNewStartTime(new Date(data.start_at).toISOString().slice(0, 16));
      }
    };

    if (hasActiveFast) {
      fetchActiveFast();
    }
  }, [hasActiveFast]);

  // Wrap onRefresh in useCallback to prevent memory leaks
  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  // Auto-update progress every minute for active fasts
  useEffect(() => {
    if (!hasActiveFast || isPaused) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [hasActiveFast, isPaused, handleRefresh]);

  // Calculate hours remaining based on protocol with null checks
  const calculateHoursRemaining = () => {
    if (!fastingWindow?.type) return 0;
    const protocolHours = parseInt(fastingWindow.type.split(":")[0]) || 16;
    return Math.max(0, Math.ceil((100 - currentProgress) * protocolHours / 100));
  };

  const hoursRemaining = calculateHoursRemaining();
  
  // Calculate elapsed hours and current stage
  const protocolHours = parseInt(fastingWindow?.type?.split(":")[0] || "16");
  const elapsedHours = (currentProgress / 100) * protocolHours;
  
  // Get current metabolic stage
  const getCurrentStage = () => {
    for (let i = FASTING_STAGES.length - 1; i >= 0; i--) {
      if (elapsedHours >= FASTING_STAGES[i].hour) {
        return FASTING_STAGES[i];
      }
    }
    return FASTING_STAGES[0];
  };
  
  const currentStage = getCurrentStage();
  
  // Filter stages that are relevant to current protocol (only show stages within protocol duration)
  const relevantStages = FASTING_STAGES.filter(stage => stage.hour <= protocolHours);
  
  // Calculate position on arc for a given hour
  const getStagePosition = (hour: number) => {
    const progress = Math.min((hour / protocolHours) * 100, 100);
    const angle = (progress / 100) * Math.PI;
    const cx = 140 + 115 * Math.cos(Math.PI - angle);
    const cy = 135 - 115 * Math.sin(angle);
    return { cx, cy };
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    onStartFasting();
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
    setStopDialogOpen(true);
  };

  const handleSaveFast = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find the active fasting window and mark it as completed
      if (activeFastId) {
        const { error } = await supabase
          .from("fasting_windows")
          .update({ end_at: new Date().toISOString() })
          .eq("id", activeFastId)
          .eq("user_id", user.id);

        if (error) throw error;
      }

      toast({
        title: "Fasting saved",
        description: "Your fasting session has been recorded.",
      });
      
      setStopDialogOpen(false);
      setIsRunning(false);
      setIsPaused(false);
      setHasActiveFast(false);
      setActiveFastId(null);
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save fasting session",
        variant: "destructive",
      });
    }
  };

  const handleLogMeal = () => {
    setStopDialogOpen(false);
    setMealModalOpen(true);
  };

  const handleDiscard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete the active fasting window
      if (activeFastId) {
        const { error } = await supabase
          .from("fasting_windows")
          .delete()
          .eq("id", activeFastId)
          .eq("user_id", user.id);

        if (error) throw error;
      }

      toast({
        title: "Fasting discarded",
        description: "Your fasting session has been cancelled.",
      });
      
      setStopDialogOpen(false);
      setIsRunning(false);
      setIsPaused(false);
      setHasActiveFast(false);
      setActiveFastId(null);
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to discard fasting session",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStartTime = async () => {
    if (!activeFastId || !newStartTime || !fastingWindow?.type) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newStart = new Date(newStartTime);
      const protocolHours = parseInt(fastingWindow.type.split(":")[0]) || 16;
      const newEnd = new Date(newStart.getTime() + protocolHours * 60 * 60 * 1000);

      const { error } = await supabase
        .from("fasting_windows")
        .update({
          start_at: newStart.toISOString(),
          end_at: newEnd.toISOString(),
        })
        .eq("id", activeFastId);

      if (error) throw error;

      toast({
        title: "Start time updated",
        description: "Your fasting window has been adjusted.",
      });

      setEditStartTimeOpen(false);
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-6 shadow-[0_4px_20px_rgba(18,175,203,0.06)] h-[340px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-rounded text-xl font-semibold text-foreground">Fasting Window</h3>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal text-sm font-rounded font-medium">
            {fastingWindow?.type || "16:8"}
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <button 
                className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 flex items-center justify-center transition-colors"
                title="View fasting calendar"
              >
                <CalendarIcon className="w-4 h-4 text-[#12AFCB]" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <FastingCalendar />
            </DialogContent>
          </Dialog>
          <button 
            onClick={onStartFasting}
            className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 flex items-center justify-center transition-colors"
            title="Start new fasting window"
          >
            <Plus className="w-4 h-4 text-[#12AFCB]" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 flex-1 flex flex-col">
        {/* Time displays above arc */}
        <div className="flex items-center justify-between text-sm px-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            Start: {fastingWindow.start}
            {hasActiveFast && (
              <Dialog open={editStartTimeOpen} onOpenChange={setEditStartTimeOpen}>
                <DialogTrigger asChild>
                  <button className="ml-1 p-1 hover:bg-accent-teal/10 rounded">
                    <Edit2 className="w-3 h-3 text-accent-teal" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Start Time</DialogTitle>
                    <DialogDescription>
                      Adjust the start time if you forgot to press the button
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="datetime-local"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditStartTimeOpen(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateStartTime}
                        className="flex-1 bg-gradient-to-r from-[#FF6B35] via-[#F7B801] to-[#12AFCB]"
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            End: {fastingWindow.end}
          </div>
        </div>

        {/* Semi-circular progress arc */}
        <TooltipProvider>
          <div className="relative flex items-center justify-center py-2 flex-shrink-0">
            <svg width="280" height="150" viewBox="0 0 280 150" className="overflow-visible">
              <defs>
                {/* Gradient for progress arc */}
                <linearGradient id="fastingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF6B35" />
                  <stop offset="33%" stopColor="#F72585" />
                  <stop offset="66%" stopColor="#7209B7" />
                  <stop offset="100%" stopColor="#4361EE" />
                </linearGradient>
              </defs>
              
              {/* Background arc (light gray track) */}
              <path
                d="M 25 135 A 115 115 0 0 1 255 135"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.2"
              />
              
              {/* Full gradient arc at lower opacity (always visible) */}
              <path
                d="M 25 135 A 115 115 0 0 1 255 135"
                fill="none"
                stroke="url(#fastingGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.2"
              />
              
              {/* Progress arc with gradient (full opacity, fills based on progress) */}
              <path
                d="M 25 135 A 115 115 0 0 1 255 135"
                fill="none"
                stroke="url(#fastingGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(currentProgress / 100) * 361} 361`}
                className="transition-all duration-500"
              />
              
              {/* Progress indicator dot */}
              {currentProgress > 0 && currentProgress < 100 && (
                <circle
                  cx={25 + 230 * (currentProgress / 100)}
                  cy={135 - 115 * Math.sin((currentProgress / 100) * Math.PI)}
                  r="7"
                  fill="white"
                  className="drop-shadow-lg transition-all duration-500"
                />
              )}
            </svg>
            
            {/* Stage markers along the arc */}
            {relevantStages.map((stage, index) => {
              const pos = getStagePosition(stage.hour);
              const isPassed = elapsedHours >= stage.hour;
              const isCurrent = currentStage.hour === stage.hour;
              
              return (
                <Tooltip key={stage.hour}>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute flex flex-col items-center transition-all duration-300 cursor-pointer ${
                        isPassed ? 'opacity-100' : 'opacity-40'
                      } ${isCurrent ? 'scale-110' : ''}`}
                      style={{
                        left: pos.cx - 12,
                        top: pos.cy - 28,
                      }}
                    >
                      <span className="text-sm">{stage.icon}</span>
                      <div
                        className={`w-2 h-2 rounded-full mt-0.5 transition-all ${
                          isCurrent ? 'ring-2 ring-offset-1 ring-offset-background' : ''
                        }`}
                        style={{ 
                          backgroundColor: stage.color,
                          boxShadow: isCurrent ? `0 0 8px ${stage.color}` : 'none'
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="font-semibold">{stage.icon} {stage.label}</p>
                    <p className="text-xs text-muted-foreground">{stage.hour}h mark</p>
                    <p className="text-xs mt-1">{stage.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            
            {/* Current stage and hours remaining text centered in arc */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pt-2">
              {currentProgress < 100 ? (
                <>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-lg">{currentStage.icon}</span>
                    <span 
                      className="text-xs font-medium"
                      style={{ color: currentStage.color }}
                    >
                      {currentStage.label}
                    </span>
                  </div>
                  <p className="text-2xl font-rounded font-bold text-foreground">
                    {hoursRemaining}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    hours remaining
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-rounded font-bold text-foreground">
                    Complete!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💫 Full benefits achieved
                  </p>
                </>
              )}
            </div>
          </div>
        </TooltipProvider>

        {/* Timer Controls */}
        <div className="flex gap-2 mt-auto">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              className="flex-1 bg-gradient-to-r from-[#FF6B35] via-[#F72585] to-[#4361EE] text-white hover:shadow-[0_4px_20px_rgba(255,107,53,0.4)] rounded-full h-12 font-semibold"
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
        
        {/* Stop Confirmation Dialog */}
        <Dialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Fasting Session</DialogTitle>
              <DialogDescription>
                Would you like to log a meal or just save your fasting session?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button
                onClick={handleLogMeal}
                className="w-full bg-gradient-to-r from-accent-teal to-accent-teal-alt"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Log Meal
              </Button>
              <Button
                onClick={handleSaveFast}
                variant="outline"
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Session
              </Button>
              <Button
                onClick={handleDiscard}
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4 mr-2" />
                Discard
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Meal Modal */}
        <MealModal
          open={mealModalOpen}
          onOpenChange={setMealModalOpen}
          onSuccess={() => {
            setMealModalOpen(false);
            handleSaveFast();
          }}
          mealType="breakfast"
        />
      </div>
    </div>
  );
}
