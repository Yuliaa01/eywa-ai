import { Heart, MessageCircle, AlertCircle, Sparkles, ChevronRight, Droplet, Moon, Activity, Plus } from "lucide-react";
import { IssueModal } from "@/components/modals/IssueModal";
import { useState } from "react";

export default function HealthCareSection() {
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const quickChecks = [
    {
      title: "Feeling Anxious?",
      description: "Quick self-assessment",
      icon: AlertCircle,
      color: "#12AFCB",
    },
    {
      title: "Body Discomfort?",
      description: "Log symptoms",
      icon: Activity,
      color: "#19D0E4",
    },
  ];

  const tipCards = [
    {
      title: "Hydration Low Today",
      description: "You've had 1.2L. Goal is 2.5L.",
      icon: Droplet,
      action: "Log Water",
    },
    {
      title: "Try 10-Min Meditation",
      description: "Your HRV suggests you could benefit from relaxation.",
      icon: Moon,
      action: "Start Session",
    },
    {
      title: "Schedule Recovery Day",
      description: "You've trained 6 days straight. Consider active recovery.",
      icon: Heart,
      action: "View Plan",
    },
  ];

  return (
    <div className="space-y-6">
      {/* AI Health Agent */}
      <div className="rounded-3xl bg-gradient-to-br from-[#12AFCB]/10 to-[#19D0E4]/5 backdrop-blur-xl border border-[#12AFCB]/20 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.1)]">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#12AFCB] to-[#19D0E4] flex items-center justify-center animate-glow-pulse flex-shrink-0">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-rounded text-xl font-semibold text-[#0E1012] mb-2">
              AI Health Agent
            </h3>
            <p className="text-[#5A6B7F] mb-4">
              I'm here to help with health questions, symptom tracking, and personalized guidance.
            </p>
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] text-white font-rounded font-semibold shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-[0_8px_32px_rgba(18,175,203,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all">
              Start Conversation
            </button>
          </div>
        </div>
      </div>

      {/* Quick Self-Checks */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Quick Check-Ins</h3>
          <button 
            onClick={() => setIssueModalOpen(true)}
            className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 text-[#12AFCB]" />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {quickChecks.map((check) => (
            <button
            key={check.title}
            className="p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                  <check.icon className="w-6 h-6 text-[#12AFCB]" />
                </div>
                <div>
                  <h4 className="font-rounded font-semibold text-[#0E1012] mb-1">{check.title}</h4>
                  <p className="text-sm text-[#5A6B7F]">{check.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#5A6B7F] group-hover:text-[#12AFCB] group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
          </button>
        ))}
        </div>
      </div>

      {/* Doctor Feedback Panel */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12AFCB]/20 to-[#19D0E4]/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#12AFCB]" />
          </div>
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Doctor Feedback</h3>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#12AFCB]/5 to-[#19D0E4]/5 border border-[#12AFCB]/10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/60 flex items-center justify-center">
            <Heart className="w-8 h-8 text-[#12AFCB]" />
          </div>
          <h4 className="font-rounded font-semibold text-[#0E1012] mb-2">
            Connect with Specialists
          </h4>
          <p className="text-sm text-[#5A6B7F] mb-4">
            Get personalized feedback from endocrinologists, cardiologists, and longevity doctors.
          </p>
          <button className="px-6 py-2.5 rounded-xl bg-white border border-[#12AFCB]/20 text-[#12AFCB] font-rounded font-medium hover:bg-[#12AFCB]/5 transition-colors">
            Coming Soon
          </button>
        </div>
      </div>

      {/* Tip Cards */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <h3 className="font-rounded text-xl font-semibold text-[#0E1012] mb-6">Health Tips</h3>
        <div className="space-y-4">
          {tipCards.map((tip, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                  <tip.icon className="w-6 h-6 text-[#12AFCB]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-rounded font-semibold text-[#0E1012] mb-1">{tip.title}</h4>
                  <p className="text-sm text-[#5A6B7F] mb-3">{tip.description}</p>
                  <button className="px-4 py-2 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 text-[#12AFCB] font-rounded font-medium text-sm transition-colors">
                    {tip.action}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <IssueModal open={issueModalOpen} onOpenChange={setIssueModalOpen} onSuccess={() => {}} />
    </div>
  );
}
