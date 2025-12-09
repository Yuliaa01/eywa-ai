import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, Square, Clock, Plus, Calendar as CalendarIcon, Edit2, Utensils, Save, X, Sparkles } from "lucide-react";
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
  { hour: 36, label: "Growth Hormone", icon: "🚀", color: "#06b6d4", description: "HGH peaks, enhanced repair" },
  { hour: 48, label: "Immune Reset", icon: "🛡️", color: "#10b981", description: "Immune system regeneration" },
];

interface FastingTimerProps {
  fastingWindow: {
    start: string;
    end: string;
    progress: number;
    type: string;
    startAt?: string; // ISO timestamp
    endAt?: string; // ISO timestamp
    id?: string;
    isPaused?: boolean;
  };
  onStartFasting: () => void;
  onRefresh?: () => void;
}

// Helper to log fasting actions
const logFastingAction = async (
  userId: string,
  fastingWindowId: string,
  action: string,
  details?: Record<string, any>
) => {
  try {
    await supabase.from("fasting_logs").insert({
      user_id: userId,
      fasting_window_id: fastingWindowId,
      action,
      details: details || null,
    });
  } catch (error) {
    console.error("Error logging fasting action:", error);
  }
};

export default function FastingTimer({ fastingWindow, onStartFasting, onRefresh }: FastingTimerProps) {
  const [hasActiveFast, setHasActiveFast] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(fastingWindow.isPaused || false);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [editStartTimeOpen, setEditStartTimeOpen] = useState(false);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [newStartTime, setNewStartTime] = useState("");
  const [activeFastId, setActiveFastId] = useState<string | null>(fastingWindow.id || null);
  const [elapsedHours, setElapsedHours] = useState(0);
  const [lastMilestoneReached, setLastMilestoneReached] = useState<number>(-1);
  const milestoneRef = useRef<number>(-1);

  // Calculate elapsed hours from start time
  const calculateElapsedHours = useCallback(() => {
    if (!fastingWindow.startAt) return 0;
    const startTime = new Date(fastingWindow.startAt);
    const now = new Date();
    return Math.max(0, (now.getTime() - startTime.getTime()) / (1000 * 60 * 60));
  }, [fastingWindow.startAt]);

  // Update elapsed hours every minute
  useEffect(() => {
    const updateElapsed = () => {
      const hours = calculateElapsedHours();
      setElapsedHours(hours);
    };
    
    updateElapsed();
    
    if (hasActiveFast && !isPaused) {
      const interval = setInterval(updateElapsed, 60000);
      return () => clearInterval(interval);
    }
  }, [hasActiveFast, isPaused, calculateElapsedHours]);

  // Check for milestone achievements
  useEffect(() => {
    if (!hasActiveFast || !activeFastId) return;

    const checkMilestones = async () => {
      const currentMilestone = FASTING_STAGES.reduce((prev, stage) => {
        if (elapsedHours >= stage.hour && stage.hour > prev) {
          return stage.hour;
        }
        return prev;
      }, -1);

      if (currentMilestone > milestoneRef.current && milestoneRef.current !== -1) {
        const stage = FASTING_STAGES.find(s => s.hour === currentMilestone);
        if (stage) {
          // Log milestone
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            logFastingAction(user.id, activeFastId, "milestone_reached", {
              milestone: stage.label,
              hour: stage.hour,
              elapsed_hours: elapsedHours,
            });
          }

          // Show celebration toast
          toast({
            title: `${stage.icon} ${stage.label} Achieved!`,
            description: stage.description,
          });
        }
      }

      milestoneRef.current = currentMilestone;
      setLastMilestoneReached(currentMilestone);
    };

    checkMilestones();
  }, [elapsedHours, hasActiveFast, activeFastId]);

  // Sync state with props
  useEffect(() => {
    const isActive = !!fastingWindow.startAt && !fastingWindow.endAt;
    setHasActiveFast(isActive);
    setIsRunning(isActive && !isPaused);
    if (fastingWindow.id) {
      setActiveFastId(fastingWindow.id);
    }
    if (fastingWindow.startAt) {
      setNewStartTime(new Date(fastingWindow.startAt).toISOString().slice(0, 16));
    }
    setIsPaused(fastingWindow.isPaused || false);
  }, [fastingWindow]);

  // Wrap onRefresh in useCallback
  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  // Auto-update every minute
  useEffect(() => {
    if (!hasActiveFast || isPaused) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 60000);

    return () => clearInterval(interval);
  }, [hasActiveFast, isPaused, handleRefresh]);

  // Protocol hours and progress calculations
  const protocolHours = parseInt(fastingWindow?.type?.split(":")[0] || "16");
  const progress = Math.min((elapsedHours / protocolHours) * 100, 100);
  const isExtendedFasting = elapsedHours > protocolHours;
  const bonusHours = Math.max(0, elapsedHours - protocolHours);

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

  // Get stages relevant to display (protocol hours + extended if applicable)
  const getRelevantStages = () => {
    const maxHour = isExtendedFasting ? Math.max(protocolHours, elapsedHours + 2) : protocolHours;
    return FASTING_STAGES.filter(stage => stage.hour <= maxHour);
  };

  const relevantStages = getRelevantStages();
  const displayMaxHours = isExtendedFasting ? Math.max(protocolHours, Math.ceil(elapsedHours) + 2) : protocolHours;

  // Calculate position on arc for a given hour - FIXED positioning
  const getStagePosition = (hour: number) => {
    const normalizedProgress = Math.min(hour / displayMaxHours, 1);
    // Arc goes from left (π) to right (0), so we need to map progress accordingly
    const angle = Math.PI * (1 - normalizedProgress);
    const radius = 115;
    const centerX = 140;
    const centerY = 135;
    const cx = centerX + radius * Math.cos(angle);
    const cy = centerY - radius * Math.sin(angle);
    return { cx, cy };
  };

  // Get progress indicator position
  const getProgressPosition = () => {
    const displayProgress = Math.min(elapsedHours / displayMaxHours, 1);
    const angle = Math.PI * (1 - displayProgress);
    const radius = 115;
    const centerX = 140;
    const centerY = 135;
    return {
      cx: centerX + radius * Math.cos(angle),
      cy: centerY - radius * Math.sin(angle),
    };
  };

  const progressPos = getProgressPosition();

  const handleStart = async () => {
    setIsRunning(true);
    setIsPaused(false);
    onStartFasting();
    
    // Logging will happen after fast is created (in parent component)
  };

  const handlePause = async () => {
    setIsPaused(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user && activeFastId) {
      // Update database
      await supabase
        .from("fasting_windows")
        .update({ is_paused: true })
        .eq("id", activeFastId);
      
      // Log action
      logFastingAction(user.id, activeFastId, "paused", {
        elapsed_hours: elapsedHours,
        current_stage: currentStage.label,
      });
    }
    
    toast({
      title: "Fasting paused",
      description: "You can resume anytime.",
    });
  };

  const handleResume = async () => {
    setIsPaused(false);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user && activeFastId) {
      // Update database
      await supabase
        .from("fasting_windows")
        .update({ is_paused: false })
        .eq("id", activeFastId);
      
      // Log action
      logFastingAction(user.id, activeFastId, "resumed", {
        elapsed_hours: elapsedHours,
        current_stage: currentStage.label,
      });
    }
    
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

      if (activeFastId) {
        const { error } = await supabase
          .from("fasting_windows")
          .update({ 
            actual_end_at: new Date().toISOString(),
            is_paused: false,
          })
          .eq("id", activeFastId)
          .eq("user_id", user.id);

        if (error) throw error;
        
        // Log action
        logFastingAction(user.id, activeFastId, "completed", {
          elapsed_hours: elapsedHours,
          protocol_hours: protocolHours,
          extended_hours: bonusHours,
          final_stage: currentStage.label,
        });
      }

      toast({
        title: isExtendedFasting ? "Extended fast complete!" : "Fasting saved",
        description: `You fasted for ${Math.floor(elapsedHours)}h ${Math.round((elapsedHours % 1) * 60)}m. ${isExtendedFasting ? `+${bonusHours.toFixed(1)}h bonus!` : ''}`,
      });
      
      setStopDialogOpen(false);
      setIsRunning(false);
      setIsPaused(false);
      setHasActiveFast(false);
      setActiveFastId(null);
      milestoneRef.current = -1;
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

      if (activeFastId) {
        // Log before deleting
        logFastingAction(user.id, activeFastId, "discarded", {
          elapsed_hours: elapsedHours,
        });
        
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
      milestoneRef.current = -1;
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
      const newEnd = new Date(newStart.getTime() + protocolHours * 60 * 60 * 1000);

      const { error } = await supabase
        .from("fasting_windows")
        .update({
          start_at: newStart.toISOString(),
          end_at: newEnd.toISOString(),
        })
        .eq("id", activeFastId);

      if (error) throw error;

      // Log action
      logFastingAction(user.id, activeFastId, "start_time_updated", {
        new_start: newStart.toISOString(),
        new_end: newEnd.toISOString(),
      });

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

  // Format time display
  const formatElapsedTime = () => {
    const hours = Math.floor(elapsedHours);
    const minutes = Math.round((elapsedHours % 1) * 60);
    return `${hours}h ${minutes}m`;
  };

  const formatRemainingTime = () => {
    const remaining = protocolHours - elapsedHours;
    if (remaining <= 0) return null;
    const hours = Math.floor(remaining);
    const minutes = Math.round((remaining % 1) * 60);
    return `${hours}h ${minutes}m`;
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
                {/* Extended fasting gradient */}
                <linearGradient id="extendedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4361EE" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
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
                stroke={isExtendedFasting ? "url(#extendedGradient)" : "url(#fastingGradient)"}
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.2"
              />
              
              {/* Progress arc with gradient */}
              <path
                d="M 25 135 A 115 115 0 0 1 255 135"
                fill="none"
                stroke={isExtendedFasting ? "url(#extendedGradient)" : "url(#fastingGradient)"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(Math.min(elapsedHours / displayMaxHours, 1)) * 361} 361`}
                className="transition-all duration-500"
              />
              
              {/* Progress indicator dot */}
              {hasActiveFast && (
                <circle
                  cx={progressPos.cx}
                  cy={progressPos.cy}
                  r="7"
                  fill="white"
                  className="drop-shadow-lg transition-all duration-500"
                />
              )}
            </svg>
            
            {/* Stage markers along the arc */}
            {relevantStages.map((stage) => {
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
            
            {/* Current stage and time display centered in arc */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pt-2">
              {hasActiveFast ? (
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
                  
                  {isExtendedFasting ? (
                    <>
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Sparkles className="w-3 h-3 text-accent-teal" />
                        <span className="text-xs text-accent-teal font-medium">Extended!</span>
                      </div>
                      <p className="text-2xl font-rounded font-bold text-foreground">
                        {formatElapsedTime()}
                      </p>
                      <p className="text-xs text-accent-teal font-medium">
                        +{bonusHours.toFixed(1)}h bonus
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-rounded font-bold text-foreground">
                        {formatRemainingTime() || formatElapsedTime()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRemainingTime() ? 'remaining' : 'elapsed'}
                      </p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="text-2xl font-rounded font-bold text-foreground">
                    Ready
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Start when ready
                  </p>
                </>
              )}
            </div>
          </div>
        </TooltipProvider>

        {/* Timer Controls */}
        <div className="flex gap-2 mt-auto">
          {!isRunning && !hasActiveFast ? (
            <Button
              onClick={handleStart}
              className="flex-1 bg-gradient-to-r from-[#FF6B35] via-[#F72585] to-[#4361EE] text-white hover:shadow-[0_4px_20px_rgba(255,107,53,0.4)] rounded-full h-12 font-semibold"
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          ) : hasActiveFast ? (
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
          ) : null}
        </div>
        
        {/* Stop Confirmation Dialog */}
        <Dialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isExtendedFasting ? "Complete Extended Fast" : "Complete Fasting Session"}
              </DialogTitle>
              <DialogDescription>
                You've fasted for {formatElapsedTime()}.
                {isExtendedFasting && ` That's +${bonusHours.toFixed(1)}h beyond your ${protocolHours}h goal!`}
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
