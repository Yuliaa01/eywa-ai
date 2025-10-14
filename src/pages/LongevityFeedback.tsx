import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassToolbar } from "@/components/glass/GlassToolbar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, Sparkles } from "lucide-react";

interface FeedbackData {
  id: string;
  period: string;
  summary_md: string | null;
  risk_signals: any;
  wins: any;
  next_best_actions: any;
  generated_at: string;
}

interface RiskSignal {
  title: string;
  severity: string;
  description: string;
}

interface Win {
  title: string;
  description: string;
  improvement?: string;
  progress?: number;
}

interface NextAction {
  title: string;
  description: string;
  priority: string;
  timeline?: string;
}

export default function LongevityFeedback() {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLatestFeedback();
  }, []);

  const loadLatestFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_feedback_unified")
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setFeedback({
          ...data,
          risk_signals: Array.isArray(data.risk_signals) ? data.risk_signals : [],
          wins: Array.isArray(data.wins) ? data.wins : [],
          next_best_actions: Array.isArray(data.next_best_actions) ? data.next_best_actions : [],
        });
      }
    } catch (error) {
      console.error("Error loading feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FCFF] via-[#EFF8FB] to-[#E8FAFF]/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#12AFCB]/20 to-[#12AFCB]/10 backdrop-blur-xl border border-[#12AFCB]/20 flex items-center justify-center animate-glow-pulse">
            <Sparkles className="w-8 h-8 text-[#12AFCB] animate-spin" />
          </div>
          <p className="text-sm text-[#5A6B7F] font-rounded">Loading your longevity insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FCFF] via-[#EFF8FB] to-[#E8FAFF]/30 pb-24">
      {/* Glass Toolbar */}
      <GlassToolbar position="top">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-xl hover:bg-[#12AFCB]/10"
          >
            <ArrowLeft className="w-5 h-5 text-[#5A6B7F]" />
          </Button>
          <h1 className="font-rounded text-xl font-semibold text-[#0E1012]">
            Longevity Feedback
          </h1>
        </div>
        <Badge variant="secondary" className="rounded-full">
          {feedback?.period || "Weekly"}
        </Badge>
      </GlassToolbar>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-24 space-y-6">
        {/* Summary Section */}
        {feedback?.summary_md && (
          <GlassCard className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#12AFCB]/20 to-[#12AFCB]/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#12AFCB]" />
              </div>
              <div className="flex-1">
                <h2 className="font-rounded text-xl font-semibold text-[#0E1012] mb-2">
                  Weekly Summary
                </h2>
                <p className="text-sm text-[#5A6B7F]">
                  Generated {new Date(feedback.generated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none text-[#0E1012]">
              {feedback.summary_md}
            </div>
          </GlassCard>
        )}

        {/* Risk Signals */}
        {feedback?.risk_signals && Array.isArray(feedback.risk_signals) && feedback.risk_signals.length > 0 && (
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-rounded text-lg font-semibold text-[#0E1012]">
                Risk Signals
              </h3>
            </div>
            <div className="space-y-3">
              {feedback.risk_signals.map((signal: RiskSignal, index: number) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-red-500/5 border border-red-500/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-[#0E1012]">{signal.title}</h4>
                    <Badge variant="destructive" className="text-xs">
                      {signal.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#5A6B7F]">{signal.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Wins */}
        {feedback?.wins && Array.isArray(feedback.wins) && feedback.wins.length > 0 && (
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="font-rounded text-lg font-semibold text-[#0E1012]">
                Wins & Progress
              </h3>
            </div>
            <div className="space-y-3">
              {feedback.wins.map((win: Win, index: number) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-green-500/5 border border-green-500/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-[#0E1012]">{win.title}</h4>
                    {win.improvement && (
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700">
                        +{win.improvement}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#5A6B7F]">{win.description}</p>
                  {win.progress !== undefined && (
                    <Progress value={win.progress} className="mt-3 h-2" />
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Next Best Actions */}
        {feedback?.next_best_actions && Array.isArray(feedback.next_best_actions) && feedback.next_best_actions.length > 0 && (
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#12AFCB]" />
              </div>
              <h3 className="font-rounded text-lg font-semibold text-[#0E1012]">
                Next Best Actions
              </h3>
            </div>
            <div className="space-y-3">
              {feedback.next_best_actions.map((action: NextAction, index: number) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-[#12AFCB]/5 border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-[#0E1012]">{action.title}</h4>
                    <Badge className="text-xs bg-[#12AFCB]/10 text-[#12AFCB]">
                      {action.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#5A6B7F]">{action.description}</p>
                  {action.timeline && (
                    <p className="text-xs text-[#5A6B7F] mt-2">Timeline: {action.timeline}</p>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Empty State */}
        {!feedback && !loading && (
          <GlassCard className="p-12 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#12AFCB]/20 to-[#12AFCB]/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#12AFCB]" />
            </div>
            <h3 className="font-rounded text-lg font-semibold text-[#0E1012] mb-2">
              No Feedback Yet
            </h3>
            <p className="text-sm text-[#5A6B7F]">
              Your AI-generated longevity insights will appear here once available.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
