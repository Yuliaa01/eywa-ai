import { useState, useEffect } from "react";
import { Heart, Calendar, Droplet, Plus, Settings, TrendingUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, addDays } from "date-fns";
import { CycleLogModal } from "@/components/modals/CycleLogModal";
import { CycleHistoryModal } from "@/components/modals/CycleHistoryModal";

interface CycleData {
  id: string;
  period_start_date: string;
  period_end_date: string | null;
  cycle_length: number | null;
  flow_intensity: string | null;
  symptoms: string[];
  notes: string | null;
}

interface CyclePreferences {
  average_cycle_length?: number;
  average_period_length?: number;
  reminder_days_before?: number;
}

const CYCLE_PHASES = [
  { name: "Menstrual", days: [1, 5], color: "#EC4899", emoji: "🩸" },
  { name: "Follicular", days: [6, 13], color: "#22C55E", emoji: "🌱" },
  { name: "Ovulation", days: [14, 16], color: "#F59E0B", emoji: "✨" },
  { name: "Luteal", days: [17, 28], color: "#8B5CF6", emoji: "🌙" },
];

export default function CycleTracker() {
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [preferences, setPreferences] = useState<CyclePreferences>({
    average_cycle_length: 28,
    average_period_length: 5,
    reminder_days_before: 3,
  });
  const [loading, setLoading] = useState(true);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<CycleData | null>(null);

  useEffect(() => {
    loadCycleData();
  }, []);

  const loadCycleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch cycle history
      const { data: cycleData } = await supabase
        .from("menstrual_cycles")
        .select("*")
        .eq("user_id", user.id)
        .order("period_start_date", { ascending: false })
        .limit(12);

      // Fetch preferences from user_profiles
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("cycle_preferences")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cycleData) {
        setCycles(cycleData.map((c: any) => ({
          ...c,
          symptoms: Array.isArray(c.symptoms) ? c.symptoms : []
        })));
      }

      if (profile?.cycle_preferences) {
        setPreferences({
          ...preferences,
          ...(profile.cycle_preferences as CyclePreferences)
        });
      }
    } catch (error) {
      console.error("Error loading cycle data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentCycleInfo = () => {
    if (cycles.length === 0) {
      return {
        currentDay: null,
        phase: null,
        nextPeriodDate: null,
        daysUntilPeriod: null,
        isOnPeriod: false,
      };
    }

    const lastCycle = cycles[0];
    const startDate = new Date(lastCycle.period_start_date);
    const today = new Date();
    const daysSinceStart = differenceInDays(today, startDate) + 1;
    
    // Calculate average cycle length from history
    const avgCycleLength = cycles.length > 1
      ? Math.round(cycles.slice(0, 6).reduce((sum, c) => sum + (c.cycle_length || preferences.average_cycle_length || 28), 0) / Math.min(cycles.length, 6))
      : preferences.average_cycle_length || 28;

    const currentDay = daysSinceStart > avgCycleLength ? daysSinceStart % avgCycleLength || avgCycleLength : daysSinceStart;
    
    // Determine current phase
    let currentPhase = CYCLE_PHASES[3]; // Default to Luteal
    for (const phase of CYCLE_PHASES) {
      if (currentDay >= phase.days[0] && currentDay <= phase.days[1]) {
        currentPhase = phase;
        break;
      }
    }

    // Calculate next period
    const nextPeriodDate = addDays(startDate, avgCycleLength);
    const daysUntilPeriod = differenceInDays(nextPeriodDate, today);

    // Check if currently on period
    const isOnPeriod = lastCycle.period_end_date 
      ? new Date(lastCycle.period_end_date) >= today && startDate <= today
      : daysSinceStart <= (preferences.average_period_length || 5);

    return {
      currentDay,
      phase: currentPhase,
      nextPeriodDate,
      daysUntilPeriod: daysUntilPeriod > 0 ? daysUntilPeriod : daysUntilPeriod + avgCycleLength,
      isOnPeriod,
      avgCycleLength,
    };
  };

  const handleLogPeriod = () => {
    setEditingCycle(null);
    setLogModalOpen(true);
  };

  const handleCycleSaved = () => {
    loadCycleData();
    setLogModalOpen(false);
    setEditingCycle(null);
  };

  const handleEditFromHistory = (cycle: CycleData) => {
    setEditingCycle(cycle);
    setHistoryModalOpen(false);
    setLogModalOpen(true);
  };

  const cycleInfo = getCurrentCycleInfo();

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border/50 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="h-24 bg-muted rounded" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-pink-500" />
            </div>
            <h3 className="font-semibold text-foreground">Cycle Tracker</h3>
          </div>
          <div className="flex items-center gap-1">
            {cycles.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setHistoryModalOpen(true)}
                title="View History"
              >
                <History className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleLogPeriod}
          >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {cycles.length === 0 ? (
          /* Empty State */
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-pink-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Start tracking your cycle for personalized insights
            </p>
            <Button
              onClick={handleLogPeriod}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log First Period
            </Button>
          </div>
        ) : (
          /* Cycle Info Display */
          <div className="space-y-4">
            {/* Current Phase Card */}
            <div 
              className="rounded-xl p-4 relative overflow-hidden"
              style={{ backgroundColor: `${cycleInfo.phase?.color}15` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{cycleInfo.phase?.emoji}</span>
                    <span 
                      className="font-semibold text-lg"
                      style={{ color: cycleInfo.phase?.color }}
                    >
                      {cycleInfo.phase?.name} Phase
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Day {cycleInfo.currentDay} of ~{cycleInfo.avgCycleLength}
                  </p>
                </div>
                <div className="text-right">
                  {cycleInfo.isOnPeriod ? (
                    <div className="flex items-center gap-1 text-pink-500">
                      <Droplet className="w-4 h-4" />
                      <span className="text-sm font-medium">On Period</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {cycleInfo.daysUntilPeriod}
                      </p>
                      <p className="text-xs text-muted-foreground">days until period</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Phase Progress Bar */}
              <div className="mt-3 flex gap-1">
                {CYCLE_PHASES.map((phase, idx) => {
                  const isActive = phase.name === cycleInfo.phase?.name;
                  const isPast = CYCLE_PHASES.indexOf(cycleInfo.phase!) > idx;
                  return (
                    <div
                      key={phase.name}
                      className="flex-1 h-2 rounded-full transition-all"
                      style={{
                        backgroundColor: isActive || isPast ? phase.color : `${phase.color}30`,
                        opacity: isActive ? 1 : isPast ? 0.7 : 0.4,
                      }}
                      title={phase.name}
                    />
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#12AFCB]" />
                  <span className="text-xs text-muted-foreground">Avg Cycle</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {cycleInfo.avgCycleLength} days
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-[#12AFCB]" />
                  <span className="text-xs text-muted-foreground">Next Period</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {cycleInfo.nextPeriodDate 
                    ? format(cycleInfo.nextPeriodDate, "MMM d")
                    : "—"
                  }
                </p>
              </div>
            </div>

            {/* Log Period Button */}
            <Button
              onClick={handleLogPeriod}
              variant="outline"
              className="w-full border-pink-500/30 text-pink-500 hover:bg-pink-500/10 hover:text-pink-500"
            >
              <Droplet className="w-4 h-4 mr-2" />
              {cycleInfo.isOnPeriod ? "Update Period" : "Log Period Start"}
            </Button>
          </div>
        )}
      </div>

      <CycleLogModal
        open={logModalOpen}
        onOpenChange={setLogModalOpen}
        editingCycle={editingCycle}
        onSaved={handleCycleSaved}
        preferences={preferences}
      />

      <CycleHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        cycles={cycles}
        onEditCycle={handleEditFromHistory}
      />
    </>
  );
}
