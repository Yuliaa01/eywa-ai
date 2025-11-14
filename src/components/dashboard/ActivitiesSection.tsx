import { Activity, MapPin, Play, TrendingUp, Calendar, Zap, Clock, Plus, Dumbbell, Trash2, Sparkles } from "lucide-react";
import { WorkoutModal } from "@/components/modals/WorkoutModal";
import { SaveWorkoutDialog } from "@/components/modals/SaveWorkoutDialog";
import { GenerateWorkoutDialog } from "@/components/modals/GenerateWorkoutDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ActivitiesSection() {
  const navigate = useNavigate();
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [generateWorkoutOpen, setGenerateWorkoutOpen] = useState(false);
  const [saveWorkoutDialogOpen, setSaveWorkoutDialogOpen] = useState(false);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [workoutFilter, setWorkoutFilter] = useState<string>("all");

  const defaultWorkouts = [
    {
      id: "default-1",
      block_name: "Full Body Strength Training",
      sessions: {
        duration: "45 minutes",
        type: "strength",
        difficulty: "intermediate",
        equipment: "full",
        exercises: ["Squats", "Deadlifts", "Bench Press", "Rows", "Shoulder Press"],
        structure: "4 sets x 8-12 reps"
      },
      isDefault: true
    },
    {
      id: "default-2",
      block_name: "HIIT Cardio Blast",
      sessions: {
        duration: "30 minutes",
        type: "hiit",
        difficulty: "intermediate",
        equipment: "minimal",
        exercises: ["Burpees", "Mountain Climbers", "Jump Squats", "High Knees", "Plank Jacks"],
        structure: "40s work, 20s rest, 4 rounds"
      },
      isDefault: true
    },
    {
      id: "default-3",
      block_name: "Active Recovery & Mobility",
      sessions: {
        duration: "30 minutes",
        type: "recovery",
        difficulty: "beginner",
        equipment: "none",
        exercises: ["Dynamic Stretching", "Yoga Flow", "Foam Rolling", "Light Walking"],
        structure: "10 min each activity"
      },
      isDefault: true
    }
  ];

  const fetchWorkouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // If user has no workouts, show default ones
      if (!data || data.length === 0) {
        setWorkouts(defaultWorkouts);
      } else {
        setWorkouts(data);
      }
    } catch (error: any) {
      console.error("Error fetching workouts:", error);
      setWorkouts(defaultWorkouts);
    }
  };

  const filteredWorkouts = workoutFilter === "all" 
    ? workouts 
    : workouts.filter(w => w.sessions?.type === workoutFilter);

  const handleDeleteWorkout = async (id: string) => {
    try {
      const { error } = await supabase
        .from("workout_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Workout deleted",
        description: "Your workout has been removed.",
      });

      fetchWorkouts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleAddMovement = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("activity_suggestions").insert([{
        user_id: user.id,
        category: "movement" as any,
        title: "Quick Movement Break",
        duration_min: 10,
        date: new Date().toISOString().split('T')[0],
        reasoning: "Short movement to boost energy",
      }]);

      if (error) throw error;

      toast({
        title: "Movement added",
        description: "Quick movement suggestion created.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBookSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("activity_suggestions").insert([{
        user_id: user.id,
        category: "personal_session" as any,
        title: "AI Personal Training Session",
        duration_min: 60,
        date: new Date().toISOString().split('T')[0],
        context: "personal" as any,
        reasoning: "Personalized coaching session",
      }]);

      if (error) throw error;

      toast({
        title: "Session booked",
        description: "Your AI personal session has been scheduled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workoutActive) {
      interval = setInterval(() => {
        setWorkoutSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutActive]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartWorkout = () => {
    setWorkoutActive(true);
  };

  const handlePauseWorkout = () => {
    setWorkoutActive(false);
  };

  const handleResumeWorkout = () => {
    setWorkoutActive(true);
  };

  const handleStopWorkout = () => {
    setSaveWorkoutDialogOpen(true);
  };

  const handleSaveWorkout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("workout_plans").insert([{
        user_id: user.id,
        block_name: todaysPlan.type,
        sessions: [{
          duration: workoutSeconds,
          completed_at: new Date().toISOString(),
        }],
      }]);

      if (error) throw error;

      toast({
        title: "Workout saved",
        description: `${todaysPlan.type} (${formatTime(workoutSeconds)}) has been saved.`,
      });

      setWorkoutActive(false);
      setWorkoutSeconds(0);
      setSaveWorkoutDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDiscardWorkout = () => {
    setWorkoutActive(false);
    setWorkoutSeconds(0);
    setSaveWorkoutDialogOpen(false);
    toast({
      title: "Workout discarded",
      description: "Your workout was not saved.",
    });
  };

  const todaysPlan = {
    title: "Today's Workout",
    type: "Upper Body Strength",
    duration: "45 min",
    calories: "320 kcal",
    thumbnail: "/placeholder.svg",
  };

  const motivationPulse = {
    energy: 85,
    streak: 12,
    weeklyGoal: 5,
    completed: 4,
  };

  const aiSuggestions = [
    {
      type: "Walk",
      duration: "30 min",
      time: "Morning",
      benefit: "Boost energy & focus",
    },
    {
      type: "Yoga",
      duration: "20 min",
      time: "Evening",
      benefit: "Recovery & flexibility",
    },
    {
      type: "Zone 2 Cardio",
      duration: "40 min",
      time: "Afternoon",
      benefit: "Build aerobic base",
    },
  ];

  const localEvents = [
    {
      title: "Community Running Group",
      location: "Central Park",
      time: "Tomorrow 6:30 AM",
      distance: "0.8 mi",
      weather: "Clear, 65°F",
    },
    {
      title: "Outdoor Yoga Class",
      location: "Riverside Park",
      time: "Today 7:00 PM",
      distance: "1.2 mi",
      weather: "Sunny, 72°F",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Today's Workout with Timer */}
      <div className="rounded-3xl bg-gradient-to-br from-[#12AFCB]/10 to-[#19D0E4]/5 backdrop-blur-xl border border-[#12AFCB]/20 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.1)]">
        <div className="mb-6">
          <h3 className="font-rounded text-2xl font-semibold text-[#0E1012] mb-2">
            {todaysPlan.title}
          </h3>
          <p className="text-[#5A6B7F]">{todaysPlan.type}</p>
        </div>

        {!workoutActive && workoutSeconds === 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/60 border border-[#12AFCB]/10">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-[#12AFCB]" />
                  <span className="text-sm text-[#5A6B7F]">Duration</span>
                </div>
                <p className="font-rounded font-semibold text-[#0E1012]">{todaysPlan.duration}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/60 border border-[#12AFCB]/10">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-[#12AFCB]" />
                  <span className="text-sm text-[#5A6B7F]">Calories</span>
                </div>
                <p className="font-rounded font-semibold text-[#0E1012]">{todaysPlan.calories}</p>
              </div>
            </div>

            <button 
              onClick={handleStartWorkout}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] text-white font-rounded font-semibold text-lg shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-[0_8px_32px_rgba(18,175,203,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6" />
              Start Workout
            </button>
          </>
        ) : !workoutActive && workoutSeconds > 0 ? (
          <>
            <div className="py-8 text-center mb-6">
              <div className="text-6xl font-bold font-rounded bg-gradient-to-r from-accent-teal to-accent-teal-alt bg-clip-text text-transparent">
                {formatTime(workoutSeconds)}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Workout paused
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleResumeWorkout}
                className="flex-1 bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] hover:opacity-90"
              >
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
              <Button
                onClick={handleStopWorkout}
                variant="outline"
                className="flex-1 border-destructive/30 hover:bg-destructive/10 text-destructive"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="py-8 text-center mb-6">
              <div className="text-6xl font-bold font-rounded bg-gradient-to-r from-accent-teal to-accent-teal-alt bg-clip-text text-transparent">
                {formatTime(workoutSeconds)}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {todaysPlan.type} in progress
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handlePauseWorkout}
                variant="outline"
                className="flex-1 border-accent-teal/30 hover:bg-accent-teal/10"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
              <Button
                onClick={handleStopWorkout}
                variant="outline"
                className="flex-1 border-destructive/30 hover:bg-destructive/10 text-destructive"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Workouts Section */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#12AFCB]" />
            <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Your Workouts</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGenerateWorkoutOpen(true)}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWorkoutModalOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Workout Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            variant={workoutFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setWorkoutFilter("all")}
            className="rounded-full"
          >
            All Workouts
          </Button>
          <Button
            variant={workoutFilter === "strength" ? "default" : "outline"}
            size="sm"
            onClick={() => setWorkoutFilter("strength")}
            className="rounded-full"
          >
            Strength
          </Button>
          <Button
            variant={workoutFilter === "hiit" ? "default" : "outline"}
            size="sm"
            onClick={() => setWorkoutFilter("hiit")}
            className="rounded-full"
          >
            HIIT
          </Button>
          <Button
            variant={workoutFilter === "cardio" ? "default" : "outline"}
            size="sm"
            onClick={() => setWorkoutFilter("cardio")}
            className="rounded-full"
          >
            Cardio
          </Button>
          <Button
            variant={workoutFilter === "recovery" ? "default" : "outline"}
            size="sm"
            onClick={() => setWorkoutFilter("recovery")}
            className="rounded-full"
          >
            Recovery
          </Button>
        </div>

        <div className="grid gap-3">
          {filteredWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#5A6B7F] mb-4">No workouts found. Try a different filter or create a new workout!</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setGenerateWorkoutOpen(true)} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate Workout
                </Button>
                <Button variant="outline" onClick={() => setWorkoutModalOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Manually
                </Button>
              </div>
            </div>
          ) : (
            filteredWorkouts.map((workout) => (
              <Card key={workout.id} className="p-4 bg-white/40 border-[#12AFCB]/10 hover:border-[#12AFCB]/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[#0E1012]">{workout.block_name}</h4>
                      {workout.isDefault && (
                        <Badge variant="outline" className="text-xs bg-[#12AFCB]/5 text-[#12AFCB] border-[#12AFCB]/20">
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {workout.sessions?.duration && (
                        <div className="flex items-center gap-1 text-sm text-[#5A6B7F]">
                          <Clock className="w-3 h-3" />
                          {workout.sessions.duration}
                        </div>
                      )}
                      {workout.sessions?.type && (
                        <Badge variant="secondary" className="text-xs capitalize bg-[#12AFCB]/10 text-[#12AFCB] border-[#12AFCB]/20">
                          {workout.sessions.type}
                        </Badge>
                      )}
                      {workout.sessions?.difficulty && (
                        <Badge variant="outline" className="text-xs capitalize border-[#12AFCB]/20">
                          {workout.sessions.difficulty}
                        </Badge>
                      )}
                    </div>
                    {workout.sessions?.exercises && (
                      <p className="text-sm text-[#5A6B7F]">
                        {workout.sessions.exercises.join(" • ")}
                      </p>
                    )}
                  </div>
                  {!workout.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWorkout(workout.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Motivation Pulse */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <h3 className="font-rounded text-xl font-semibold text-[#0E1012] mb-6">
          Motivation Pulse
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#12AFCB]/20 to-[#19D0E4]/10 flex items-center justify-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] bg-clip-text text-transparent">
                {motivationPulse.energy}
              </span>
            </div>
            <p className="text-sm text-[#5A6B7F]">Energy Level</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#12AFCB]/20 to-[#19D0E4]/10 flex items-center justify-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] bg-clip-text text-transparent">
                {motivationPulse.streak}
              </span>
            </div>
            <p className="text-sm text-[#5A6B7F]">Day Streak</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#12AFCB]/20 to-[#19D0E4]/10 flex items-center justify-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] bg-clip-text text-transparent">
                {motivationPulse.completed}/{motivationPulse.weeklyGoal}
              </span>
            </div>
            <p className="text-sm text-[#5A6B7F]">This Week</p>
          </div>
        </div>
      </div>

      {/* AI Movement Suggestions */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#12AFCB]" />
            </div>
            <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">AI Suggestions</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4 text-[#12AFCB]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setWorkoutModalOpen(true)}>
                <Activity className="w-4 h-4 mr-2" />
                Add Workout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddMovement}>
                <Zap className="w-4 h-4 mr-2" />
                Add Movement
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBookSession}>
                <Calendar className="w-4 h-4 mr-2" />
                Book Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-3">
          {aiSuggestions.map((suggestion) => (
            <div
              key={suggestion.type}
              className="p-5 rounded-xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-rounded font-semibold text-[#0E1012] mb-1">
                    {suggestion.type}
                  </h4>
                  <p className="text-sm text-[#5A6B7F]">{suggestion.benefit}</p>
                </div>
                <Activity className="w-5 h-5 text-[#12AFCB]" />
              </div>
              <div className="flex items-center gap-4 text-sm text-[#5A6B7F]">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {suggestion.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {suggestion.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Local Events */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Local Events</h3>
          <button 
            onClick={() => navigate("/local-events")}
            className="text-[#12AFCB] font-rounded font-medium text-sm hover:underline"
          >
            View All
          </button>
        </div>
        <div className="space-y-4">
          {localEvents.map((event) => (
            <div
              key={event.title}
              className="p-6 rounded-2xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-rounded font-semibold text-[#0E1012] mb-2">{event.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-[#5A6B7F] mb-1">
                    <MapPin className="w-4 h-4" />
                    {event.location} • {event.distance}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#5A6B7F]">
                    <Calendar className="w-4 h-4" />
                    {event.time}
                  </div>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[#12AFCB]/10 text-[#12AFCB] text-sm font-rounded inline-flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#12AFCB]" />
                {event.weather}
              </div>
            </div>
          ))}
        </div>
      </div>

      <WorkoutModal open={workoutModalOpen} onOpenChange={setWorkoutModalOpen} onSuccess={fetchWorkouts} />
      <GenerateWorkoutDialog
        open={generateWorkoutOpen}
        onOpenChange={setGenerateWorkoutOpen}
        onSuccess={fetchWorkouts}
      />
      <SaveWorkoutDialog
        open={saveWorkoutDialogOpen}
        onOpenChange={setSaveWorkoutDialogOpen}
        onSave={handleSaveWorkout}
        onDiscard={handleDiscardWorkout}
        duration={formatTime(workoutSeconds)}
      />
    </div>
  );
}
