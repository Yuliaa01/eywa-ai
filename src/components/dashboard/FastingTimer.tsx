import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, Square, Clock, Plus, Calendar as CalendarIcon, Edit2, Utensils, Save, X, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FastingCalendar } from "./FastingCalendar";
import { MealModal } from "@/components/modals/MealModal";
import { format } from "date-fns";

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
    startAt?: string;
    endAt?: string;
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

  // Update elapsed hours every second for smooth countdown
  // Also recalculates when startAt changes (e.g., after manual time edit)
  useEffect(() => {
    const updateElapsed = () => {
      const hours = calculateElapsedHours();
      setElapsedHours(hours);
    };
    
    // Immediate calculation when startAt changes
    updateElapsed();
    
    if (hasActiveFast && !isPaused) {
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [hasActiveFast, isPaused, calculateElapsedHours, fastingWindow.startAt]);

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
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            logFastingAction(user.id, activeFastId, "milestone_reached", {
              milestone: stage.label,
              hour: stage.hour,
              elapsed_hours: elapsedHours,
            });
          }

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

  // Sync state with props - active fast has startAt and id from DB query (actual_end_at IS NULL)
  useEffect(() => {
    const isActive = !!fastingWindow.startAt && !!fastingWindow.id;
    setHasActiveFast(isActive);
    setIsRunning(isActive && !(fastingWindow.isPaused || false));
    if (fastingWindow.id) {
      setActiveFastId(fastingWindow.id);
    }
    if (fastingWindow.startAt) {
      setNewStartTime(new Date(fastingWindow.startAt).toISOString().slice(0, 16));
    }
    setIsPaused(fastingWindow.isPaused || false);
  }, [fastingWindow]);

  // Auto-update every minute
  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  useEffect(() => {
    if (!hasActiveFast || isPaused) return;
    const interval = setInterval(() => {
      handleRefresh();
    }, 60000);
    return () => clearInterval(interval);
  }, [hasActiveFast, isPaused, handleRefresh]);

  // Protocol hours and progress calculations
  const protocolHours = parseInt(fastingWindow?.type?.split(":")[0] || "16");
  const progress = Math.min(elapsedHours / protocolHours, 1);
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

  // Format time as HH:MM:SS countdown
  const formatCountdown = (hours: number) => {
    const totalSeconds = Math.max(0, Math.floor(hours * 3600));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Circle dimensions
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference * (1 - progress);

  // Get stages to show on ring (only key milestones)
  const visibleStages = FASTING_STAGES.filter(s => s.hour > 0 && s.hour <= Math.max(protocolHours, 24));

  // Calculate position on circle for a given stage
  const getStagePosition = (stageHours: number) => {
    const maxHours = Math.max(protocolHours, 24);
    const progressRatio = stageHours / maxHours;
    const angle = (progressRatio * 360 - 90) * (Math.PI / 180); // Start from top
    const markerRadius = radius + 18; // Outside the ring
    return {
      x: size / 2 + markerRadius * Math.cos(angle),
      y: size / 2 + markerRadius * Math.sin(angle),
    };
  };

  // Event handlers - Start fast immediately
  const handleStart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in", description: "You need to be logged in to start fasting", variant: "destructive" });
        return;
      }

      const protocol = fastingWindow?.type || "16:8";
      const protocolH = parseInt(protocol.split(":")[0]) || 16;
      const startAt = new Date();
      const endAt = new Date(startAt.getTime() + protocolH * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from("fasting_windows")
        .insert({
          user_id: user.id,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          protocol: protocol,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the start action
      if (data) {
        await logFastingAction(user.id, data.id, "started", { protocol });
      }

      setIsRunning(true);
      setIsPaused(false);
      setHasActiveFast(true);
      setActiveFastId(data?.id || null);
      
      toast({ title: "Fasting started!", description: `${protocol} fast begins now` });
      onRefresh?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePause = async () => {
    setIsPaused(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && activeFastId) {
      await supabase.from("fasting_windows").update({ is_paused: true }).eq("id", activeFastId);
      logFastingAction(user.id, activeFastId, "paused", { elapsed_hours: elapsedHours });
    }
    toast({ title: "Fasting paused", description: "You can resume anytime." });
  };

  const handleResume = async () => {
    setIsPaused(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && activeFastId) {
      await supabase.from("fasting_windows").update({ is_paused: false }).eq("id", activeFastId);
      logFastingAction(user.id, activeFastId, "resumed", { elapsed_hours: elapsedHours });
    }
    toast({ title: "Fasting resumed", description: "Keep going!" });
  };

  const handleStop = () => setStopDialogOpen(true);

  const handleSaveFast = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (activeFastId) {
        await supabase.from("fasting_windows")
          .update({ actual_end_at: new Date().toISOString(), is_paused: false })
          .eq("id", activeFastId)
          .eq("user_id", user.id);
        
        logFastingAction(user.id, activeFastId, "completed", {
          elapsed_hours: elapsedHours,
          protocol_hours: protocolHours,
          final_stage: currentStage.label,
        });
      }

      toast({
        title: isExtendedFasting ? "Extended fast complete!" : "Fasting saved",
        description: `You fasted for ${formatCountdown(elapsedHours)}`,
      });
      
      setStopDialogOpen(false);
      setIsRunning(false);
      setIsPaused(false);
      setHasActiveFast(false);
      setActiveFastId(null);
      milestoneRef.current = -1;
      onRefresh?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
        // Delete associated logs first (foreign key constraint)
        await supabase.from("fasting_logs").delete().eq("fasting_window_id", activeFastId);
        // Then delete the fasting window
        await supabase.from("fasting_windows").delete().eq("id", activeFastId).eq("user_id", user.id);
      }

      toast({ title: "Fasting discarded" });
      setStopDialogOpen(false);
      setIsRunning(false);
      setIsPaused(false);
      setHasActiveFast(false);
      setActiveFastId(null);
      milestoneRef.current = -1;
      onRefresh?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateStartTime = async () => {
    if (!activeFastId || !newStartTime) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newStart = new Date(newStartTime);
      const newEnd = new Date(newStart.getTime() + protocolHours * 60 * 60 * 1000);

      await supabase.from("fasting_windows")
        .update({ start_at: newStart.toISOString(), end_at: newEnd.toISOString() })
        .eq("id", activeFastId);

      logFastingAction(user.id, activeFastId, "start_time_updated", {
        new_start: newStart.toISOString(),
      });

      toast({ title: "Start time updated" });
      setEditStartTimeOpen(false);
      onRefresh?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Fire icons based on progress
  const fireCount = Math.min(Math.floor(elapsedHours / 4), 5);

  return (
    <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-6 shadow-[0_4px_20px_rgba(18,175,203,0.06)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-rounded text-xl font-semibold text-foreground">Fasting Window</h3>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-rounded font-medium">
            {fastingWindow?.type || "16:8"}
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <button className="w-8 h-8 rounded-xl bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors">
                <CalendarIcon className="w-4 h-4 text-accent" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <FastingCalendar />
            </DialogContent>
          </Dialog>
          <button 
            onClick={onStartFasting}
            className="w-8 h-8 rounded-xl bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 text-accent" />
          </button>
        </div>
      </div>

      {/* Circular Progress Ring */}
      <TooltipProvider>
        <div className="flex justify-center mb-4">
          <div className="relative">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                opacity={0.3}
              />
              
              {/* Progress ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#circleGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={hasActiveFast ? progressOffset : circumference}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />

              {/* Gradient definition */}
              <defs>
                <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22C55E" />
                  <stop offset="50%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#12AFCB" />
                </linearGradient>
              </defs>

              {/* Progress indicator dot */}
              {hasActiveFast && (
                <circle
                  cx={size / 2 + radius * Math.cos((progress * 360 - 90) * Math.PI / 180)}
                  cy={size / 2 + radius * Math.sin((progress * 360 - 90) * Math.PI / 180)}
                  r={8}
                  fill="#FFF8E7"
                  stroke="#22C55E"
                  strokeWidth={2}
                  className="drop-shadow-lg"
                />
              )}
            </svg>

            {/* Stage markers outside ring */}
            {visibleStages.map((stage) => {
              const pos = getStagePosition(stage.hour);
              const isReached = elapsedHours >= stage.hour;
              const isCurrent = currentStage.hour === stage.hour;
              
              return (
                <Tooltip key={stage.hour}>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute w-6 h-6 flex items-center justify-center rounded-full text-xs cursor-pointer transition-all ${
                        isCurrent ? 'scale-125 animate-pulse' : ''
                      }`}
                      style={{
                        left: pos.x - 12,
                        top: pos.y - 12,
                        backgroundColor: isReached ? stage.color : 'hsl(var(--muted))',
                        opacity: isReached ? 1 : 0.4,
                        boxShadow: isCurrent ? `0 0 12px ${stage.color}` : 'none',
                      }}
                    >
                      <span className="text-[10px]">{stage.icon}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{stage.icon} {stage.label}</p>
                    <p className="text-xs text-muted-foreground">{stage.hour}h mark</p>
                    <p className="text-xs mt-1">{stage.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {hasActiveFast ? (
                <>
                  <span className="text-4xl mb-1">{currentStage.icon}</span>
                  <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
                    {formatCountdown(elapsedHours)}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: currentStage.color }}>
                    {currentStage.label}
                  </div>
                  {isExtendedFasting && (
                    <div className="text-xs text-accent font-medium mt-1 bg-accent/10 px-2 py-0.5 rounded-full">
                      +{formatCountdown(bonusHours)} bonus
                    </div>
                  )}
                  {isPaused && (
                    <div className="text-xs text-amber-500 font-medium mt-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      PAUSED
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="text-4xl mb-2">🍽️</span>
                  <p className="text-lg font-semibold text-foreground">Ready</p>
                  <p className="text-xs text-muted-foreground">Start when ready</p>
                </>
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* Start and Goal times */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Started</div>
          <button
            onClick={() => {
              if (hasActiveFast && fastingWindow.startAt) {
                setNewStartTime(new Date(fastingWindow.startAt).toISOString().slice(0, 16));
                setEditStartTimeOpen(true);
              }
            }}
            className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent transition-colors"
            disabled={!hasActiveFast}
          >
            {fastingWindow.startAt 
              ? format(new Date(fastingWindow.startAt), "EEE, h:mm a")
              : fastingWindow.start}
            {hasActiveFast && <Edit2 className="w-3 h-3 text-muted-foreground" />}
          </button>
        </div>
        
        <div className="flex items-center gap-0.5">
          {[...Array(fireCount)].map((_, i) => (
            <Flame key={i} className="w-4 h-4 text-orange-500" />
          ))}
        </div>
        
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Goal</div>
          <div className="text-sm font-medium text-foreground">
            {fastingWindow.endAt 
              ? format(new Date(fastingWindow.endAt), "EEE, h:mm a")
              : fastingWindow.end}
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-2 mt-auto">
        {!isRunning && !hasActiveFast ? (
          <Button
            onClick={handleStart}
            className="flex-1 bg-gradient-to-r from-green-500 to-accent text-white hover:shadow-lg rounded-full h-11"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Fast
          </Button>
        ) : hasActiveFast ? (
          <>
            {!isPaused ? (
              <Button onClick={handlePause} variant="outline" className="flex-1 border-accent/30 hover:bg-accent/10">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button onClick={handleResume} variant="outline" className="flex-1 border-accent/30 hover:bg-accent/10">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}
            <Button onClick={handleStop} variant="outline" className="flex-1 border-destructive/30 hover:bg-destructive/10 text-destructive">
              <Square className="w-4 h-4 mr-2" />
              End Fast
            </Button>
          </>
        ) : null}
      </div>

      {/* Stop Confirmation Dialog */}
      <Dialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isExtendedFasting ? "Complete Extended Fast" : "Complete Fasting Session"}</DialogTitle>
            <DialogDescription>
              You've fasted for {formatCountdown(elapsedHours)} and reached {currentStage.label}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button onClick={handleLogMeal} className="w-full bg-gradient-to-r from-green-500 to-accent text-white">
              <Utensils className="w-4 h-4 mr-2" />
              Log Meal & End Fast
            </Button>
            <Button onClick={handleSaveFast} variant="outline" className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Without Logging Meal
            </Button>
            <Button onClick={handleDiscard} variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
              <X className="w-4 h-4 mr-2" />
              Discard Fast
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Start Time Dialog */}
      <Dialog open={editStartTimeOpen} onOpenChange={setEditStartTimeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Start Time</DialogTitle>
            <DialogDescription>Adjust if you forgot to press start</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="datetime-local" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setEditStartTimeOpen(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={handleUpdateStartTime} className="flex-1">Update</Button>
            </div>
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
  );
}