import { useState, useEffect } from "react";
import { HealthCategorySidebar } from "./HealthCategorySidebar";
import { MetricCard } from "./MetricCard";
import { AIChatCenter } from "@/components/priorities/AIChatCenter";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ProfessionalPrioritiesSection() {
  const [activeCategory, setActiveCategory] = useState("pinned");
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

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
    },
  ];

  // Activity metrics
  const activityMetrics = [
    {
      icon: <Flame className="w-4 h-4" />,
      title: "Move Ring",
      value: "420",
      unit: "/ 600 cal",
      timestamp: `Today, ${getCurrentTime()}`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <Timer className="w-4 h-4" />,
      title: "Exercise Ring",
      value: "28",
      unit: "/ 30 min",
      timestamp: `Today`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Stand Ring",
      value: "10",
      unit: "/ 12 hrs",
      timestamp: `Today`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
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
    },
  ];

  // Body measurement metrics
  const bodyMetrics = [
    {
      icon: <Scale className="w-4 h-4" />,
      title: "Weight",
      value: "75.2",
      unit: "kg",
      timestamp: "This morning",
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <Scale className="w-4 h-4" />,
      title: "Body Fat %",
      value: "18.5",
      unit: "%",
      timestamp: "Last week",
      trendData: generateTrendData(),
      hasData: true,
      badge: "Demo",
    },
    {
      icon: <Scale className="w-4 h-4" />,
      title: "BMI",
      value: "23.4",
      unit: "",
      timestamp: "Calculated",
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <Target className="w-4 h-4" />,
      title: "Waist",
      value: "82",
      unit: "cm",
      timestamp: "Last month",
      hasData: false,
      badge: undefined,
    },
  ];

  // Nutrition metrics
  const nutritionMetrics = [
    {
      icon: <Flame className="w-4 h-4" />,
      title: "Calories",
      value: "1,850",
      unit: "/ 2,200 cal",
      timestamp: `Today, ${getCurrentTime()}`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <Salad className="w-4 h-4" />,
      title: "Protein",
      value: "95",
      unit: "/ 120g",
      timestamp: `Today`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <Droplet className="w-4 h-4" />,
      title: "Water",
      value: "2.1",
      unit: "/ 3.0 L",
      timestamp: `Today`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <Salad className="w-4 h-4" />,
      title: "Supplements",
      value: "3",
      unit: "taken",
      timestamp: "This morning",
      hasData: true,
      badge: undefined,
    },
  ];

  // Sleep metrics
  const sleepMetrics = [
    {
      icon: <Moon className="w-4 h-4" />,
      title: "Sleep Duration",
      value: "7.5",
      unit: "hours",
      timestamp: "Last night",
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <Moon className="w-4 h-4" />,
      title: "Time in Bed",
      value: "8.2",
      unit: "hours",
      timestamp: "Last night",
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
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
    },
  ];

  // Heart/Vitals metrics
  const heartMetrics = [
    {
      icon: <Heart className="w-4 h-4" />,
      title: "Heart Rate",
      value: "68",
      unit: "BPM",
      timestamp: `Just now`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <Heart className="w-4 h-4" />,
      title: "Resting HR",
      value: "58",
      unit: "BPM",
      timestamp: "Average today",
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <Activity className="w-4 h-4" />,
      title: "HRV",
      value: "65",
      unit: "ms",
      timestamp: "Last night",
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <Wind className="w-4 h-4" />,
      title: "Blood Oxygen",
      value: "98",
      unit: "%",
      timestamp: "Last night",
      hasData: false,
      badge: "Demo",
    },
    {
      icon: <Wind className="w-4 h-4" />,
      title: "Respiratory Rate",
      value: "14",
      unit: "/ min",
      timestamp: "Last night",
      hasData: false,
      badge: "Demo",
    },
  ];

  // Mental wellbeing metrics
  const mentalMetrics = [
    {
      icon: <Brain className="w-4 h-4" />,
      title: "Stress Level",
      value: "4",
      unit: "/ 10",
      timestamp: `Today, ${getCurrentTime()}`,
      trendData: generateTrendData(),
      hasData: true,
      badge: "Demo",
    },
    {
      icon: <Brain className="w-4 h-4" />,
      title: "Mindful Minutes",
      value: "12",
      unit: "min",
      timestamp: "This morning",
      trendData: generateTrendData(),
      hasData: true,
      badge: "Demo",
    },
  ];

  // Medications metrics
  const medicationsMetrics = [
    {
      icon: <Pill className="w-4 h-4" />,
      title: "Daily Supplements",
      value: "3",
      unit: "/ 5 taken",
      timestamp: `Today, ${getCurrentTime()}`,
      hasData: true,
      badge: undefined,
      trendData: undefined,
    },
    {
      icon: <Pill className="w-4 h-4" />,
      title: "Prescriptions",
      value: "2",
      unit: "active",
      timestamp: "Current",
      hasData: true,
      badge: undefined,
      trendData: undefined,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      title: "Next Dose",
      value: "2:00 PM",
      unit: "",
      timestamp: "Vitamin D",
      hasData: true,
      badge: undefined,
      trendData: undefined,
    },
    {
      icon: <Pill className="w-4 h-4" />,
      title: "Adherence Rate",
      value: "95",
      unit: "%",
      timestamp: "Last 30 days",
      trendData: generateTrendData(),
      hasData: true,
      badge: "Demo",
    },
  ];

  // Mobility metrics
  const mobilityMetrics = [
    {
      icon: <Accessibility className="w-4 h-4" />,
      title: "Range of Motion",
      value: "Normal",
      unit: "",
      timestamp: "Last assessment",
      hasData: true,
      badge: "Demo",
      trendData: undefined,
    },
    {
      icon: <Target className="w-4 h-4" />,
      title: "Balance Score",
      value: "8.5",
      unit: "/ 10",
      timestamp: "Last week",
      trendData: generateTrendData(),
      hasData: true,
      badge: "Demo",
    },
    {
      icon: <Footprints className="w-4 h-4" />,
      title: "Gait Analysis",
      value: "Stable",
      unit: "",
      timestamp: "Last check",
      hasData: true,
      badge: "Demo",
      trendData: undefined,
    },
    {
      icon: <Dumbbell className="w-4 h-4" />,
      title: "Flexibility",
      value: "Good",
      unit: "",
      timestamp: "Last month",
      hasData: true,
      badge: "Demo",
      trendData: undefined,
    },
  ];

  // Respiratory metrics
  const respiratoryMetrics = [
    {
      icon: <Wind className="w-4 h-4" />,
      title: "Respiratory Rate",
      value: "14",
      unit: "breaths/min",
      timestamp: "Last night",
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <Wind className="w-4 h-4" />,
      title: "Blood Oxygen",
      value: "98",
      unit: "%",
      timestamp: `Today, ${getCurrentTime()}`,
      trendData: generateTrendData(),
      hasData: true,
      badge: undefined,
    },
    {
      icon: <Activity className="w-4 h-4" />,
      title: "Lung Capacity",
      value: "4.2",
      unit: "L",
      timestamp: "Last assessment",
      hasData: false,
      badge: "Demo",
      trendData: undefined,
    },
    {
      icon: <Wind className="w-4 h-4" />,
      title: "Peak Flow",
      value: "450",
      unit: "L/min",
      timestamp: "This morning",
      hasData: false,
      badge: "Demo",
      trendData: undefined,
    },
  ];

  // Symptoms metrics
  const symptomsMetrics = [
    {
      icon: <Stethoscope className="w-4 h-4" />,
      title: "Active Symptoms",
      value: "0",
      unit: "tracked",
      timestamp: `Today`,
      hasData: true,
      badge: undefined,
      trendData: undefined,
    },
    {
      icon: <Brain className="w-4 h-4" />,
      title: "Headaches",
      value: "2",
      unit: "this month",
      timestamp: "Last: 3 days ago",
      trendData: generateTrendData(),
      hasData: true,
      badge: "Demo",
    },
    {
      icon: <Heart className="w-4 h-4" />,
      title: "Pain Level",
      value: "0",
      unit: "/ 10",
      timestamp: `Today`,
      hasData: true,
      badge: undefined,
      trendData: undefined,
    },
    {
      icon: <Stethoscope className="w-4 h-4" />,
      title: "Fatigue Score",
      value: "3",
      unit: "/ 10",
      timestamp: `Today, ${getCurrentTime()}`,
      trendData: generateTrendData(),
      hasData: true,
      badge: "Demo",
    },
  ];

  // Health Records metrics
  const recordsMetrics = [
    {
      icon: <FileText className="w-4 h-4" />,
      title: "Lab Results",
      value: "5",
      unit: "reports",
      timestamp: "Last: 2 weeks ago",
      hasData: true,
      badge: undefined,
      trendData: undefined,
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: "Doctor Visits",
      value: "3",
      unit: "this year",
      timestamp: "Last: 1 month ago",
      hasData: true,
      badge: undefined,
      trendData: undefined,
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: "Immunizations",
      value: "Up to date",
      unit: "",
      timestamp: "Last: Flu shot Oct 2024",
      hasData: true,
      badge: undefined,
      trendData: undefined,
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: "Uploaded Files",
      value: "12",
      unit: "documents",
      timestamp: "Last: Yesterday",
      hasData: true,
      badge: undefined,
      trendData: undefined,
    },
  ];

  const getCategoryMetrics = () => {
    switch (activeCategory) {
      case "pinned":
        return pinnedMetrics;
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

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case "pinned":
        return "Pinned Metrics";
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
      default:
        return "Health Metrics";
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Main layout: Sidebar + Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Left: Category Sidebar - Hidden on mobile, shown as tabs instead */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <HealthCategorySidebar
              activeCategory={activeCategory}
              onCategoryClick={setActiveCategory}
            />
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2"
              onClick={() => setIsAIChatOpen(!isAIChatOpen)}
            >
              {isAIChatOpen ? (
                <>
                  Hide AI Chat <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show AI Chat <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile category tabs (visible only on mobile) */}
        <div className="lg:hidden overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {[
              { id: "pinned", label: "Pinned" },
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

        {/* Right: Metrics Grid */}
        <div>
          <h2 className="text-2xl font-bold text-[#0E1012] mb-4">
            {getCategoryTitle()}
          </h2>

          {isAIChatOpen && (
            <div className="mb-6">
              <AIChatCenter />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCategoryMetrics().map((metric, index) => (
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
                onClick={() => console.log("Metric clicked:", metric.title)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
