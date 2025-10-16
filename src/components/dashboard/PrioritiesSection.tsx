import { Target, TrendingUp, Calendar, Plus, ChevronRight, Zap, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { GoalModal } from "@/components/modals/GoalModal";
import { useState } from "react";

export default function PrioritiesSection() {
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalMode, setGoalMode] = useState<'global' | 'temporary' | 'plan'>('global');

  const openModal = (mode: 'global' | 'temporary' | 'plan') => {
    setGoalMode(mode);
    setGoalModalOpen(true);
  };
  const globalGoals = [
    {
      title: "Lower Stress",
      progress: 72,
      target: "HRV >65ms",
      current: "58ms",
      color: "#12AFCB",
    },
    {
      title: "Improve VO₂ max",
      progress: 45,
      target: "50 mL/kg/min",
      current: "42.5",
      color: "#19D0E4",
    },
  ];

  const temporaryGoals = [
    { title: "Fasting focus", progress: 85, deadline: "16:8 today", color: "#12AFCB" },
    { title: "Hydration target", progress: 60, deadline: "2.5L today", color: "#19D0E4" },
  ];

  const plans = [
    {
      title: "NYC Trip Prep",
      date: "Mar 15-22",
      suggestions: ["Adjust sleep +1hr", "Pack supplements", "Book workouts"],
    },
    {
      title: "Marathon Training",
      date: "Weeks 1-12",
      suggestions: ["Recovery weeks marked", "Nutrition plan ready"],
    },
  ];

  const aiSuggestions = [
    "Schedule 20-min meditation today",
    "Add omega-3 supplement (low index)",
    "Book VO₂max test next month",
  ];

  return (
    <div className="space-y-6">
      {/* Goals & Wishes */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Global Goals */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Global Goals</h3>
            <button 
              onClick={() => openModal('global')}
              className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] active:scale-95 flex items-center justify-center transition-all duration-200"
            >
              <Plus className="w-4 h-4 text-[#12AFCB]" />
            </button>
          </div>
          <div className="space-y-6">
            {globalGoals.map((goal) => (
              <div key={goal.title} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-[#12AFCB]" />
                    </div>
                    <div>
                      <h4 className="font-rounded font-semibold text-[#0E1012]">{goal.title}</h4>
                      <p className="text-sm text-[#5A6B7F]">
                        {goal.current} / {goal.target}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-rounded font-semibold text-[#12AFCB]">
                    {goal.progress}%
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-[#12AFCB]/10 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] shimmer"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Temporary Goals */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Today & This Week</h3>
            <button 
              onClick={() => openModal('temporary')}
              className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] active:scale-95 flex items-center justify-center transition-all duration-200"
            >
              <Plus className="w-4 h-4 text-[#12AFCB]" />
            </button>
          </div>
          <div className="space-y-5">
            {temporaryGoals.map((goal) => (
              <div key={goal.title} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-[#12AFCB]" />
                    <h4 className="font-rounded font-medium text-[#0E1012]">{goal.title}</h4>
                  </div>
                  <span className="text-xs text-[#5A6B7F]">{goal.deadline}</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-[#12AFCB]/10 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[#12AFCB]"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">
            Plans (Trips & Events)
          </h3>
          <button 
            onClick={() => openModal('plan')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] active:scale-95 text-[#12AFCB] font-rounded font-medium text-sm transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.title}
              className="p-6 rounded-2xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all group"
            >
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-[#12AFCB] mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-rounded font-semibold text-[#0E1012] mb-1">{plan.title}</h4>
                  <p className="text-sm text-[#5A6B7F] flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {plan.date}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {plan.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-[#5A6B7F]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#12AFCB] mt-1.5" />
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="rounded-3xl bg-gradient-to-br from-[#12AFCB]/10 to-[#19D0E4]/5 backdrop-blur-xl border border-[#12AFCB]/20 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.1)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12AFCB] to-[#19D0E4] flex items-center justify-center animate-glow-pulse">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">
            AI Daily Suggestions
          </h3>
        </div>
        <div className="space-y-3">
          {aiSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              className="w-full p-4 rounded-xl bg-white/60 border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#0E1012] font-rounded font-medium">{suggestion}</span>
                <ChevronRight className="w-5 h-5 text-[#5A6B7F] group-hover:text-[#12AFCB] group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <GoalModal 
        open={goalModalOpen} 
        onOpenChange={setGoalModalOpen}
        mode={goalMode}
        onSuccess={() => {
          // Optimistic update would go here
        }}
      />
    </div>
  );
}
