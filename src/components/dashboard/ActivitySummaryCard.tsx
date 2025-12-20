import { useState, useEffect } from "react";
import { Dumbbell, Flame, Target, Plus, Trophy, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RingProgress } from "./charts/RingProgress";
import { useToast } from "@/hooks/use-toast";
import { triggerConfetti } from "@/utils/confetti";
import { ActivitySummaryDialog } from "./ActivitySummaryDialog";
import { triggerWorkoutReward } from "@/hooks/useRewardTrigger";
interface ActivityStats {
  completedThisWeek: number;
  currentStreak: number;
  weeklyGoal: number;
}

export function ActivitySummaryCard() {
  const [stats, setStats] = useState<ActivityStats>({
    completedThisWeek: 0,
    currentStreak: 0,
    weeklyGoal: 5,
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivityStats();
  }, []);

  const fetchActivityStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get start of current week (Monday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      startOfWeek.setHours(0, 0, 0, 0);

      // Fetch workout plans created this week (as completed workouts)
      const { data: weeklyWorkouts, error: weeklyError } = await supabase
        .from("workout_plans")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", startOfWeek.toISOString());

      if (weeklyError) throw weeklyError;

      // Fetch all workouts for streak calculation (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentWorkouts, error: recentError } = await supabase
        .from("workout_plans")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (recentError) throw recentError;

      // Calculate streak
      const streak = calculateStreak(recentWorkouts || []);

      // Get weekly goal from user profile (default to 5)
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("fasting_pref")
        .eq("user_id", user.id)
        .single();

      const weeklyGoal = (profile?.fasting_pref as any)?.weekly_workout_goal || 5;

      setStats({
        completedThisWeek: weeklyWorkouts?.length || 0,
        currentStreak: streak,
        weeklyGoal,
      });
    } catch (error) {
      console.error("Error fetching activity stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (workouts: { created_at: string }[]): number => {
    if (!workouts.length) return 0;

    // Get unique dates with workouts
    const workoutDates = new Set(
      workouts.map(w => new Date(w.created_at).toDateString())
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's a workout today or yesterday to start the streak
    const todayStr = today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (!workoutDates.has(todayStr) && !workoutDates.has(yesterdayStr)) {
      return 0; // Streak broken
    }

    // Count consecutive days backwards
    let checkDate = workoutDates.has(todayStr) ? today : yesterday;
    
    while (workoutDates.has(checkDate.toDateString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  };

  const handleQuickLogWorkout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to log workouts",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("workout_plans").insert({
        user_id: user.id,
        block_name: "Quick Workout",
        sessions: { type: "quick", duration: 30 },
      });

      if (error) throw error;

      toast({
        title: "Workout logged! 💪",
        description: "Keep up the great work!",
      });

      triggerConfetti();
      fetchActivityStats();
      
      // Trigger reward check
      await triggerWorkoutReward(user.id);
    } catch (error) {
      console.error("Error logging workout:", error);
      toast({
        title: "Error",
        description: "Failed to log workout",
        variant: "destructive",
      });
    }
  };

  const progressPercent = Math.min((stats.completedThisWeek / stats.weeklyGoal) * 100, 100);
  const isOnTrack = stats.completedThisWeek >= Math.floor((new Date().getDay() || 7) * stats.weeklyGoal / 7);
  const goalReached = stats.completedThisWeek >= stats.weeklyGoal;

  const getMotivationalMessage = () => {
    if (goalReached) return "🎉 Weekly goal achieved! Amazing!";
    if (stats.currentStreak >= 7) return "🔥 Week-long streak! Incredible!";
    if (stats.currentStreak >= 3) return "💪 Great momentum! Keep it up!";
    if (isOnTrack) return "✨ You're on track this week!";
    if (stats.completedThisWeek > 0) return "👍 Good start! Keep moving!";
    return "🚀 Ready to start your week strong?";
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-40" />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-muted" />
                <div className="h-4 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">
          Activity Summary
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDialogOpen(true)}
            className="p-2 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            title="Edit Summary"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleQuickLogWorkout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12AFCB]/10 text-[#12AFCB] font-rounded font-medium text-sm hover:bg-[#12AFCB]/20 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" />
            Log Workout
          </button>
        </div>
      </div>

      <ActivitySummaryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={fetchActivityStats}
        currentGoal={stats.weeklyGoal}
        currentStreak={stats.currentStreak}
      />

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Completed This Week */}
        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            <RingProgress
              progress={progressPercent}
              color={goalReached ? "#22C55E" : "#12AFCB"}
              trackColor="rgba(18, 175, 203, 0.15)"
              size={80}
              strokeWidth={8}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#12AFCB]" />
            </div>
          </div>
          <span className="text-2xl font-bold text-[#0E1012]">
            {stats.completedThisWeek}/{stats.weeklyGoal}
          </span>
          <p className="text-sm text-[#5A6B7F]">This Week</p>
        </div>

        {/* Current Streak */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 mb-3 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
            <Flame className={`w-8 h-8 ${stats.currentStreak > 0 ? "text-amber-500" : "text-[#5A6B7F]"}`} />
          </div>
          <span className="text-2xl font-bold text-[#0E1012]">
            {stats.currentStreak}
          </span>
          <p className="text-sm text-[#5A6B7F]">Day Streak</p>
        </div>

        {/* Weekly Goal Status */}
        <div className="flex flex-col items-center">
          <div className={`w-20 h-20 mb-3 rounded-full flex items-center justify-center ${
            goalReached 
              ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10" 
              : isOnTrack 
                ? "bg-gradient-to-br from-[#12AFCB]/20 to-[#19D0E4]/10"
                : "bg-gradient-to-br from-amber-500/20 to-yellow-500/10"
          }`}>
            {goalReached ? (
              <Trophy className="w-8 h-8 text-green-500" />
            ) : (
              <Target className={`w-8 h-8 ${isOnTrack ? "text-[#12AFCB]" : "text-amber-500"}`} />
            )}
          </div>
          <span className="text-2xl font-bold text-[#0E1012]">
            {goalReached ? "Done!" : isOnTrack ? "On Track" : "Behind"}
          </span>
          <p className="text-sm text-[#5A6B7F]">Goal Status</p>
        </div>
      </div>

      {/* Motivational Message */}
      <div className={`text-center py-3 px-4 rounded-xl ${
        goalReached 
          ? "bg-green-500/10 text-green-700" 
          : isOnTrack 
            ? "bg-[#12AFCB]/10 text-[#12AFCB]"
            : "bg-amber-500/10 text-amber-700"
      }`}>
        <p className="font-rounded font-medium">{getMotivationalMessage()}</p>
      </div>
    </div>
  );
}
