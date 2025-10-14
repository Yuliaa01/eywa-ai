import { useState } from "react";
import { Target, Heart, Activity, Brain, Shield, Plus } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
}

interface GoalsStepProps {
  onNext: (goals: string[]) => void;
}

export default function GoalsStep({ onNext }: GoalsStepProps) {
  const [goals, setGoals] = useState<Goal[]>([
    { id: 'blood_sugar', title: 'Normalize blood sugar', icon: Activity, selected: false },
    { id: 'hormones', title: 'Optimize hormones', icon: Target, selected: false },
    { id: 'cardiovascular', title: 'Improve cardiovascular fitness', icon: Heart, selected: false },
    { id: 'anxiety', title: 'Manage anxiety & sleep', icon: Brain, selected: false },
    { id: 'preventive', title: 'Preventive care', icon: Shield, selected: false },
  ]);

  const [customGoal, setCustomGoal] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => 
      g.id === id ? { ...g, selected: !g.selected } : g
    ));
  };

  const addCustomGoal = () => {
    if (customGoal.trim()) {
      setGoals(prev => [...prev, {
        id: `custom_${Date.now()}`,
        title: customGoal,
        icon: Plus,
        selected: true
      }]);
      setCustomGoal('');
      setShowCustomInput(false);
    }
  };

  const handleContinue = () => {
    const selectedGoals = goals.filter(g => g.selected).map(g => g.title);
    onNext(selectedGoals);
  };

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)]">
          <Target className="w-10 h-10 text-[#12AFCB]" />
        </div>
        <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
          Your Health Goals
        </h2>
        <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
          Select the medical outcomes you want to focus on
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {goals.map((goal, idx) => {
          const Icon = goal.icon;
          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`rounded-3xl backdrop-blur-xl p-6 shadow-[0_4px_20px_rgba(18,175,203,0.06)] transition-all duration-standard text-left ${
                goal.selected
                  ? 'bg-gradient-to-br from-[#12AFCB]/10 to-[#12AFCB]/5 border-2 border-[#12AFCB] shadow-[0_8px_32px_rgba(18,175,203,0.15)]'
                  : 'bg-white/60 border border-[#12AFCB]/10 hover:bg-white/80 hover:border-[#12AFCB]/20'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  goal.selected
                    ? 'bg-gradient-to-br from-[#12AFCB] to-[#12AFCB]/80'
                    : 'bg-white/60'
                }`}>
                  <Icon className={`w-6 h-6 ${goal.selected ? 'text-white' : 'text-[#5A6B7F]'}`} />
                </div>
                <span className="text-[1.0625rem] font-semibold text-[#0E1012]">
                  {goal.title}
                </span>
              </div>
            </button>
          );
        })}

        {showCustomInput ? (
          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-6">
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomGoal()}
              placeholder="Enter your custom goal..."
              autoFocus
              className="w-full h-12 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#0E1012] placeholder:text-[#5A6B7F]/50 focus:outline-none focus:border-[#12AFCB]/30 focus:ring-2 focus:ring-[#12AFCB]/20 transition-all duration-standard mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={addCustomGoal}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-medium text-[0.875rem] hover:shadow-glow-teal transition-all duration-standard"
              >
                Add
              </button>
              <button
                onClick={() => setShowCustomInput(false)}
                className="flex-1 h-10 rounded-xl bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] font-medium text-[0.875rem] hover:bg-white/80 transition-all duration-standard"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomInput(true)}
            className="rounded-3xl bg-white/40 backdrop-blur-xl border border-dashed border-[#12AFCB]/20 p-6 hover:bg-white/60 hover:border-[#12AFCB]/30 transition-all duration-standard"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/60 flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-[#5A6B7F]" />
              </div>
              <span className="text-[1.0625rem] font-semibold text-[#5A6B7F]">
                Add custom goal
              </span>
            </div>
          </button>
        )}
      </div>

      <button
        onClick={handleContinue}
        disabled={!goals.some(g => g.selected)}
        className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}
