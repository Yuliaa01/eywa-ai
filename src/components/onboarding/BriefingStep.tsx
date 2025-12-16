import { useState, useEffect } from "react";
import { FileDown, Sparkles, Heart, Apple, Activity, FlaskConical, Target, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Finding {
  title: string;
  severity: 'good' | 'moderate' | 'attention';
  detail: string;
  category: 'body' | 'nutrition' | 'activity' | 'goals';
}

interface Recommendation {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

interface BriefingData {
  findings: Finding[];
  recommendations: Recommendation[];
  healthScore: number;
  summary: string;
}

interface BriefingStepProps {
  onComplete: () => void;
  onboardingData?: {
    profile?: {
      firstName?: string;
      lastName?: string;
      dob?: string;
      sex?: string;
      height?: number;
      weight?: number;
    };
    goals?: string[];
    nutrition?: {
      diet?: string[];
      allergies?: string[];
      macroMode?: string;
    };
    connections?: any[];
  };
}

const categoryIcons: Record<string, React.ReactNode> = {
  body: <Heart className="w-5 h-5" />,
  nutrition: <Apple className="w-5 h-5" />,
  activity: <Activity className="w-5 h-5" />,
  goals: <Target className="w-5 h-5" />,
  labs: <FlaskConical className="w-5 h-5" />,
};

const severityColors: Record<string, string> = {
  good: 'bg-green-500/10 text-green-600',
  moderate: 'bg-yellow-500/10 text-yellow-600',
  attention: 'bg-orange-500/10 text-orange-600',
};

const priorityColors: Record<string, string> = {
  high: 'bg-[#12AFCB]/10 text-[#12AFCB]',
  medium: 'bg-blue-500/10 text-blue-600',
  low: 'bg-gray-500/10 text-gray-600',
};

export default function BriefingStep({ onComplete, onboardingData }: BriefingStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [briefingData, setBriefingData] = useState<BriefingData | null>(null);
  const firstName = onboardingData?.profile?.firstName;

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-onboarding-briefing', {
          body: { onboardingData }
        });

        if (error) {
          console.error('Error fetching briefing:', error);
          // Use fallback data
          setBriefingData(getFallbackData());
        } else {
          setBriefingData(data);
        }
      } catch (err) {
        console.error('Error:', err);
        setBriefingData(getFallbackData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchBriefing();
  }, [onboardingData]);

  const getFallbackData = (): BriefingData => ({
    findings: [
      { title: 'Profile Complete', severity: 'good', detail: 'Your health profile has been set up successfully', category: 'body' },
      { title: 'Goals Set', severity: 'good', detail: `You've established ${onboardingData?.goals?.length || 0} health goals`, category: 'goals' },
      { title: 'Ready to Track', severity: 'good', detail: 'Start logging to receive personalized insights', category: 'activity' },
    ],
    recommendations: [
      { text: 'Complete your first activity log this week', priority: 'high' },
      { text: 'Track your meals to understand nutrition patterns', priority: 'medium' },
      { text: 'Review your goals weekly for best results', priority: 'low' },
    ],
    healthScore: 75,
    summary: 'Your health journey begins now. Personalized insights will improve as you use the app.',
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-scale-in">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)] animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#12AFCB] to-[#12AFCB]/70 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
          </div>
          <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
            Analyzing Your Data
          </h2>
          <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
            Our AI is reviewing your profile and creating personalized insights...
          </p>
        </div>

        {/* Skeleton cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-white/60 border border-[#12AFCB]/10 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { findings, recommendations, healthScore, summary } = briefingData || getFallbackData();

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)] animate-glow-pulse">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#12AFCB] to-[#12AFCB]/70 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
          {firstName ? `${firstName}'s Health Briefing` : 'Your Health Briefing'}
        </h2>
        <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
          {summary}
        </p>
      </div>


      {/* Findings */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <h3 className="text-[1.25rem] font-semibold text-[#0E1012] mb-6">Key Findings</h3>
        <div className="space-y-4">
          {findings.map((finding, idx) => (
            <div 
              key={idx}
              className="p-5 rounded-2xl bg-white/60 border border-[#12AFCB]/10 hover:bg-white/80 hover:border-[#12AFCB]/20 transition-all duration-standard animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center text-[#12AFCB] flex-shrink-0">
                  {categoryIcons[finding.category] || categoryIcons.body}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-[1.0625rem] font-semibold text-[#0E1012]">
                      {finding.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-[0.75rem] font-medium flex-shrink-0 ${severityColors[finding.severity]}`}>
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-[0.9375rem] text-[#5A6B7F]">
                    {finding.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <h3 className="text-[1.25rem] font-semibold text-[#0E1012] mb-6">AI Recommendations</h3>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div 
              key={idx}
              className="flex items-start gap-3 animate-fade-in"
              style={{ animationDelay: `${(findings.length + idx) * 100}ms` }}
            >
              <span className={`px-2 py-0.5 rounded-full text-[0.6875rem] font-medium uppercase tracking-wide flex-shrink-0 mt-0.5 ${priorityColors[rec.priority]}`}>
                {rec.priority}
              </span>
              <p className="text-[1rem] text-[#0E1012] leading-relaxed">
                {rec.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button
          onClick={onComplete}
          className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
        >
          Continue to Dashboard
        </button>

        <button className="w-full h-12 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#5A6B7F] font-rounded font-medium text-[1rem] hover:bg-white/80 hover:text-[#0E1012] hover:border-[#12AFCB]/20 transition-all duration-standard flex items-center justify-center gap-2">
          <FileDown className="w-4 h-4" />
          Download PDF Report
        </button>
      </div>
    </div>
  );
}
