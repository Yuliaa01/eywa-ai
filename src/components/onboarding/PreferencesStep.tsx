import { useState } from "react";
import { Eye, Moon, MessageSquare } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface PreferencesStepProps {
  onNext: (prefs: any) => void;
}

export default function PreferencesStep({ onNext }: PreferencesStepProps) {
  const { theme, setTheme: setGlobalTheme } = useTheme();
  const [viewMode, setViewMode] = useState('standard');
  const [localTheme, setLocalTheme] = useState<"light" | "dark" | "system">(theme);
  const [aiTone, setAiTone] = useState('friendly');

  const handleThemeChange = (newTheme: string) => {
    const typedTheme = newTheme as "light" | "dark" | "system";
    setLocalTheme(typedTheme);
    setGlobalTheme(typedTheme);
  };

  const handleContinue = () => {
    onNext({ viewMode, theme: localTheme, aiTone });
  };

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)]">
          <Eye className="w-10 h-10 text-[#12AFCB]" />
        </div>
        <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
          Preferences & Modes
        </h2>
        <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
          Customize your Eywa AI experience
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-[1.125rem] font-semibold text-[#0E1012] mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#12AFCB]" />
            View Mode
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {['Standard', 'Professional', 'Doctor View'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode.toLowerCase().replace(' ', '_'))}
                className={`p-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard ${
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
          <h3 className="text-[1.125rem] font-semibold text-[#0E1012] mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-[#12AFCB]" />
            Theme
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {['Light', 'Dark', 'System'].map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => handleThemeChange(themeOption.toLowerCase())}
                className={`p-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard ${
                  localTheme === themeOption.toLowerCase()
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
          <h3 className="text-[1.125rem] font-semibold text-[#0E1012] mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#12AFCB]" />
            AI Tone
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {['Friendly', 'Clinical'].map((tone) => (
              <button
                key={tone}
                onClick={() => setAiTone(tone.toLowerCase())}
                className={`p-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard ${
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

        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-6">
          <p className="text-[0.875rem] text-[#5A6B7F]">
            <span className="font-semibold text-[#0E1012]">Time zone:</span> Auto-detected from your location
          </p>
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
      >
        Continue
      </button>
    </div>
  );
}
