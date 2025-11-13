import { Target, Calendar, TrendingUp, MapPin, Plus } from "lucide-react";
import { Priority } from "@/api/priorities";

interface SmartCardsProps {
  globalGoals: Priority[];
  temporaryGoals: Priority[];
  plans: Priority[];
  onAddGlobal: () => void;
  onAddPlan: () => void;
}

export function SmartCards({ globalGoals, temporaryGoals, plans, onAddGlobal, onAddPlan }: SmartCardsProps) {
  // Separate today and this week goals
  const todayGoals = temporaryGoals.filter(g => g.time_scope === 'day');
  const weekGoals = temporaryGoals.filter(g => g.time_scope === 'week');

  return (
    <div className="space-y-6">
      {/* Card 1 - Global Goals */}
      <div className="rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 shadow-[0_4px_12px_rgba(18,175,203,0.15)] hover:shadow-[0_8px_20px_rgba(18,175,203,0.2)] hover:scale-[1.02] transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-rounded text-lg font-semibold text-[#0E1012]">Global Goals</h3>
          <button 
            onClick={onAddGlobal}
            className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 flex items-center justify-center transition-all duration-200"
          >
            <Plus className="w-4 h-4 text-[#12AFCB]" />
          </button>
        </div>
        <div className="space-y-3">
          {globalGoals.length === 0 ? (
            <p className="text-sm text-[#5A6B7F]">No global goals yet</p>
          ) : (
            globalGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-[#12AFCB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0E1012] line-clamp-2">{goal.title}</p>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-[#12AFCB]/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] rounded-full transition-all duration-500"
                      style={{ width: `${Math.random() * 40 + 40}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Card 2 - Today */}
      <div className="rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 shadow-[0_4px_12px_rgba(18,175,203,0.15)] hover:shadow-[0_8px_20px_rgba(18,175,203,0.2)] hover:scale-[1.02] transition-all duration-300">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-[#12AFCB]" />
          <h3 className="font-rounded text-lg font-semibold text-[#0E1012]">Today</h3>
        </div>
        <div className="space-y-3">
          {todayGoals.length === 0 ? (
            <div className="text-sm text-[#5A6B7F] space-y-2">
              <p>• Focus — recovery</p>
              <p>• Breathing and light training</p>
            </div>
          ) : (
            todayGoals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#12AFCB]" />
                <p className="text-sm text-[#0E1012] font-medium">{goal.title}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Card 3 - This Week */}
      <div className="rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 shadow-[0_4px_12px_rgba(18,175,203,0.15)] hover:shadow-[0_8px_20px_rgba(18,175,203,0.2)] hover:scale-[1.02] transition-all duration-300">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#12AFCB]" />
          <h3 className="font-rounded text-lg font-semibold text-[#0E1012]">This Week</h3>
        </div>
        
        {/* Mini line chart visualization */}
        <div className="mb-4">
          <div className="flex items-end justify-between h-24 gap-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
              const height = Math.random() * 60 + 20;
              return (
                <div key={day} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full bg-gradient-to-t from-[#12AFCB] to-[#19D0E4] rounded-t-lg transition-all duration-300 hover:opacity-80" style={{ height: `${height}%` }} />
                  <span className="text-xs text-[#5A6B7F] font-medium">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <p className="text-sm text-[#5A6B7F] leading-relaxed">
          Gradual improvement in sleep and activity
        </p>

        {weekGoals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#12AFCB]/10 space-y-2">
            {weekGoals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#12AFCB]" />
                <p className="text-sm text-[#0E1012] font-medium">{goal.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card 4 - Plans */}
      <div className="rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 shadow-[0_4px_12px_rgba(18,175,203,0.15)] hover:shadow-[0_8px_20px_rgba(18,175,203,0.2)] hover:scale-[1.02] transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#12AFCB]" />
            <h3 className="font-rounded text-lg font-semibold text-[#0E1012]">Plans</h3>
          </div>
          <button 
            onClick={onAddPlan}
            className="text-xs text-[#12AFCB] hover:text-[#19D0E4] font-medium transition-colors duration-200"
          >
            + Add Plan
          </button>
        </div>
        <div className="space-y-3">
          {plans.length === 0 ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-gradient-to-br from-[#E8FAFD] to-[#C8FAFF] p-4 border border-[#12AFCB]/10">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-[#0E1012]">Trip — Paris</p>
                  <span className="text-base">☀️</span>
                </div>
                <p className="text-xs text-[#5A6B7F]">June 3–7</p>
              </div>
              <p className="text-xs text-[#5A6B7F] leading-relaxed">
                AI can suggest adjusting sleep and nutrition for the trip
              </p>
            </div>
          ) : (
            plans.slice(0, 2).map((plan) => (
              <div key={plan.id} className="rounded-xl bg-gradient-to-br from-[#E8FAFD] to-[#C8FAFF] p-4 border border-[#12AFCB]/10">
                <p className="text-sm font-semibold text-[#0E1012] mb-1">{plan.title}</p>
                {plan.location_name && (
                  <p className="text-xs text-[#5A6B7F] flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {plan.location_name}
                  </p>
                )}
                {(plan.start_date || plan.end_date) && (
                  <p className="text-xs text-[#5A6B7F] mt-1">
                    {plan.start_date && new Date(plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {plan.start_date && plan.end_date && '–'}
                    {plan.end_date && new Date(plan.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
