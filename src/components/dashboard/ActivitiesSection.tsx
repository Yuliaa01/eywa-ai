import { Activity, MapPin, Play, TrendingUp, Calendar, Zap, Clock, Plus, Dumbbell, Trash2, Sparkles, Search, ExternalLink, RefreshCw, Star, Pause, Square, Check, Flame } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import stravaLogo from "@/assets/logos/strava.png";
import appleLogo from "@/assets/logos/apple.png";
import pelotonLogo from "@/assets/logos/peloton.png";
import nikeLogo from "@/assets/logos/nike.png";
import myfitnesspalLogo from "@/assets/logos/myfitnesspal.png";
import fitbitLogo from "@/assets/logos/fitbit.png";
import { WorkoutModal } from "@/components/modals/WorkoutModal";
import { SaveWorkoutDialog } from "@/components/modals/SaveWorkoutDialog";
import { GenerateWorkoutDialog } from "@/components/modals/GenerateWorkoutDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { SortableItem } from "@/components/ui/sortable-item";

export default function ActivitiesSection() {
  const navigate = useNavigate();
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [generateWorkoutOpen, setGenerateWorkoutOpen] = useState(false);
  const [saveWorkoutDialogOpen, setSaveWorkoutDialogOpen] = useState(false);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [workoutFilter, setWorkoutFilter] = useState<string>("all");
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [activeAppTab, setActiveAppTab] = useState<'all' | 'favorites' | 'recommended'>('all');
  const [connectedApps, setConnectedApps] = useState<Record<string, boolean>>({});
  const [syncingApps, setSyncingApps] = useState<Record<string, boolean>>({});
  const [favoriteApps, setFavoriteApps] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem('favoriteApps');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedWorkoutType, setSelectedWorkoutType] = useState("Upper Body Strength");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [selectedDuration, setSelectedDuration] = useState("45");
  const [workoutMode, setWorkoutMode] = useState<"ai" | "custom">("ai");
  const [selectedAISuggestion, setSelectedAISuggestion] = useState<number>(0);

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
      
      // If no user, show default workouts
      if (!user) {
        setWorkouts(defaultWorkouts);
        return;
      }

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

  const fitnessApps = [
    {
      id: 1,
      name: "Strava",
      logo: stravaLogo,
      trainingTypes: "Running, Cycling, Swimming",
      features: ["GPS tracking", "Heart rate", "Routes"],
      isFavorite: true,
      isRecommended: true
    },
    {
      id: 2,
      name: "Apple Fitness",
      logo: appleLogo,
      trainingTypes: "HIIT, Yoga, Strength",
      features: ["Apple Watch sync", "Guided workouts", "Rings"],
      isFavorite: false,
      isRecommended: true
    },
    {
      id: 3,
      name: "Peloton",
      logo: pelotonLogo,
      trainingTypes: "Cycling, Running, Strength",
      features: ["Live classes", "On-demand", "Leaderboard"],
      isFavorite: true,
      isRecommended: false
    },
    {
      id: 4,
      name: "Nike Training Club",
      logo: nikeLogo,
      trainingTypes: "Strength, HIIT, Yoga",
      features: ["Free workouts", "Expert trainers", "Nutrition tips"],
      isFavorite: false,
      isRecommended: true
    },
    {
      id: 5,
      name: "MyFitnessPal",
      logo: myfitnesspalLogo,
      trainingTypes: "Nutrition, Cardio, Strength",
      features: ["Calorie tracking", "Barcode scanner", "Recipe database"],
      isFavorite: true,
      isRecommended: false
    },
    {
      id: 6,
      name: "Fitbit",
      logo: fitbitLogo,
      trainingTypes: "Walking, Running, Sleep",
      features: ["Activity tracking", "Sleep analysis", "Heart rate"],
      isFavorite: false,
      isRecommended: true
    }
  ];

  const toggleFavorite = (appId: number) => {
    setFavoriteApps(prev => {
      const newFavorites = { ...prev, [appId]: !prev[appId] };
      localStorage.setItem('favoriteApps', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const filteredApps = fitnessApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
                         app.trainingTypes.toLowerCase().includes(appSearchQuery.toLowerCase());
    const matchesTab = activeAppTab === 'all' || 
                      (activeAppTab === 'favorites' && favoriteApps[app.id]) ||
                      (activeAppTab === 'recommended' && app.isRecommended);
    return matchesSearch && matchesTab;
  });

  const {
    orderedItems: orderedWorkouts,
    sensors: workoutSensors,
    handleDragEnd: handleWorkoutDragEnd,
    sortingStrategy: workoutSortingStrategy,
    itemIds: workoutIds,
  } = useDragAndDrop({
    items: defaultWorkouts,
    storageKey: 'dashboard-workouts-order',
    idExtractor: (item) => item.id,
  });

  const {
    orderedItems: orderedApps,
    sensors: appSensors,
    handleDragEnd: handleAppDragEnd,
    sortingStrategy: appSortingStrategy,
    itemIds: appIds,
  } = useDragAndDrop({
    items: filteredApps,
    storageKey: `fitness-apps-order-${activeAppTab}`,
    idExtractor: (item) => item.id,
    direction: 'horizontal',
  });

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

    // Fetch connected apps
    const fetchConnections = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('fitness_app_connections')
        .select('app_name, sync_status')
        .eq('user_id', user.id)
        .in('sync_status', ['connected', 'syncing']);

      if (!error && data) {
        const connections: Record<string, boolean> = {};
        data.forEach(conn => {
          connections[conn.app_name.toLowerCase()] = conn.sync_status === 'connected';
        });
        setConnectedApps(connections);
      }
    };

    fetchConnections();

    // Handle OAuth success/error
    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get('oauth_success');
    const oauthError = params.get('oauth_error');

    if (oauthSuccess) {
      toast({
        title: "App Connected",
        description: `Successfully connected to ${oauthSuccess}!`,
      });
      fetchConnections(); // Refresh connection status
      window.history.replaceState({}, '', '/dashboard');
    } else if (oauthError) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect: ${oauthError}`,
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/dashboard');
    }
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

  const handleConnectApp = async (appName: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to connect fitness apps",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('fitness-oauth-init', {
        body: { appName: appName.toLowerCase() },
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Redirect to OAuth provider - they will redirect back to our callback edge function
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      console.error('Connect app error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to initiate connection. Make sure API credentials are configured.",
        variant: "destructive",
      });
    }
  };

  const handleSyncData = async (appName: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to sync data",
          variant: "destructive",
        });
        return;
      }

      setSyncingApps(prev => ({ ...prev, [appName.toLowerCase()]: true }));

      const { data, error } = await supabase.functions.invoke('fitness-sync-data', {
        body: { appName: appName.toLowerCase() },
      });

      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: `Synced ${data.activityCount} activities from ${appName}`,
      });
    } catch (error: any) {
      console.error('Sync data error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync data",
        variant: "destructive",
      });
    } finally {
      setSyncingApps(prev => ({ ...prev, [appName.toLowerCase()]: false }));
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
        block_name: currentWorkout.type,
        sessions: [{
          duration: workoutSeconds,
          completed_at: new Date().toISOString(),
          ...(workoutMode === "custom" && { difficulty: selectedDifficulty }),
        }],
      }]);

      if (error) throw error;

      toast({
        title: "Workout saved",
        description: `${currentWorkout.type} (${formatTime(workoutSeconds)}) has been saved.`,
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

  const workoutTypes = [
    "Upper Body Strength",
    "Lower Body Strength", 
    "Full Body Strength",
    "HIIT Cardio",
    "Cardio Endurance",
    "Core & Abs",
    "Yoga & Flexibility",
    "Recovery & Stretching"
  ];

  const difficultyDurations = {
    Beginner: ["15", "30", "45"],
    Intermediate: ["30", "45", "60"],
    Advanced: ["45", "60", "90"]
  };

  const durations = difficultyDurations[selectedDifficulty];

  // Update duration when difficulty changes if current duration is not available
  useEffect(() => {
    if (!durations.includes(selectedDuration)) {
      setSelectedDuration(durations[1]); // Set to middle option
    }
  }, [selectedDifficulty]);

  const todaysPlan = {
    title: "Today's Workout",
    type: selectedWorkoutType,
    duration: `${selectedDuration} min`,
    difficulty: selectedDifficulty,
    thumbnail: "/placeholder.svg",
  };

  const motivationPulse = {
    energy: 85,
    streak: 12,
    weeklyGoal: 5,
    completed: 4,
  };

  // Calorie estimation based on workout type and duration
  const getCalorieEstimate = (workoutType: string, durationStr: string): number => {
    const minutes = parseInt(durationStr.match(/\d+/)?.[0] || "30");
    const caloriesPerMinute: Record<string, number> = {
      "Walk": 4,
      "Yoga": 3.5,
      "Zone 2 Cardio": 8,
      "HIIT": 12,
      "Running": 10,
      "Strength": 6,
      "Cycling": 9,
    };
    const rate = caloriesPerMinute[workoutType] || 5;
    return Math.round(rate * minutes);
  };

  const aiSuggestions = [
    {
      type: "Walk",
      duration: "30 min",
      time: "Morning",
      benefit: "Boost energy & focus",
      calories: getCalorieEstimate("Walk", "30 min"),
    },
    {
      type: "Yoga",
      duration: "20 min",
      time: "Evening",
      benefit: "Recovery & flexibility",
      calories: getCalorieEstimate("Yoga", "20 min"),
    },
    {
      type: "Zone 2 Cardio",
      duration: "40 min",
      time: "Afternoon",
      benefit: "Build aerobic base",
      calories: getCalorieEstimate("Zone 2 Cardio", "40 min"),
    },
  ];

  const currentWorkout = workoutMode === "ai" 
    ? {
        type: aiSuggestions[selectedAISuggestion].type,
        duration: aiSuggestions[selectedAISuggestion].duration,
        benefit: aiSuggestions[selectedAISuggestion].benefit,
      }
    : {
        type: selectedWorkoutType,
        duration: `${selectedDuration} min`,
        difficulty: selectedDifficulty,
      };

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
          <h3 className="font-rounded text-2xl font-semibold text-[#0E1012] mb-4">
            Today's Workout
          </h3>
          
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setWorkoutMode("ai")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-rounded font-medium transition-all ${
                workoutMode === "ai"
                  ? "bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] text-white shadow-[0_4px_12px_rgba(18,175,203,0.2)]"
                  : "bg-white/60 text-[#5A6B7F] hover:bg-white/80"
              }`}
            >
              AI Suggestions
            </button>
            <button
              onClick={() => setWorkoutMode("custom")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-rounded font-medium transition-all ${
                workoutMode === "custom"
                  ? "bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] text-white shadow-[0_4px_12px_rgba(18,175,203,0.2)]"
                  : "bg-white/60 text-[#5A6B7F] hover:bg-white/80"
              }`}
            >
              Custom Workout
            </button>
          </div>

          {/* AI Suggestions Mode */}
          {workoutMode === "ai" && (
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.type}
                  onClick={() => setSelectedAISuggestion(index)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedAISuggestion === index
                      ? "bg-white border-2 border-[#12AFCB] shadow-[0_4px_16px_rgba(18,175,203,0.15)]"
                      : "bg-white/60 border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-rounded font-semibold text-[#0E1012]">
                          {suggestion.type}
                        </h4>
                        {selectedAISuggestion === index && (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-[#5A6B7F]">{suggestion.benefit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#5A6B7F]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {suggestion.duration}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Flame className="w-4 h-4" />
                      <span className="font-medium">~{suggestion.calories} cal</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Custom Workout Mode */}
          {workoutMode === "custom" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-[#5A6B7F] mb-1.5 block">Workout Type</label>
                <Select value={selectedWorkoutType} onValueChange={setSelectedWorkoutType}>
                  <SelectTrigger className="bg-white/60 border-[#12AFCB]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workoutTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-[#5A6B7F] mb-1.5 block">Difficulty</label>
                <Select value={selectedDifficulty} onValueChange={(value: "Beginner" | "Intermediate" | "Advanced") => setSelectedDifficulty(value)}>
                  <SelectTrigger className="bg-white/60 border-[#12AFCB]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-[#5A6B7F] mb-1.5 block">Duration</label>
                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger className="bg-white/60 border-[#12AFCB]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((duration) => (
                      <SelectItem key={duration} value={duration}>{duration} min</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {!workoutActive && workoutSeconds === 0 ? (
          <>

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
                {currentWorkout.type} in progress
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

      {/* Fitness Apps Section */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="mb-6">
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Fitness Apps</h3>
          <p className="text-sm text-[#5A6B7F] mt-1">Connect and sync your favorite fitness apps</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A6B7F]" />
          <input
            type="text"
            placeholder="Search apps..."
            value={appSearchQuery}
            onChange={(e) => setAppSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/80 border border-[#12AFCB]/10 text-[#0E1012] placeholder:text-[#5A6B7F]/50 focus:outline-none focus:border-[#12AFCB]/30 focus:bg-white transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveAppTab('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeAppTab === 'all'
                ? 'bg-[#12AFCB] text-white shadow-sm'
                : 'bg-white/80 text-[#5A6B7F] hover:bg-[#12AFCB]/10 hover:text-[#12AFCB]'
            }`}
          >
            All Apps
          </button>
          <button
            onClick={() => setActiveAppTab('favorites')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeAppTab === 'favorites'
                ? 'bg-[#12AFCB] text-white shadow-sm'
                : 'bg-white/80 text-[#5A6B7F] hover:bg-[#12AFCB]/10 hover:text-[#12AFCB]'
            }`}
          >
            Favorites
          </button>
          <button
            onClick={() => setActiveAppTab('recommended')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeAppTab === 'recommended'
                ? 'bg-[#12AFCB] text-white shadow-sm'
                : 'bg-white/80 text-[#5A6B7F] hover:bg-[#12AFCB]/10 hover:text-[#12AFCB]'
            }`}
          >
            Recommended
          </button>
        </div>

        {/* Apps Grid */}
        {filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-[#12AFCB]/30 mx-auto mb-4" />
            <p className="text-[#5A6B7F]">No apps found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="group rounded-2xl bg-white/80 border border-[#12AFCB]/10 overflow-hidden hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all p-5"
              >
                {/* App Icon and Favorite */}
                <div className="flex items-center justify-between mb-4">
                  <img src={app.logo} alt={`${app.name} logo`} className="w-14 h-14 rounded-2xl object-contain" />
                  <button
                    onClick={() => toggleFavorite(app.id)}
                    className="hover:scale-110 transition-transform"
                    aria-label={favoriteApps[app.id] ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star className={`w-5 h-5 ${favoriteApps[app.id] ? 'fill-[#12AFCB] text-[#12AFCB]' : 'text-[#12AFCB]'}`} />
                  </button>
                </div>

                {/* App Name */}
                <h4 className="font-rounded text-lg font-semibold text-[#0E1012] mb-2">
                  {app.name}
                </h4>

                {/* Training Types */}
                <p className="text-sm text-[#5A6B7F] mb-3">
                  {app.trainingTypes}
                </p>

                {/* Features */}
                <div className="mb-4 pb-4 border-b border-[#12AFCB]/10">
                  <div className="flex flex-wrap gap-1.5">
                    {app.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-lg bg-[#12AFCB]/5 text-xs text-[#12AFCB] font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {connectedApps[app.name.toLowerCase()] ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-[#12AFCB]/20 hover:border-[#12AFCB] hover:bg-[#12AFCB]/5"
                        onClick={() => handleSyncData(app.name)}
                        disabled={syncingApps[app.name.toLowerCase()]}
                      >
                        <RefreshCw className={`w-4 h-4 mr-1.5 ${syncingApps[app.name.toLowerCase()] ? 'animate-spin' : ''}`} />
                        {syncingApps[app.name.toLowerCase()] ? 'Syncing...' : 'Sync Data'}
                      </Button>
                      <Badge variant="default" className="bg-green-500 text-white px-3 flex items-center">
                        Connected
                      </Badge>
                    </>
                  ) : (
                    <Button
                      className="flex-1 bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] hover:opacity-90 text-white"
                      size="sm"
                      onClick={() => handleConnectApp(app.name)}
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
