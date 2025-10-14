import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GlassCard, ActionButton, SnackBanner } from "@/components/glass";
import { 
  Heart, 
  Activity, 
  Apple, 
  Check, 
  Shield,
  ChevronRight 
} from "lucide-react";
import { HealthKitProvider } from "@/utils/healthIntegrations";

const STEPS = [
  { id: 'consent', title: 'Privacy & Consent', icon: Shield },
  { id: 'healthkit', title: 'Connect HealthKit', icon: Apple },
  { id: 'sync', title: 'Initial Sync', icon: Activity },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [consented, setConsented] = useState(false);
  const [healthKitConnected, setHealthKitConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleConsent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('consents').insert({
        user_id: user.id,
        purpose: 'health_data_processing',
        data_scope: 'wearables,biomarkers,nutrition,lifestyle',
      });

      setConsented(true);
      setCurrentStep(1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record consent. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleHealthKitConnect = async () => {
    try {
      const granted = await HealthKitProvider.requestAuthorization();
      
      if (!granted) {
        toast({
          title: "HealthKit Not Available",
          description: "HealthKit integration requires a native iOS app. You can skip this step and manually add data.",
          duration: 3000,
        });
        setCurrentStep(2);
        return;
      }

      setHealthKitConnected(true);
      setCurrentStep(2);
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to HealthKit. You can skip and add data manually.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleInitialSync = async () => {
    setSyncing(true);
    
    try {
      if (healthKitConnected) {
        // Simulate HealthKit sync
        await HealthKitProvider.readVitals();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Some data couldn't be synced, but you can proceed to your dashboard.",
        variant: "destructive",
        duration: 3000,
      });
      navigate("/dashboard");
    } finally {
      setSyncing(false);
    }
  };

  const StepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-8 animate-scale-in">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)] hover:shadow-[0_8px_32px_rgba(18,175,203,0.15)] transition-all duration-300">
                <Shield className="w-12 h-12 text-[#12AFCB]" />
              </div>
              <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
                Privacy First
              </h2>
              <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
                Your health data is encrypted end-to-end and stored securely. You control what gets shared and with whom.
              </p>
            </div>

            <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)] hover:border-[#12AFCB]/20 hover:shadow-[0_8px_32px_rgba(18,175,203,0.12)] transition-all duration-standard group">
              <div className="space-y-5">
                <div className="flex items-start gap-4 group-hover:translate-x-1 transition-transform duration-standard">
                  <Check className="w-6 h-6 text-[#12AFCB] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[1.0625rem] font-semibold text-[#0E1012] mb-1">Data Encryption</h4>
                    <p className="text-[0.9375rem] text-[#5A6B7F]">All data encrypted at rest and in transit</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group-hover:translate-x-1 transition-transform duration-standard delay-75">
                  <Check className="w-6 h-6 text-[#12AFCB] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[1.0625rem] font-semibold text-[#0E1012] mb-1">Your Control</h4>
                    <p className="text-[0.9375rem] text-[#5A6B7F]">Revoke access or export data anytime</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 group-hover:translate-x-1 transition-transform duration-standard delay-150">
                  <Check className="w-6 h-6 text-[#12AFCB] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[1.0625rem] font-semibold text-[#0E1012] mb-1">HIPAA Compliant</h4>
                    <p className="text-[0.9375rem] text-[#5A6B7F]">Healthcare-grade security standards</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleConsent}
              className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
            >
              I Agree - Continue
              <ChevronRight className="inline w-5 h-5 ml-2" />
            </button>

            <p className="text-[0.8125rem] text-center text-[#5A6B7F]">
              By continuing, you agree to our{" "}
              <a href="/terms" className="text-[#12AFCB] hover:underline transition-colors">Terms</a> and{" "}
              <a href="/privacy" className="text-[#12AFCB] hover:underline transition-colors">Privacy Policy</a>
            </p>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8 animate-scale-in">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)] hover:shadow-[0_8px_32px_rgba(18,175,203,0.15)] transition-all duration-300">
                <Apple className="w-12 h-12 text-[#12AFCB]" />
              </div>
              <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
                Connect HealthKit
              </h2>
              <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
                Import data from your Apple Watch, iPhone, and connected apps automatically.
              </p>
            </div>

            <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
              <div className="space-y-6">
                <h4 className="text-[1.0625rem] font-semibold text-[#0E1012]">We'll import:</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    'Heart Rate', 'HRV', 'Sleep', 'Steps',
                    'VO₂max', 'Blood Pressure', 'Glucose', 'Workouts'
                  ].map((metric, idx) => (
                    <div 
                      key={metric} 
                      className="flex items-center gap-3 text-[0.9375rem] text-[#5A6B7F] hover:text-[#0E1012] transition-colors"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <Check className="w-5 h-5 text-[#12AFCB] flex-shrink-0" />
                      {metric}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleHealthKitConnect}
                className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard flex items-center justify-center gap-3"
              >
                <Apple className="w-6 h-6" />
                Connect HealthKit
              </button>

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full h-12 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#5A6B7F] font-rounded font-medium text-[1rem] hover:bg-white/80 hover:text-[#0E1012] hover:border-[#12AFCB]/20 transition-all duration-standard"
              >
                Skip - Add Data Manually
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-scale-in">
            <div className="text-center space-y-6">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)] transition-all duration-300 ${syncing ? 'animate-glow-pulse' : 'hover:shadow-[0_8px_32px_rgba(18,175,203,0.15)]'}`}>
                <Activity className="w-12 h-12 text-[#12AFCB]" />
              </div>
              <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
                {syncing ? "Syncing Your Data..." : "Ready to Go!"}
              </h2>
              <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
                {syncing 
                  ? "Importing your health data and preparing your personalized dashboard."
                  : "Your health intelligence hub is set up and ready to use."
                }
              </p>
            </div>

            {syncing && (
              <div className="space-y-4">
                <div className="h-3 rounded-full bg-white/60 overflow-hidden border border-[#12AFCB]/10">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/70 animate-shimmer" 
                    style={{ 
                      width: '66%',
                      backgroundSize: '200% 100%',
                      backgroundImage: 'linear-gradient(90deg, #12AFCB 0%, #E8FAFF 50%, #12AFCB 100%)'
                    }}
                  />
                </div>
                <p className="text-[0.8125rem] text-center text-[#5A6B7F]">
                  This may take a few moments...
                </p>
              </div>
            )}

            {!syncing && (
              <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
                <div className="space-y-5">
                  <div className="flex items-center gap-4 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-[1.0625rem] text-[#0E1012]">Privacy consent recorded</span>
                  </div>
                  <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-[1.0625rem] text-[#0E1012]">
                      {healthKitConnected ? "HealthKit connected" : "Manual data entry enabled"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-[1.0625rem] text-[#0E1012]">AI health coach activated</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleInitialSync}
              disabled={syncing}
              className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              {syncing ? (
                "Please Wait..."
              ) : (
                <>
                  <Heart className="w-6 h-6" />
                  Go to Dashboard
                </>
              )}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FCFF] via-[#EFF8FB] to-[#E8FAFF]/30 p-6">
      <div className="max-w-2xl mx-auto py-12 space-y-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-between px-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-3 flex-1">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-[#12AFCB] to-[#12AFCB]/80 shadow-[0_0_24px_rgba(18,175,203,0.4)] scale-105'
                        : isComplete
                        ? 'bg-[#12AFCB]/20 border border-[#12AFCB]/30'
                        : 'bg-white/60 border border-[#12AFCB]/10'
                    }`}
                  >
                    {isComplete ? (
                      <Check className="w-7 h-7 text-white" />
                    ) : (
                      <Icon className={`w-7 h-7 ${isActive ? 'text-white' : 'text-[#5A6B7F]'}`} />
                    )}
                  </div>
                  <span className={`text-[0.8125rem] font-rounded font-medium transition-colors ${isActive ? 'text-[#0E1012]' : 'text-[#5A6B7F]'}`}>
                    {step.title}
                  </span>
                </div>

                {index < STEPS.length - 1 && (
                  <div className={`h-[2px] flex-1 transition-all duration-300 ${
                    isComplete ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/50' : 'bg-[#12AFCB]/10'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div>
          <StepContent />
        </div>
      </div>
    </div>
  );
}
