import { Shield } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)] hover:shadow-[0_8px_32px_rgba(18,175,203,0.15)] transition-all duration-300">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#12AFCB] to-[#12AFCB]/70 flex items-center justify-center">
            <Shield className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="font-rounded text-[2.5rem] font-bold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent leading-tight">
            Welcome to <span className="text-[#12AFCB]">Eywa AI</span>
          </h1>
          <p className="font-rounded text-[1.125rem] font-medium text-[#0E1012] max-w-2xl mx-auto">
            Your AI-powered medical guidance companion
          </p>
          <p className="text-[1rem] text-[#5A6B7F] max-w-xl mx-auto leading-relaxed">
            We interpret your medical data, lab results, and lifestyle signals to personalize care plans and optimize longevity.
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-6 shadow-[0_4px_20px_rgba(18,175,203,0.06)] max-w-2xl mx-auto">
        <div className="flex items-start gap-4 text-[0.9375rem] text-[#5A6B7F] leading-relaxed">
          <Shield className="w-5 h-5 text-[#12AFCB] flex-shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold text-[#0E1012]">Medical Guidance Notice:</span> Eywa AI provides data-driven medical advice and analysis. It does not replace in-person evaluation or emergency care. For urgent symptoms, call your local emergency number.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={onNext}
          className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
        >
          Get Started
        </button>
        
        <div className="flex items-center justify-center gap-6 text-[0.875rem]">
          <button className="text-[#12AFCB] hover:underline transition-colors font-medium">
            Sign In
          </button>
          <span className="text-[#5A6B7F]">·</span>
          <button className="text-[#5A6B7F] hover:text-[#12AFCB] transition-colors">
            How your data is used
          </button>
          <span className="text-[#5A6B7F]">·</span>
          <button className="text-[#5A6B7F] hover:text-[#12AFCB] transition-colors">
            Terms
          </button>
        </div>
      </div>
    </div>
  );
}
