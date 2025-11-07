import { useState } from "react";
import { Eye, Moon, MessageSquare } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface PreferencesStepProps {
  onNext: (prefs: any) => void;
}

export default function PreferencesStep({ onNext }: PreferencesStepProps) {
  const { theme, setTheme } = useTheme();
  const [viewMode, setViewMode] = useState('standard');
  const [aiTone, setAiTone] = useState('friendly');

  const handleContinue = () => {
    onNext({ viewMode, theme, aiTone });
  };

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-card/80 backdrop-blur-xl border border-primary/10 shadow-card">
          <Eye className="w-10 h-10 text-primary" />
        </div>
        <h2 className="font-rounded text-[2rem] font-semibold text-foreground">
          Preferences & Modes
        </h2>
        <p className="text-[1.0625rem] text-muted-foreground max-w-md mx-auto leading-relaxed">
          Customize your Eywa AI experience
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-[1.125rem] font-semibold text-foreground mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            View Mode
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {['Standard', 'Professional', 'Doctor View'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode.toLowerCase().replace(' ', '_'))}
                className={`p-4 rounded-2xl font-medium text-[0.9375rem] transition-all ${
                  viewMode === mode.toLowerCase().replace(' ', '_')
                    ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]'
                    : 'bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[1.125rem] font-semibold text-foreground mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            Theme
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {['Light', 'Dark', 'System'].map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption.toLowerCase() as "light" | "dark" | "system")}
                className={`p-4 rounded-2xl font-medium text-[0.9375rem] transition-all ${
                  theme === themeOption.toLowerCase()
                    ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]'
                    : 'bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20'
                }`}
              >
                {themeOption}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[1.125rem] font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            AI Tone
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {['Friendly', 'Clinical'].map((tone) => (
              <button
                key={tone}
                onClick={() => setAiTone(tone.toLowerCase())}
                className={`p-4 rounded-2xl font-medium text-[0.9375rem] transition-all ${
                  aiTone === tone.toLowerCase()
                    ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]'
                    : 'bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-primary/10 p-6">
          <p className="text-[0.875rem] text-muted-foreground">
            <span className="font-semibold text-foreground">Time zone:</span> Auto-detected from your location
          </p>
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_12px_rgba(18,175,203,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        Continue
      </button>
    </div>
  );
}
