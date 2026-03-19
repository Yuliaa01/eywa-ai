import { useState } from "react";
import { Shield, Bell, MapPin, FileText, Dna } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Consent {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
  enabled: boolean;
}

interface ConsentsStepProps {
  onNext: (consents: Record<string, boolean>) => void;
  initialConsents?: Record<string, boolean>;
}

export default function ConsentsStep({ onNext, initialConsents }: ConsentsStepProps) {
  const navigate = useNavigate();
  const [consents, setConsents] = useState<Consent[]>([
    {
      id: 'health_data',
      title: 'Health Data Import',
      description: 'Labs, EHR, wearables, and medical records',
      icon: Shield,
      required: true,
      enabled: initialConsents?.health_data ?? true,
    },
    {
      id: 'camera',
      title: 'Camera/Photos',
      description: 'Scan lab reports and medical documents',
      icon: FileText,
      required: false,
      enabled: initialConsents?.camera ?? false,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Health reminders and alerts',
      icon: Bell,
      required: false,
      enabled: initialConsents?.notifications ?? true,
    },
    {
      id: 'location',
      title: 'Location',
      description: 'Find nearby clinics, cafés, and venues',
      icon: MapPin,
      required: false,
      enabled: initialConsents?.location ?? false,
    },
    {
      id: 'genetic',
      title: 'Genetic Data',
      description: 'DNA analysis and genomic insights',
      icon: Dna,
      required: false,
      enabled: initialConsents?.genetic ?? false,
    },
  ]);

  const toggleConsent = (id: string) => {
    setConsents(prev => prev.map(c => 
      c.id === id && !c.required ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const allOptionalEnabled = consents.filter(c => !c.required).every(c => c.enabled);

  const handleSelectAll = () => {
    setConsents(prev => prev.map(c => ({ ...c, enabled: true })));
  };

  const handleContinue = () => {
    const consentMap = consents.reduce((acc, c) => ({
      ...acc,
      [c.id]: c.enabled
    }), {});
    onNext(consentMap);
  };

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)]">
          <Shield className="w-10 h-10 text-[#12AFCB]" />
        </div>
        <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
          Data Access & Privacy
        </h2>
        <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
          Control what data inLive can access
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSelectAll}
          disabled={allOptionalEnabled}
          className="px-4 py-2 rounded-xl text-[0.875rem] font-medium text-[#12AFCB] hover:bg-[#12AFCB]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Select All
        </button>
      </div>

      <div className="space-y-4">
        {consents.map((consent, idx) => {
          const Icon = consent.icon;
          return (
            <button
              key={consent.id}
              onClick={() => toggleConsent(consent.id)}
              disabled={consent.required}
              className="w-full rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-6 shadow-[0_4px_20px_rgba(18,175,203,0.06)] hover:bg-white/80 hover:border-[#12AFCB]/20 transition-all duration-standard disabled:cursor-not-allowed text-left"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  consent.enabled
                    ? 'bg-gradient-to-br from-[#12AFCB] to-[#12AFCB]/80'
                    : 'bg-white/60'
                }`}>
                  <Icon className={`w-6 h-6 ${consent.enabled ? 'text-white' : 'text-[#5A6B7F]'}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[1.0625rem] font-semibold text-[#0E1012]">
                      {consent.title}
                    </h3>
                    {consent.required && (
                      <span className="px-2 py-0.5 rounded-full bg-[#12AFCB]/10 text-[0.75rem] text-[#12AFCB] font-medium">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-[0.9375rem] text-[#5A6B7F]">
                    {consent.description}
                  </p>
                </div>

                <div className={`w-12 h-7 rounded-full transition-all duration-300 flex-shrink-0 ${
                  consent.enabled ? 'bg-[#12AFCB]' : 'bg-[#5A6B7F]/20'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 mt-1 ${
                    consent.enabled ? 'ml-6' : 'ml-1'
                  }`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <button
          onClick={handleContinue}
          className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
        >
          Continue
        </button>

        <div className="text-center">
          <button 
            onClick={() => navigate('/privacy-policy')}
            className="text-[0.875rem] text-[#5A6B7F] hover:text-[#12AFCB] transition-colors"
          >
            View Privacy Policy & Terms
          </button>
        </div>
      </div>
    </div>
  );
}
