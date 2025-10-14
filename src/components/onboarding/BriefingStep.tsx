import { FileDown, Sparkles } from "lucide-react";

interface BriefingStepProps {
  onComplete: () => void;
}

export default function BriefingStep({ onComplete }: BriefingStepProps) {
  const findings = [
    { title: 'LDL Cholesterol Elevated', severity: 'moderate', detail: 'Consider dietary adjustments and monitoring' },
    { title: 'HRV Optimal', severity: 'good', detail: 'Heart rate variability indicates good cardiovascular health' },
    { title: 'Vitamin D Borderline', severity: 'mild', detail: 'May benefit from supplementation' },
  ];

  const recommendations = [
    'Schedule follow-up lipid panel in 3 months',
    'Consider Mediterranean diet patterns',
    'Supplement with 2000 IU Vitamin D daily',
  ];

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)] animate-glow-pulse">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#12AFCB] to-[#12AFCB]/70 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
          Your Medical Briefing
        </h2>
        <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
          AI analysis of your health data is complete
        </p>
      </div>

      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <h3 className="text-[1.25rem] font-semibold text-[#0E1012] mb-6">Key Findings</h3>
        <div className="space-y-4">
          {findings.map((finding, idx) => (
            <div 
              key={idx}
              className="p-5 rounded-2xl bg-white/60 border border-[#12AFCB]/10 hover:bg-white/80 hover:border-[#12AFCB]/20 transition-all duration-standard"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-[1.0625rem] font-semibold text-[#0E1012]">
                  {finding.title}
                </h4>
                <span className={`px-2 py-1 rounded-full text-[0.75rem] font-medium ${
                  finding.severity === 'good' ? 'bg-green-500/10 text-green-600' :
                  finding.severity === 'moderate' ? 'bg-yellow-500/10 text-yellow-600' :
                  'bg-blue-500/10 text-blue-600'
                }`}>
                  {finding.severity}
                </span>
              </div>
              <p className="text-[0.9375rem] text-[#5A6B7F]">
                {finding.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <h3 className="text-[1.25rem] font-semibold text-[#0E1012] mb-6">AI Recommendations</h3>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div 
              key={idx}
              className="flex items-start gap-3"
              style={{ animationDelay: `${(idx + 3) * 100}ms` }}
            >
              <div className="w-2 h-2 rounded-full bg-[#12AFCB] mt-2 flex-shrink-0" />
              <p className="text-[1rem] text-[#0E1012] leading-relaxed">
                {rec}
              </p>
            </div>
          ))}
        </div>
      </div>

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
