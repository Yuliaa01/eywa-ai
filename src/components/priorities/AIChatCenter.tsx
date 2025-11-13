import { Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AIChatCenter() {
  return (
    <div className="rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-8 shadow-[0_4px_12px_rgba(18,175,203,0.15)] hover:shadow-[0_8px_24px_rgba(18,175,203,0.2)] transition-all duration-300">
      {/* AI Icon */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#12AFCB] to-[#19D0E4] flex items-center justify-center shadow-[0_4px_12px_rgba(18,175,203,0.3)]">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-rounded text-lg font-semibold text-[#0E1012]">Eywa AI</h3>
          <p className="text-xs text-[#5A6B7F]">Your health companion</p>
        </div>
      </div>

      {/* AI Message */}
      <div className="mb-8 space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#E8FAFD] to-[#C8FAFF] p-6 border border-[#12AFCB]/10">
          <p className="text-[#333333] text-base leading-relaxed font-medium">
            Today I see your stress level decreased and your sleep improved by 9%. Would you like me to show detailed progress?
          </p>
        </div>
        
        {/* Action Button */}
        <Button 
          className="rounded-2xl bg-[#12AFCB] hover:bg-[#19D0E4] text-white px-8 py-6 text-base font-semibold shadow-[0_4px_12px_rgba(18,175,203,0.3)] hover:shadow-[0_8px_20px_rgba(18,175,203,0.4)] hover:scale-[1.02] transition-all duration-200"
        >
          Yes, show me
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <p className="text-xs text-[#5A6B7F] font-medium uppercase tracking-wide">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="rounded-xl bg-white/60 hover:bg-white/80 border border-[#12AFCB]/10 p-4 text-sm text-[#0E1012] font-medium hover:scale-[1.02] transition-all duration-200">
            📊 View Progress
          </button>
          <button className="rounded-xl bg-white/60 hover:bg-white/80 border border-[#12AFCB]/10 p-4 text-sm text-[#0E1012] font-medium hover:scale-[1.02] transition-all duration-200">
            💤 Sleep Analysis
          </button>
          <button className="rounded-xl bg-white/60 hover:bg-white/80 border border-[#12AFCB]/10 p-4 text-sm text-[#0E1012] font-medium hover:scale-[1.02] transition-all duration-200">
            🍎 Nutrition Tips
          </button>
          <button className="rounded-xl bg-white/60 hover:bg-white/80 border border-[#12AFCB]/10 p-4 text-sm text-[#0E1012] font-medium hover:scale-[1.02] transition-all duration-200">
            🧘 Stress Relief
          </button>
        </div>
      </div>

      {/* Voice Input */}
      <button className="mt-6 flex items-center gap-2 text-[#12AFCB] hover:text-[#19D0E4] font-medium text-sm transition-colors duration-200">
        <div className="w-10 h-10 rounded-full bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 flex items-center justify-center hover:scale-110 transition-all duration-200">
          <Mic className="w-5 h-5" />
        </div>
        <span>Ask me anything</span>
      </button>
    </div>
  );
}
