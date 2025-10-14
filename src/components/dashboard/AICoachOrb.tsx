import { Brain, X } from "lucide-react";
import { useState } from "react";

export default function AICoachOrb() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Orb Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#12AFCB] to-[#19D0E4] shadow-[0_8px_32px_rgba(18,175,203,0.4)] hover:shadow-[0_12px_48px_rgba(18,175,203,0.5)] hover:scale-110 active:scale-95 transition-all z-30 flex items-center justify-center group"
        style={{
          animation: "glow-pulse 2s ease-in-out infinite",
        }}
      >
        <Brain className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* AI Coach Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-96 h-[32rem] rounded-3xl bg-white/90 backdrop-blur-2xl border border-[#12AFCB]/20 shadow-[0_8px_32px_rgba(18,175,203,0.2)] z-30 animate-scale-in overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[#12AFCB]/10 bg-gradient-to-r from-[#12AFCB]/10 to-[#19D0E4]/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12AFCB] to-[#19D0E4] flex items-center justify-center animate-glow-pulse">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-rounded font-semibold text-[#0E1012]">AI Health Coach</h3>
                  <p className="text-xs text-[#5A6B7F]">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#12AFCB]/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#5A6B7F]" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {/* AI Message */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#12AFCB] to-[#19D0E4] flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-[#12AFCB]/5 border border-[#12AFCB]/10">
                  <p className="text-sm text-[#0E1012]">
                    Hi! I'm your AI health coach. I can help you with:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-[#5A6B7F]">
                    <li>• Health questions & guidance</li>
                    <li>• Symptom tracking</li>
                    <li>• Goal recommendations</li>
                    <li>• Lifestyle optimization</li>
                  </ul>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs text-[#5A6B7F] font-rounded font-medium">Quick Actions</p>
                <button className="w-full p-3 rounded-xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.08)] transition-all text-left text-sm text-[#0E1012] font-rounded">
                  💊 Review my supplements
                </button>
                <button className="w-full p-3 rounded-xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.08)] transition-all text-left text-sm text-[#0E1012] font-rounded">
                  📊 Analyze my recent labs
                </button>
                <button className="w-full p-3 rounded-xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.08)] transition-all text-left text-sm text-[#0E1012] font-rounded">
                  🎯 Optimize my goals
                </button>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#12AFCB]/10 bg-white/60">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/80 border border-[#12AFCB]/10 focus:border-[#12AFCB]/30 focus:outline-none text-sm text-[#0E1012] placeholder:text-[#5A6B7F]"
              />
              <button className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] text-white font-rounded font-medium hover:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-shadow">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
