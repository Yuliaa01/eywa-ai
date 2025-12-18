import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, Activity, Sparkles } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, subMonths, addMonths, addDays } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CycleData {
  id: string;
  period_start_date: string;
  period_end_date: string | null;
  cycle_length: number | null;
  flow_intensity: string | null;
  symptoms: string[];
  notes: string | null;
}

interface CycleHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycles: CycleData[];
  onEditCycle: (cycle: CycleData) => void;
}

const SYMPTOM_INFO: Record<string, { label: string; emoji: string }> = {
  cramps: { label: "Cramps", emoji: "😣" },
  headache: { label: "Headache", emoji: "🤕" },
  bloating: { label: "Bloating", emoji: "🫄" },
  mood_swings: { label: "Mood Swings", emoji: "😢" },
  fatigue: { label: "Fatigue", emoji: "😴" },
  breast_tenderness: { label: "Breast Tenderness", emoji: "💔" },
  back_pain: { label: "Back Pain", emoji: "🔙" },
  acne: { label: "Acne", emoji: "😖" },
  cravings: { label: "Food Cravings", emoji: "🍫" },
  nausea: { label: "Nausea", emoji: "🤢" },
};

const FLOW_INFO: Record<string, { label: string; color: string }> = {
  spotting: { label: "Spotting", color: "#FCA5A5" },
  light: { label: "Light", color: "#F87171" },
  medium: { label: "Medium", color: "#EC4899" },
  heavy: { label: "Heavy", color: "#BE185D" },
};

// Prediction types
type DayType = "period" | "predicted_period" | "ovulation" | "fertile" | null;

export function CycleHistoryModal({
  open,
  onOpenChange,
  cycles,
  onEditCycle,
}: CycleHistoryModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calculate average cycle stats
  const cycleStats = useMemo(() => {
    const validCycles = cycles.filter((c) => c.cycle_length && c.cycle_length > 0);
    const avgLength = validCycles.length > 0
      ? Math.round(validCycles.reduce((sum, c) => sum + (c.cycle_length || 0), 0) / validCycles.length)
      : 28; // Default to 28 days
    
    const periodLengths = cycles
      .filter((c) => c.period_start_date && c.period_end_date)
      .map((c) => {
        const start = new Date(c.period_start_date);
        const end = new Date(c.period_end_date!);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      });
    
    const avgPeriod = periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : 5; // Default to 5 days

    return { avgLength, avgPeriod, totalCycles: cycles.length };
  }, [cycles]);

  // Get all calendar day info including predictions
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days: Map<string, { type: DayType; flow?: string | null; cycle?: CycleData; tooltip?: string }> = new Map();

    // Add actual period days
    cycles.forEach((cycle) => {
      const start = new Date(cycle.period_start_date);
      const end = cycle.period_end_date ? new Date(cycle.period_end_date) : start;
      
      const periodInterval = eachDayOfInterval({ start, end });
      periodInterval.forEach((day) => {
        if (isWithinInterval(day, { start: monthStart, end: monthEnd })) {
          days.set(format(day, "yyyy-MM-dd"), {
            type: "period",
            flow: cycle.flow_intensity,
            cycle,
            tooltip: `Period${cycle.flow_intensity ? ` (${FLOW_INFO[cycle.flow_intensity]?.label})` : ""}`,
          });
        }
      });
    });

    // Calculate predictions based on last cycle
    if (cycles.length > 0) {
      const lastCycle = cycles[0];
      const lastPeriodStart = new Date(lastCycle.period_start_date);
      const avgCycleLength = cycleStats.avgLength;
      const avgPeriodLength = cycleStats.avgPeriod;

      // Generate predictions for next 3 cycles
      for (let cycleNum = 1; cycleNum <= 3; cycleNum++) {
        const predictedPeriodStart = addDays(lastPeriodStart, avgCycleLength * cycleNum);
        const predictedPeriodEnd = addDays(predictedPeriodStart, avgPeriodLength - 1);
        
        // Ovulation typically occurs ~14 days before the next period
        const ovulationDay = addDays(predictedPeriodStart, -14);
        
        // Fertile window is typically 5 days before ovulation + ovulation day
        const fertileStart = addDays(ovulationDay, -5);
        const fertileEnd = addDays(ovulationDay, 1);

        // Add predicted period days
        const predictedPeriodDays = eachDayOfInterval({ start: predictedPeriodStart, end: predictedPeriodEnd });
        predictedPeriodDays.forEach((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          if (isWithinInterval(day, { start: monthStart, end: monthEnd }) && !days.has(dateKey)) {
            days.set(dateKey, {
              type: "predicted_period",
              tooltip: "Predicted period",
            });
          }
        });

        // Add fertile window days
        const fertileDays = eachDayOfInterval({ start: fertileStart, end: fertileEnd });
        fertileDays.forEach((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          if (isWithinInterval(day, { start: monthStart, end: monthEnd }) && !days.has(dateKey)) {
            const isOvulation = format(day, "yyyy-MM-dd") === format(ovulationDay, "yyyy-MM-dd");
            days.set(dateKey, {
              type: isOvulation ? "ovulation" : "fertile",
              tooltip: isOvulation ? "Predicted ovulation" : "Fertile window",
            });
          }
        });
      }
    }

    return days;
  }, [cycles, currentMonth, cycleStats]);

  // Calculate symptom patterns
  const symptomStats = useMemo(() => {
    const stats: Record<string, number> = {};
    cycles.forEach((cycle) => {
      (cycle.symptoms || []).forEach((symptom) => {
        stats[symptom] = (stats[symptom] || 0) + 1;
      });
    });
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [cycles]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getDayContent = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayInfo = calendarDays.get(dateKey);
    
    if (!dayInfo) return null;

    const getStyles = () => {
      switch (dayInfo.type) {
        case "period":
          const color = dayInfo.flow ? FLOW_INFO[dayInfo.flow]?.color : "#EC4899";
          return { backgroundColor: color, color: "white", border: "none" };
        case "predicted_period":
          return { 
            backgroundColor: "transparent", 
            border: "2px dashed #EC4899",
            color: "#EC4899",
          };
        case "ovulation":
          return { 
            backgroundColor: "#F59E0B", 
            color: "white",
            border: "none",
          };
        case "fertile":
          return { 
            backgroundColor: "#FEF3C7", 
            color: "#D97706",
            border: "1px solid #FCD34D",
          };
        default:
          return {};
      }
    };

    const styles = getStyles();

    const content = (
      <div
        className={`w-full h-full flex items-center justify-center ${dayInfo.type === "period" ? "cursor-pointer" : ""}`}
        onClick={() => dayInfo.cycle && onEditCycle(dayInfo.cycle)}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all"
          style={styles}
        >
          {dayInfo.type === "ovulation" ? "✨" : day.getDate()}
        </div>
      </div>
    );

    if (dayInfo.tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{dayInfo.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-pink-500" />
            </div>
            Cycle History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="border border-border rounded-xl overflow-hidden">
            <Calendar
              mode="single"
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="p-3 pointer-events-auto"
              classNames={{
                day_today: "bg-accent text-accent-foreground",
                day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-full",
              }}
              components={{
                DayContent: ({ date }) => {
                  const customContent = getDayContent(date);
                  if (customContent) return customContent;
                  return <span>{date.getDate()}</span>;
                },
              }}
              disabled={() => false}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span className="text-xs text-muted-foreground">Period</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border-2 border-dashed border-pink-500" />
              <span className="text-xs text-muted-foreground">Predicted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-muted-foreground">Ovulation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300" />
              <span className="text-xs text-muted-foreground">Fertile</span>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-[#12AFCB]" />
              </div>
              <p className="text-lg font-bold text-foreground">
                {cycleStats.avgLength || "—"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Cycle</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="w-3 h-3 text-pink-500" />
              </div>
              <p className="text-lg font-bold text-foreground">
                {cycleStats.avgPeriod || "—"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Period</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CalendarIcon className="w-3 h-3 text-purple-500" />
              </div>
              <p className="text-lg font-bold text-foreground">
                {cycleStats.totalCycles}
              </p>
              <p className="text-xs text-muted-foreground">Cycles</p>
            </div>
          </div>

          {/* Symptom Patterns */}
          {symptomStats.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <span className="text-lg">📊</span>
                Common Symptoms
              </h4>
              <div className="space-y-2">
                {symptomStats.map(([symptom, count]) => {
                  const info = SYMPTOM_INFO[symptom];
                  const percentage = Math.round((count / cycles.length) * 100);
                  return (
                    <div key={symptom} className="flex items-center gap-3">
                      <span className="text-lg w-6">{info?.emoji || "•"}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">
                            {info?.label || symptom}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {percentage}% of cycles
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-pink-400 to-pink-600"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Cycles List */}
          {cycles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <span className="text-lg">📅</span>
                Recent Cycles
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cycles.slice(0, 6).map((cycle) => (
                  <button
                    key={cycle.id}
                    onClick={() => onEditCycle(cycle)}
                    className="w-full p-3 rounded-lg border border-border hover:border-pink-500/50 hover:bg-pink-500/5 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {format(new Date(cycle.period_start_date), "MMM d, yyyy")}
                          {cycle.period_end_date && (
                            <span className="text-muted-foreground">
                              {" → "}{format(new Date(cycle.period_end_date), "MMM d")}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {cycle.flow_intensity && (
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: `${FLOW_INFO[cycle.flow_intensity]?.color}20`,
                                color: FLOW_INFO[cycle.flow_intensity]?.color,
                              }}
                            >
                              {FLOW_INFO[cycle.flow_intensity]?.label}
                            </span>
                          )}
                          {cycle.cycle_length && (
                            <span className="text-xs text-muted-foreground">
                              {cycle.cycle_length} day cycle
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {(cycle.symptoms || []).slice(0, 3).map((s) => (
                          <span key={s} className="text-sm">
                            {SYMPTOM_INFO[s]?.emoji}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
