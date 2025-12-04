import { useState, useEffect } from "react";
import { HealthCategorySidebar } from "./HealthCategorySidebar";
import { MetricCard } from "./MetricCard";
import { categoryColors, ChartType } from "./charts";
import { LongevityGoalCard, WeeklyGoalCard, PlanCard } from "./cards";
import { AIChatCenter } from "@/components/priorities/AIChatCenter";
import { AISuggestionsPanel } from "@/components/priorities/AISuggestionsPanel";
import { GoalModal } from "@/components/modals/GoalModal";
import { DeleteConfirmDialog } from "@/components/priorities/DeleteConfirmDialog";
import { GoalProgress } from "@/components/glass/GoalProgress";
import { BodyMetricsModal } from "@/components/modals/BodyMetricsModal";
import { usePinnedMetrics } from "@/hooks/usePinnedMetrics";
import { fetchActivePriorities, deletePriority, restorePriority, type Priority } from "@/api/priorities";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Activity,
  Heart,
  Moon,
  Brain,
  Salad,
  Scale,
  Flame,
  TrendingUp,
  Footprints,
  Timer,
  Dumbbell,
  Droplet,
  Wind,
  Target,
  Pill,
  Accessibility,
  Stethoscope,
  FileText,
  Clock,
  Plus,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Sparkles,
  Pencil,
} from "lucide-react";

export default function ProfessionalPrioritiesSection() {
  const [activeCategory, setActiveCategory] = useState("pinned");
  const { isPinned, togglePin } = usePinnedMetrics();
  
  // Goals & Plans state
  const [globalGoals, setGlobalGoals] = useState<Priority[]>([]);
  const [temporaryGoals, setTemporaryGoals] = useState<Priority[]>([]);
  const [plans, setPlans] = useState<Priority[]>([]);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalModalMode, setGoalModalMode] = useState<'global' | 'temporary' | 'plan'>('global');
  const [editingGoal, setEditingGoal] = useState<Priority | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Priority | null>(null);
  
  // Body metrics modal state
  const [bodyMetricsModalOpen, setBodyMetricsModalOpen] = useState(false);
  
  // Body metrics data from database
  const [bodyMetricsData, setBodyMetricsData] = useState<{
    weight: string;
    height: string;
    bodyFat: string;
    temperature: string;
    skeletalMuscle: string;
    waist: string;
    visceralFat: string;
    bodyWater: string;
    bodyProtein: string;
    minerals: string;
    metabolicRate: string;
  }>({
    weight: "--",
    height: "--",
    bodyFat: "--",
    temperature: "--",
    skeletalMuscle: "--",
    waist: "--",
    visceralFat: "--",
    bodyWater: "--",
    bodyProtein: "--",
    minerals: "--",
    metabolicRate: "--",
  });

  // Load priorities
  useEffect(() => {
    loadPriorities();
    loadBodyMetrics();
  }, []);

  const loadBodyMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load from user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('height_cm, weight_kg')
        .eq('user_id', user.id)
        .maybeSingle();

      // Load latest vitals
      const { data: vitals } = await supabase
        .from('vitals_stream')
        .select('metric, value, recorded_at')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });

      const newData: typeof bodyMetricsData = {
        weight: "--",
        height: "--",
        bodyFat: "--",
        temperature: "--",
        skeletalMuscle: "--",
        waist: "--",
        visceralFat: "--",
        bodyWater: "--",
        bodyProtein: "--",
        minerals: "--",
        metabolicRate: "--",
      };

      // Set profile data
      if (profile?.height_cm) newData.height = String(profile.height_cm);
      if (profile?.weight_kg) newData.weight = String(profile.weight_kg);

      // Set latest vitals (get most recent for each metric)
      const latestVitals: Record<string, number> = {};
      vitals?.forEach(v => {
        if (!latestVitals[v.metric]) {
          latestVitals[v.metric] = v.value;
        }
      });

      if (latestVitals.weight) newData.weight = String(latestVitals.weight);
      if (latestVitals.body_fat) newData.bodyFat = String(latestVitals.body_fat);
      if (latestVitals.temp) newData.temperature = String(latestVitals.temp);
      if (latestVitals.skeletal_muscle_mass) newData.skeletalMuscle = String(latestVitals.skeletal_muscle_mass);
      if (latestVitals.waist_circumference) newData.waist = String(latestVitals.waist_circumference);
      if (latestVitals.visceral_fat) newData.visceralFat = String(latestVitals.visceral_fat);
      if (latestVitals.body_water) newData.bodyWater = String(latestVitals.body_water);
      if (latestVitals.body_protein) newData.bodyProtein = String(latestVitals.body_protein);
      if (latestVitals.minerals) newData.minerals = String(latestVitals.minerals);
      if (latestVitals.metabolic_rate) newData.metabolicRate = String(latestVitals.metabolic_rate);

      setBodyMetricsData(newData);
    } catch (error) {
      console.error('Failed to load body metrics:', error);
    }
  };

  const loadPriorities = async () => {
    try {
      const allPriorities = await fetchActivePriorities();
      setGlobalGoals(allPriorities.filter(p => p.type === 'global_goal'));
      setTemporaryGoals(allPriorities.filter(p => p.type === 'temporary_goal'));
      setPlans(allPriorities.filter(p => p.type === 'plan_trip' || p.type === 'plan_event'));
    } catch (error) {
      console.error('Failed to load priorities:', error);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    
    try {
      await deletePriority(goalToDelete.id);
      toast({
        title: "Goal deleted",
        description: "Click to undo",
        action: (
          <Button variant="outline" size="sm" onClick={() => handleRestoreGoal(goalToDelete.id)}>
            Undo
          </Button>
        ),
      });
      loadPriorities();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete goal", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    }
  };

  const handleRestoreGoal = async (id: string) => {
    try {
      await restorePriority(id);
      toast({ title: "Goal restored" });
      loadPriorities();
    } catch (error) {
      toast({ title: "Error", description: "Failed to restore goal", variant: "destructive" });
    }
  };

  const handleEditGoal = (goal: Priority) => {
    setEditingGoal(goal);
    const mode = goal.type === 'global_goal' ? 'global' : goal.type === 'temporary_goal' ? 'temporary' : 'plan';
    setGoalModalMode(mode);
    setGoalModalOpen(true);
  };

  const handleAddGoal = (mode: 'global' | 'temporary' | 'plan') => {
    setEditingGoal(null);
    setGoalModalMode(mode);
    setGoalModalOpen(true);
  };

  // Mock data generators
  const generateTrendData = () =>
    Array.from({ length: 7 }, () => Math.random() * 100 + 50);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Pinned metrics (user's favorites)
  const pinnedMetrics = [
    {
      icon: <Footprints className="w-4 h-4" />,
      title: "Steps",
      value: "8,542",
      unit: "steps",
      timestamp: `Today, ${getCurrentTime()}`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
      chartType: "sparkline" as ChartType,
      color: categoryColors.activity.primary,
    },
    {
      icon: <Moon className="w-4 h-4" />,
      title: "Sleep Score",
      value: "82",
      unit: "/ 100",
      timestamp: "Last night",
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
      chartType: "ring" as ChartType,
      color: categoryColors.sleep.primary,
      progress: 82,
    },
    {
      icon: <Flame className="w-4 h-4" />,
      title: "Active Calories",
      value: "420",
      unit: "cal",
      timestamp: `Today, ${getCurrentTime()}`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
      chartType: "ring" as ChartType,
      color: categoryColors.nutrition.primary,
      progress: 70,
    },
    {
      icon: <Heart className="w-4 h-4" />,
      title: "Heart Rate",
      value: "68",
      unit: "BPM",
      timestamp: `Just now`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
      chartType: "wave" as ChartType,
      color: categoryColors.heart.primary,
    },
  ];

  // Activity metrics
  const activityMetrics = [
    {
      icon: <Flame className="w-4 h-4" />,
      title: "Move",
      value: "420",
      unit: "/ 600 cal",
      timestamp: `Today, ${getCurrentTime()}`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
      chartType: "ring" as ChartType,
      color: categoryColors.activity.primary,
      progress: 70,
    },
    {
      icon: <Timer className="w-4 h-4" />,
      title: "Exercise",
      value: "28",
      unit: "/ 30 min",
      timestamp: `Today`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
      chartType: "ring" as ChartType,
      color: "#F59E0B",
      progress: 93,
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Stand",
      value: "10",
      unit: "/ 12 hrs",
      timestamp: `Today`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
      chartType: "ring" as ChartType,
      color: "#06B6D4",
      progress: 83,
    },
    {
      icon: <Footprints className="w-4 h-4" />,
      title: "Steps",
      value: "8,542",
      unit: "steps",
      timestamp: `Today, ${getCurrentTime()}`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
      chartType: "sparkline" as ChartType,
      color: categoryColors.activity.primary,
    },
    {
      icon: <Target className="w-4 h-4" />,
      title: "Distance",
      value: "6.8",
      unit: "km",
      timestamp: `Today`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
      chartType: "sparkline" as ChartType,
      color: "#10B981",
    },
    {
      icon: <Dumbbell className="w-4 h-4" />,
      title: "Workouts",
      value: "45",
      unit: "min",
      timestamp: "Morning run",
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
      chartType: "trend" as ChartType,
      color: categoryColors.activity.primary,
    },
  ];

  // Body measurement metrics
  const bodyMetrics = [
    { icon: <Scale className="w-4 h-4" />, title: "Weight", value: bodyMetricsData.weight, unit: "kg", timestamp: "From profile", trendData: generateTrendData(), hasData: bodyMetricsData.weight !== "--", badge: undefined, chartType: "sparkline" as ChartType, color: categoryColors.body.primary },
    { icon: <TrendingUp className="w-4 h-4" />, title: "Height", value: bodyMetricsData.height, unit: "cm", timestamp: "Profile", hasData: bodyMetricsData.height !== "--", badge: undefined, chartType: "trend" as ChartType, color: categoryColors.body.primary },
    { icon: <Scale className="w-4 h-4" />, title: "Body Fat %", value: bodyMetricsData.bodyFat, unit: "%", timestamp: "Last recorded", trendData: generateTrendData(), hasData: bodyMetricsData.bodyFat !== "--", badge: bodyMetricsData.bodyFat === "--" ? "No data" : undefined, chartType: "gradient" as ChartType, color: categoryColors.body.primary, progress: 22 },
    { icon: <Scale className="w-4 h-4" />, title: "BMI", value: bodyMetricsData.weight !== "--" && bodyMetricsData.height !== "--" ? (parseFloat(bodyMetricsData.weight) / Math.pow(parseFloat(bodyMetricsData.height) / 100, 2)).toFixed(1) : "--", unit: "", timestamp: "Calculated", trendData: generateTrendData(), hasData: bodyMetricsData.weight !== "--" && bodyMetricsData.height !== "--", badge: undefined, chartType: "gradient" as ChartType, color: categoryColors.body.primary, progress: 45 },
    { icon: <Dumbbell className="w-4 h-4" />, title: "Skeletal Muscle Mass", value: bodyMetricsData.skeletalMuscle, unit: "kg", timestamp: bodyMetricsData.skeletalMuscle !== "--" ? "Last recorded" : "No data", trendData: generateTrendData(), hasData: bodyMetricsData.skeletalMuscle !== "--", badge: bodyMetricsData.skeletalMuscle === "--" ? "No data" : undefined, chartType: "sparkline" as ChartType, color: "#10B981" },
    { icon: <Target className="w-4 h-4" />, title: "Waist", value: bodyMetricsData.waist, unit: "cm", timestamp: bodyMetricsData.waist !== "--" ? "Last recorded" : "No data", trendData: generateTrendData(), hasData: bodyMetricsData.waist !== "--", badge: bodyMetricsData.waist === "--" ? "No data" : undefined, chartType: "trend" as ChartType, color: categoryColors.body.primary },
    { icon: <Activity className="w-4 h-4" />, title: "Temperature", value: bodyMetricsData.temperature, unit: "°C", timestamp: "Last recorded", trendData: generateTrendData(), hasData: bodyMetricsData.temperature !== "--", badge: bodyMetricsData.temperature === "--" ? "No data" : undefined, chartType: "thermometer" as ChartType, color: "#F59E0B" },
    { icon: <Flame className="w-4 h-4" />, title: "Visceral Fat", value: bodyMetricsData.visceralFat, unit: "level", timestamp: bodyMetricsData.visceralFat !== "--" ? "Last recorded" : "No data", trendData: generateTrendData(), hasData: bodyMetricsData.visceralFat !== "--", badge: bodyMetricsData.visceralFat === "--" ? "No data" : undefined, chartType: "gradient" as ChartType, color: "#EF4444", progress: 30 },
    { icon: <Droplet className="w-4 h-4" />, title: "Body Water", value: bodyMetricsData.bodyWater, unit: "%", timestamp: bodyMetricsData.bodyWater !== "--" ? "Last recorded" : "No data", trendData: generateTrendData(), hasData: bodyMetricsData.bodyWater !== "--", badge: bodyMetricsData.bodyWater === "--" ? "No data" : undefined, chartType: "ring" as ChartType, color: "#06B6D4", progress: bodyMetricsData.bodyWater !== "--" ? parseFloat(bodyMetricsData.bodyWater) : 0 },
    { icon: <Salad className="w-4 h-4" />, title: "Body Protein", value: bodyMetricsData.bodyProtein, unit: "%", timestamp: bodyMetricsData.bodyProtein !== "--" ? "Last recorded" : "No data", trendData: generateTrendData(), hasData: bodyMetricsData.bodyProtein !== "--", badge: bodyMetricsData.bodyProtein === "--" ? "No data" : undefined, chartType: "trend" as ChartType, color: "#8B5CF6" },
    { icon: <Scale className="w-4 h-4" />, title: "Minerals", value: bodyMetricsData.minerals, unit: "kg", timestamp: bodyMetricsData.minerals !== "--" ? "Last recorded" : "No data", trendData: generateTrendData(), hasData: bodyMetricsData.minerals !== "--", badge: bodyMetricsData.minerals === "--" ? "No data" : undefined, chartType: "trend" as ChartType, color: categoryColors.body.primary },
    { icon: <Flame className="w-4 h-4" />, title: "Metabolic Rate", value: bodyMetricsData.metabolicRate, unit: "kcal/day", timestamp: bodyMetricsData.metabolicRate !== "--" ? "Last recorded" : "No data", trendData: generateTrendData(), hasData: bodyMetricsData.metabolicRate !== "--", badge: bodyMetricsData.metabolicRate === "--" ? "No data" : undefined, chartType: "sparkline" as ChartType, color: "#F59E0B" },
  ];

  // Nutrition metrics
  const nutritionMetrics = [
    { icon: <Flame className="w-4 h-4" />, title: "Calories", value: "1,850", unit: "/ 2,200 cal", timestamp: `Today, ${getCurrentTime()}`, trendData: generateTrendData(), hasData: true, badge: undefined, chartType: "ring" as ChartType, color: categoryColors.nutrition.primary, progress: 84 },
    { icon: <Salad className="w-4 h-4" />, title: "Protein", value: "95", unit: "/ 120g", timestamp: `Today`, trendData: generateTrendData(), hasData: true, badge: undefined, chartType: "ring" as ChartType, color: "#7DD3FC", progress: 79 },
    { icon: <Droplet className="w-4 h-4" />, title: "Water", value: "2.1", unit: "/ 3.0 L", timestamp: `Today`, trendData: generateTrendData(), hasData: true, badge: undefined, chartType: "ring" as ChartType, color: "#06B6D4", progress: 70 },
    { icon: <Salad className="w-4 h-4" />, title: "Supplements", value: "3", unit: "taken", timestamp: "This morning", hasData: true, badge: undefined, chartType: "donut" as ChartType, color: "#A78BFA" },
  ];

  // Sleep metrics
  const sleepMetrics = [
    { icon: <Moon className="w-4 h-4" />, title: "Sleep Duration", value: "7.5", unit: "hours", timestamp: "Last night", trendData: generateTrendData(), hasData: true, badge: undefined, chartType: "bars" as ChartType, color: categoryColors.sleep.primary },
    { icon: <Moon className="w-4 h-4" />, title: "Time in Bed", value: "8.2", unit: "hours", timestamp: "Last night", trendData: generateTrendData(), hasData: true, badge: undefined, chartType: "sparkline" as ChartType, color: categoryColors.sleep.primary },
    { icon: <Moon className="w-4 h-4" />, title: "Sleep Score", value: "82", unit: "/ 100", timestamp: "Last night", trendData: generateTrendData(), hasData: true, badge: undefined, chartType: "ring" as ChartType, color: categoryColors.sleep.primary, progress: 82 },
  ];

  // Heart/Vitals metrics
  const heartMetrics = [
    { icon: <Heart className="w-4 h-4" />, title: "Heart Rate", value: "68", unit: "BPM", timestamp: `Just now`, trendData: generateTrendData(), hasData: true, badge: undefined, chartType: "wave" as ChartType, color: categoryColors.heart.primary },
    { icon: <Heart className="w-4 h-4" />, title: "Resting HR", value: "58", unit: "BPM", timestamp: "Average today", trendData: generateTrendData(), hasData: true, badge: undefined, chartType: "sparkline" as ChartType, color: categoryColors.heart.primary },
    { icon: <Activity className="w-4 h-4" />, title: "HRV", value: "65", unit: "ms", timestamp: "Last night", trendData: generateTrendData(), hasData: true, badge: undefined, chartType: "gradient" as ChartType, color: categoryColors.heart.primary, progress: 65 },
    { icon: <Wind className="w-4 h-4" />, title: "Blood Oxygen", value: "98", unit: "%", timestamp: "Last night", hasData: false, badge: "Demo", chartType: "ring" as ChartType, color: "#06B6D4", progress: 98 },
    { icon: <Wind className="w-4 h-4" />, title: "Respiratory Rate", value: "14", unit: "/ min", timestamp: "Last night", hasData: false, badge: "Demo", chartType: "sparkline" as ChartType, color: categoryColors.respiratory.primary },
  ];

  // Mental wellbeing metrics
  const mentalMetrics = [
    { icon: <Brain className="w-4 h-4" />, title: "Stress Level", value: "4", unit: "/ 10", timestamp: `Today, ${getCurrentTime()}`, trendData: generateTrendData(), hasData: true, badge: "Demo", chartType: "gradient" as ChartType, color: categoryColors.mental.primary, progress: 40 },
    { icon: <Brain className="w-4 h-4" />, title: "Mindful Minutes", value: "12", unit: "min", timestamp: "This morning", trendData: generateTrendData(), hasData: true, badge: "Demo", chartType: "ring" as ChartType, color: categoryColors.mental.primary, progress: 60 },
  ];

  // Medications metrics
  const medicationsMetrics = [
    { icon: <Pill className="w-4 h-4" />, title: "Daily Supplements", value: "3", unit: "/ 5 taken", timestamp: `Today, ${getCurrentTime()}`, hasData: true, badge: undefined, trendData: undefined, chartType: "ring" as ChartType, color: categoryColors.medications.primary, progress: 60 },
    { icon: <Pill className="w-4 h-4" />, title: "Prescriptions", value: "2", unit: "active", timestamp: "Current", hasData: true, badge: undefined, trendData: undefined, chartType: "donut" as ChartType, color: categoryColors.medications.primary },
    { icon: <Clock className="w-4 h-4" />, title: "Next Dose", value: "2:00 PM", unit: "", timestamp: "Vitamin D", hasData: true, badge: undefined, trendData: undefined, chartType: "trend" as ChartType, color: categoryColors.medications.primary },
    { icon: <Pill className="w-4 h-4" />, title: "Adherence Rate", value: "95", unit: "%", timestamp: "Last 30 days", trendData: generateTrendData(), hasData: true, badge: "Demo", chartType: "ring" as ChartType, color: "#22C55E", progress: 95 },
  ];

  // Mobility metrics
  const mobilityMetrics = [
    { icon: <Accessibility className="w-4 h-4" />, title: "Range of Motion", value: "Normal", unit: "", timestamp: "Last assessment", hasData: true, badge: "Demo", trendData: undefined, chartType: "trend" as ChartType, color: "#10B981" },
    { icon: <Target className="w-4 h-4" />, title: "Balance Score", value: "8.5", unit: "/ 10", timestamp: "Last week", trendData: generateTrendData(), hasData: true, badge: "Demo", chartType: "ring" as ChartType, color: "#10B981", progress: 85 },
    { icon: <Footprints className="w-4 h-4" />, title: "Gait Analysis", value: "Stable", unit: "", timestamp: "Last check", hasData: true, badge: "Demo", trendData: undefined, chartType: "trend" as ChartType, color: "#10B981" },
    { icon: <Dumbbell className="w-4 h-4" />, title: "Flexibility", value: "Good", unit: "", timestamp: "Last month", hasData: true, badge: "Demo", trendData: undefined, chartType: "trend" as ChartType, color: "#10B981" },
  ];

  // Respiratory metrics
  const respiratoryMetrics = [
    { icon: <Wind className="w-4 h-4" />, title: "Respiratory Rate", value: "14", unit: "breaths/min", timestamp: "Last night", trendData: generateTrendData(), hasData: true, badge: undefined, chartType: "sparkline" as ChartType, color: categoryColors.respiratory.primary },
    { icon: <Wind className="w-4 h-4" />, title: "Blood Oxygen", value: "98", unit: "%", timestamp: `Today, ${getCurrentTime()}`, trendData: generateTrendData(), hasData: true, badge: undefined, chartType: "ring" as ChartType, color: categoryColors.respiratory.primary, progress: 98 },
    { icon: <Activity className="w-4 h-4" />, title: "Lung Capacity", value: "4.2", unit: "L", timestamp: "Last assessment", hasData: false, badge: "Demo", trendData: undefined, chartType: "sparkline" as ChartType, color: categoryColors.respiratory.primary },
    { icon: <Wind className="w-4 h-4" />, title: "Peak Flow", value: "450", unit: "L/min", timestamp: "This morning", hasData: false, badge: "Demo", trendData: undefined, chartType: "gradient" as ChartType, color: categoryColors.respiratory.primary, progress: 75 },
  ];

  // Symptoms metrics
  const symptomsMetrics = [
    { icon: <Stethoscope className="w-4 h-4" />, title: "Active Symptoms", value: "0", unit: "tracked", timestamp: `Today`, hasData: true, badge: undefined, trendData: undefined, chartType: "donut" as ChartType, color: categoryColors.symptoms.primary },
    { icon: <Brain className="w-4 h-4" />, title: "Headaches", value: "2", unit: "this month", timestamp: "Last: 3 days ago", trendData: generateTrendData(), hasData: true, badge: "Demo", chartType: "sparkline" as ChartType, color: categoryColors.symptoms.primary },
    { icon: <Heart className="w-4 h-4" />, title: "Pain Level", value: "0", unit: "/ 10", timestamp: `Today`, hasData: true, badge: undefined, trendData: undefined, chartType: "gradient" as ChartType, color: categoryColors.symptoms.primary, progress: 0 },
    { icon: <Stethoscope className="w-4 h-4" />, title: "Fatigue Score", value: "3", unit: "/ 10", timestamp: `Today, ${getCurrentTime()}`, trendData: generateTrendData(), hasData: true, badge: "Demo", chartType: "gradient" as ChartType, color: categoryColors.symptoms.primary, progress: 30 },
  ];

  // Health Records metrics
  const recordsMetrics = [
    { icon: <FileText className="w-4 h-4" />, title: "Lab Results", value: "5", unit: "reports", timestamp: "Last: 2 weeks ago", hasData: true, badge: undefined, trendData: undefined, chartType: "donut" as ChartType, color: categoryColors.records.primary },
    { icon: <FileText className="w-4 h-4" />, title: "Doctor Visits", value: "3", unit: "this year", timestamp: "Last: 1 month ago", hasData: true, badge: undefined, trendData: undefined, chartType: "trend" as ChartType, color: categoryColors.records.primary },
    { icon: <FileText className="w-4 h-4" />, title: "Immunizations", value: "Up to date", unit: "", timestamp: "Last: Flu shot Oct 2024", hasData: true, badge: undefined, trendData: undefined, chartType: "ring" as ChartType, color: "#22C55E", progress: 100 },
    { icon: <FileText className="w-4 h-4" />, title: "Uploaded Files", value: "12", unit: "documents", timestamp: "Last: Yesterday", hasData: true, badge: undefined, trendData: undefined, chartType: "trend" as ChartType, color: categoryColors.records.primary },
  ];

  const getCategoryMetrics = () => {
    const allMetrics = [
      ...activityMetrics,
      ...bodyMetrics,
      ...nutritionMetrics,
      ...sleepMetrics,
      ...heartMetrics,
      ...mentalMetrics,
      ...medicationsMetrics,
      ...mobilityMetrics,
      ...respiratoryMetrics,
      ...symptomsMetrics,
      ...recordsMetrics,
    ];

    switch (activeCategory) {
      case "pinned":
        // Show only metrics that are pinned
        return allMetrics.filter((metric) =>
          isPinned(getCategoryForMetric(metric), metric.title)
        );
      case "activity":
        return activityMetrics;
      case "body":
        return bodyMetrics;
      case "nutrition":
        return nutritionMetrics;
      case "sleep":
        return sleepMetrics;
      case "heart":
        return heartMetrics;
      case "mental":
        return mentalMetrics;
      case "medications":
        return medicationsMetrics;
      case "mobility":
        return mobilityMetrics;
      case "respiratory":
        return respiratoryMetrics;
      case "symptoms":
        return symptomsMetrics;
      case "records":
        return recordsMetrics;
      default:
        return pinnedMetrics;
    }
  };

  // Helper function to determine which category a metric belongs to
  const getCategoryForMetric = (metric: any) => {
    if (activityMetrics.includes(metric)) return "activity";
    if (bodyMetrics.includes(metric)) return "body";
    if (nutritionMetrics.includes(metric)) return "nutrition";
    if (sleepMetrics.includes(metric)) return "sleep";
    if (heartMetrics.includes(metric)) return "heart";
    if (mentalMetrics.includes(metric)) return "mental";
    if (medicationsMetrics.includes(metric)) return "medications";
    if (mobilityMetrics.includes(metric)) return "mobility";
    if (respiratoryMetrics.includes(metric)) return "respiratory";
    if (symptomsMetrics.includes(metric)) return "symptoms";
    if (recordsMetrics.includes(metric)) return "records";
    return "activity"; // default
  };

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case "pinned":
        return "Pinned Metrics";
      case "action-plan":
        return "My Action Plan";
      case "activity":
        return "Activity";
      case "body":
        return "Body Measurements";
      case "nutrition":
        return "Nutrition";
      case "sleep":
        return "Sleep";
      case "heart":
        return "Heart / Vitals";
      case "mental":
        return "Mental Wellbeing";
      case "medications":
        return "Medications";
      case "mobility":
        return "Mobility";
      case "respiratory":
        return "Respiratory";
      case "symptoms":
        return "Symptoms";
      case "records":
        return "Health Records";
      case "chat":
        return "AI Health Coach";
      default:
        return "Health Metrics";
    }
  };

  return (
    <>
      <div className="max-w-[1400px] mx-auto">
        {/* Main layout: Sidebar + Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* Left: Category Sidebar - Hidden on mobile, shown as tabs instead */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <HealthCategorySidebar
                activeCategory={activeCategory}
                onCategoryClick={setActiveCategory}
              />
            </div>
          </div>

          {/* Mobile category tabs (visible only on mobile) */}
          <div className="lg:hidden overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {[
                { id: "pinned", label: "Pinned" },
                { id: "action-plan", label: "Action Plan" },
                { id: "activity", label: "Activity" },
                { id: "body", label: "Body" },
                { id: "nutrition", label: "Nutrition" },
                { id: "sleep", label: "Sleep" },
                { id: "heart", label: "Heart" },
                { id: "mental", label: "Mental" },
                { id: "medications", label: "Medications" },
                { id: "mobility", label: "Mobility" },
                { id: "respiratory", label: "Respiratory" },
                { id: "symptoms", label: "Symptoms" },
                { id: "records", label: "Records" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? "bg-[#12AFCB] text-white"
                      : "bg-white/80 text-[#5A6B7F]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Content Area */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#0E1012]">
                {getCategoryTitle()}
              </h2>
              {activeCategory === "body" && (
                <Button
                  onClick={() => setBodyMetricsModalOpen(true)}
                  size="sm"
                  variant="outline"
                  className="border-[#12AFCB]/30 text-[#12AFCB] hover:bg-[#12AFCB]/10"
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit Metrics
                </Button>
              )}
            </div>

            {activeCategory === "chat" ? (
              <AIChatCenter />
            ) : activeCategory === "action-plan" ? (
              <div className="space-y-4">
                {/* Longevity Goals */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Longevity Goals</h3>
                    </div>
                    <Button
                      onClick={() => handleAddGoal('global')}
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Goal
                    </Button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {globalGoals.length === 0 ? (
                      <div className="py-8 text-center w-full">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <Target className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">No longevity goals yet. Add one to get started!</p>
                      </div>
                    ) : (
                      globalGoals.map(goal => (
                        <div key={goal.id} className="flex-shrink-0 min-w-[320px]">
                          <LongevityGoalCard
                            id={goal.id}
                            title={goal.title}
                            description={goal.description}
                            targetValue={goal.target_value}
                            targetMetric={goal.target_metric}
                            units={goal.units}
                            onEdit={() => handleEditGoal(goal)}
                            onDelete={() => {
                              setGoalToDelete(goal);
                              setDeleteDialogOpen(true);
                            }}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* This Week and Plans Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 -mb-4">
                  {/* This Week Goals */}
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">This Week</h3>
                      </div>
                      <Button
                        onClick={() => handleAddGoal('temporary')}
                        size="icon"
                        className="bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white h-8 w-8 shadow-lg shadow-cyan-500/20"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {temporaryGoals.length === 0 ? (
                        <div className="py-8 text-center">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-cyan-500" />
                          </div>
                          <p className="text-sm text-muted-foreground">No weekly goals yet. Add one to get started!</p>
                        </div>
                      ) : (
                        temporaryGoals.map(goal => (
                          <WeeklyGoalCard
                            key={goal.id}
                            id={goal.id}
                            title={goal.title}
                            description={goal.description}
                            timeScope={goal.time_scope}
                            onEdit={() => handleEditGoal(goal)}
                            onDelete={() => {
                              setGoalToDelete(goal);
                              setDeleteDialogOpen(true);
                            }}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Upcoming Plans */}
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Upcoming Plans</h3>
                      </div>
                      <Button
                        onClick={() => handleAddGoal('plan')}
                        size="sm"
                        className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/20"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Plan
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {plans.length === 0 ? (
                        <div className="py-8 text-center">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-violet-500" />
                          </div>
                          <p className="text-sm text-muted-foreground">No plans yet. Add one to get started!</p>
                        </div>
                      ) : (
                        plans.map(plan => (
                          <PlanCard
                            key={plan.id}
                            id={plan.id}
                            title={plan.title}
                            description={plan.description}
                            locationName={plan.location_name}
                            startDate={plan.start_date}
                            endDate={plan.end_date}
                            type={plan.type as 'plan_trip' | 'plan_event'}
                            onEdit={() => handleEditGoal(plan)}
                            onDelete={() => {
                              setGoalToDelete(plan);
                              setDeleteDialogOpen(true);
                            }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#12AFCB] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#12AFCB]/20">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">AI Recommendations</h3>
                  </div>
                  <AISuggestionsPanel />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {getCategoryMetrics().map((metric, index) => {
                const metricCategory = activeCategory === "pinned" 
                  ? getCategoryForMetric(metric) 
                  : activeCategory;
                
                return (
                  <MetricCard
                    key={index}
                    icon={metric.icon}
                    title={metric.title}
                    value={metric.value}
                    unit={metric.unit}
                    timestamp={metric.timestamp}
                    trendData={metric.trendData}
                    hasData={metric.hasData}
                    badge={metric.badge}
                    category={activeCategory}
                    isPinned={isPinned(metricCategory, metric.title)}
                    onTogglePin={() => togglePin(metricCategory, metric.title)}
                    onClick={() => console.log("Metric clicked:", metric.title)}
                    chartType={metric.chartType}
                    color={metric.color}
                    progress={metric.progress}
                  />
                );
              })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <GoalModal
        open={goalModalOpen}
        onOpenChange={(open) => {
          setGoalModalOpen(open);
          if (!open) setEditingGoal(null);
        }}
        onSuccess={loadPriorities}
        mode={goalModalMode}
        editMode={!!editingGoal}
        initialValues={editingGoal ? {
          id: editingGoal.id,
          title: editingGoal.title,
          description: editingGoal.description || undefined,
          start_date: editingGoal.start_date || undefined,
          end_date: editingGoal.end_date || undefined,
          location_name: editingGoal.location_name || undefined,
          time_scope: editingGoal.time_scope as 'day' | 'week' | undefined,
          target_value: editingGoal.target_value || undefined,
          target_metric: editingGoal.target_metric || undefined,
          units: editingGoal.units || undefined,
        } : undefined}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteGoal}
        title={goalToDelete?.title || ''}
      />
      <BodyMetricsModal
        open={bodyMetricsModalOpen}
        onOpenChange={setBodyMetricsModalOpen}
        onSave={() => {
          loadBodyMetrics();
        }}
      />
    </>
  );
}
