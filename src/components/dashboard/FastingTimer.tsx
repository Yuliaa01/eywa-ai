import { useState, useEffect } from "react";
import { Play, Pause, Square, Clock, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FastingCalendar } from "./FastingCalendar";

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

  // Sync progress with prop changes and check if there's an active fast
  useEffect(() => {
    setCurrentProgress(fastingWindow.progress);
    setHasActiveFast(fastingWindow.progress > 0 && fastingWindow.progress < 100);
  }, [fastingWindow.progress]);

  // Auto-update progress every minute for active fasts
  useEffect(() => {
    if (!hasActiveFast) return;

    const interval = setInterval(() => {
      onRefresh?.();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [hasActiveFast, onRefresh]);

  // Calculate hours remaining based on protocol
  const calculateHoursRemaining = () => {
    const protocolHours = parseInt(fastingWindow.type.split(":")[0]) || 16;
    return Math.max(0, Math.ceil((100 - currentProgress) * protocolHours / 100));
  };

  const hoursRemaining = calculateHoursRemaining();

  return (
    <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-rounded text-xl font-semibold text-foreground">Fasting Window</h3>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal text-sm font-rounded font-medium">
            {fastingWindow.type}
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

        {/* Timer Status */}
        {!hasActiveFast && currentProgress === 0 && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Click the <Plus className="inline w-4 h-4 mx-1" /> button above to start a new fasting window
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
