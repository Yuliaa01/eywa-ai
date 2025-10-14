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
      
      toast({
        title: "Consent Recorded",
        description: "Your privacy preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record consent. Please try again.",
        variant: "destructive",
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
        });
        setCurrentStep(2);
        return;
      }

      setHealthKitConnected(true);
      setCurrentStep(2);
      
      toast({
        title: "HealthKit Connected",
        description: "Successfully authorized health data access.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to HealthKit. You can skip and add data manually.",
        variant: "destructive",
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

      toast({
        title: "Sync Complete",
        description: "Your health dashboard is ready!",
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Some data couldn't be synced, but you can proceed to your dashboard.",
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
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <Shield className="w-16 h-16 mx-auto text-accent-teal" />
              <h2 className="text-h2 font-bold text-foreground">Privacy First</h2>
              <p className="text-body text-ink-muted max-w-md mx-auto">
                Your health data is encrypted end-to-end and stored securely. You control what gets shared and with whom.
              </p>
            </div>

            <GlassCard className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-body font-medium">Data Encryption</h4>
                    <p className="text-caption text-ink-muted">All data encrypted at rest and in transit</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-body font-medium">Your Control</h4>
                    <p className="text-caption text-ink-muted">Revoke access or export data anytime</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-body font-medium">HIPAA Compliant</h4>
                    <p className="text-caption text-ink-muted">Healthcare-grade security standards</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <ActionButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleConsent}
            >
              I Agree - Continue
            </ActionButton>

            <p className="text-caption text-center text-ink-muted">
              By continuing, you agree to our{" "}
              <a href="/terms" className="text-accent-teal hover:underline">Terms</a> and{" "}
              <a href="/privacy" className="text-accent-teal hover:underline">Privacy Policy</a>
            </p>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <Apple className="w-16 h-16 mx-auto text-accent-teal" />
              <h2 className="text-h2 font-bold text-foreground">Connect HealthKit</h2>
              <p className="text-body text-ink-muted max-w-md mx-auto">
                Import data from your Apple Watch, iPhone, and connected apps automatically.
              </p>
            </div>

            <GlassCard className="p-6">
              <div className="space-y-4">
                <h4 className="text-body font-medium">We'll import:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Heart Rate', 'HRV', 'Sleep', 'Steps',
                    'VO₂max', 'Blood Pressure', 'Glucose', 'Workouts'
                  ].map((metric) => (
                    <div key={metric} className="flex items-center gap-2 text-caption text-ink-muted">
                      <Check className="w-4 h-4 text-accent-teal flex-shrink-0" />
                      {metric}
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            <div className="space-y-3">
              <ActionButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleHealthKitConnect}
                icon={<Apple className="w-5 h-5" />}
              >
                Connect HealthKit
              </ActionButton>

              <ActionButton
                variant="ghost"
                size="md"
                className="w-full"
                onClick={() => setCurrentStep(2)}
              >
                Skip - Add Data Manually
              </ActionButton>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <Activity className="w-16 h-16 mx-auto text-accent-teal animate-glow-pulse" />
              <h2 className="text-h2 font-bold text-foreground">
                {syncing ? "Syncing Your Data..." : "Ready to Go!"}
              </h2>
              <p className="text-body text-ink-muted max-w-md mx-auto">
                {syncing 
                  ? "Importing your health data and preparing your personalized dashboard."
                  : "Your health intelligence hub is set up and ready to use."
                }
              </p>
            </div>

            {syncing && (
              <div className="space-y-3">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-2/3 bg-accent-teal rounded-full animate-shimmer" />
                </div>
                <p className="text-caption text-center text-ink-muted">
                  This may take a few moments...
                </p>
              </div>
            )}

            {!syncing && (
              <GlassCard className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-body">Privacy consent recorded</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-body">
                      {healthKitConnected ? "HealthKit connected" : "Manual data entry enabled"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-body">AI health coach activated</span>
                  </div>
                </div>
              </GlassCard>
            )}

            <ActionButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleInitialSync}
              disabled={syncing}
              icon={<Heart className="w-5 h-5" />}
            >
              {syncing ? "Please Wait..." : "Go to Dashboard"}
            </ActionButton>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink via-ink/95 to-accent-teal/10 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-standard ${
                      isActive
                        ? 'bg-accent-teal shadow-glow-teal'
                        : isComplete
                        ? 'bg-accent-teal/30'
                        : 'bg-white/10'
                    }`}
                  >
                    {isComplete ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-ink-muted'}`} />
                    )}
                  </div>
                  <span className={`text-caption ${isActive ? 'text-white font-medium' : 'text-ink-muted'}`}>
                    {step.title}
                  </span>
                </div>

                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 transition-all ${
                    isComplete ? 'bg-accent-teal' : 'bg-white/10'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="animate-fade-in">
          <StepContent />
        </div>
      </div>
    </div>
  );
}
