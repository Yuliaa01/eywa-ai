import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, ArrowLeft } from "lucide-react";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import ConnectionsStep from "@/components/onboarding/ConnectionsStep";
import ProfileAutofillStep from "@/components/onboarding/ProfileAutofillStep";

import ConsentsStep from "@/components/onboarding/ConsentsStep";
import SubscriptionStep from "@/components/onboarding/SubscriptionStep";
import GoalsStep from "@/components/onboarding/GoalsStep";
import NutritionStep from "@/components/onboarding/NutritionStep";
import LabsStep from "@/components/onboarding/LabsStep";
import PreferencesStep from "@/components/onboarding/PreferencesStep";
import BriefingStep from "@/components/onboarding/BriefingStep";

const TOTAL_STEPS = 10;

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(location.state?.step || 0);
  const [onboardingData, setOnboardingData] = useState<any>(() => {
    const saved = sessionStorage.getItem('onboardingData');
    return saved ? JSON.parse(saved) : {};
  });
  const [isCompleting, setIsCompleting] = useState(false);

  // Save onboarding data to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('onboardingData', JSON.stringify(onboardingData));
  }, [onboardingData]);

  useEffect(() => {
    // Check if user has already completed onboarding
    const checkOnboardingStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        navigate("/dashboard");
      }
    };

    checkOnboardingStatus();
  }, [navigate]);

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark onboarding as completed
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to skip onboarding. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleComplete = async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Prepare preferences for locale field
      const preferences = onboardingData.preferences || {};
      const nutrition = onboardingData.nutrition || {};
      const localeData = JSON.stringify({
        viewMode: preferences.viewMode || 'standard',
        aiTone: preferences.aiTone || 'friendly',
        macroMode: nutrition.macroMode || 'ai',
        preferredUnits: onboardingData.profile?.preferred_units || 'metric'
      });

      // Save all onboarding data
      const profileData = onboardingData.profile || {};
      const { preferred_units, ...profileWithoutPreferredUnits } = profileData;
      
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        ...profileWithoutPreferredUnits,
        diet_preferences: nutrition.diet || [],
        allergies: nutrition.allergies || [],
        locale: localeData,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

      if (onboardingData.consents) {
        for (const [key, enabled] of Object.entries(onboardingData.consents)) {
          if (enabled) {
            await supabase.from('consents').insert({
              user_id: user.id,
              purpose: key,
              data_scope: 'all',
            });
          }
        }
      }

      if (onboardingData.goals?.length > 0) {
        const goalInserts = onboardingData.goals.map((goal: string) => ({
          user_id: user.id,
          title: goal,
          type: 'longevity' as const,
          status: 'planned' as const,
        }));
        await supabase.from('priorities').insert(goalInserts);
      }

      // Clear sessionStorage after successful completion
      sessionStorage.removeItem('onboardingData');
      navigate("/dashboard");
    } catch (error) {
      console.error("Onboarding completion error:", error);
      toast({
        title: "Error",
        description: "Failed to save onboarding data. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={nextStep} />;
      case 1:
        return (
          <ConnectionsStep 
            onNext={nextStep}
            onDataIngested={(data) => setOnboardingData({ ...onboardingData, connections: data })}
          />
        );
      case 2:
        return (
          <ProfileAutofillStep
            profileData={onboardingData.profile}
            onNext={async (data) => {
              if (data) {
                // Save profile data immediately to database
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  // Get existing profile to preserve other locale data
                  const { data: existingProfile } = await supabase
                    .from('user_profiles')
                    .select('locale')
                    .eq('user_id', user.id)
                    .maybeSingle();
                  
                  // Parse existing locale or create new
                  let localeData = { preferredUnits: 'metric' };
                  if (existingProfile?.locale) {
                    try {
                      localeData = JSON.parse(existingProfile.locale);
                    } catch (e) {
                      console.error('Failed to parse locale:', e);
                    }
                  }
                  
                  // Update with new preferred_units
                  localeData.preferredUnits = data.preferred_units || 'metric';
                  
                  const { preferred_units, ...dbData } = data;
                  await supabase.from('user_profiles').upsert({
                    user_id: user.id,
                    ...dbData,
                    locale: JSON.stringify(localeData),
                    updated_at: new Date().toISOString(),
                  });
                }
                // Store in local state in the format ProfileAutofillStep expects
                setOnboardingData({ 
                  ...onboardingData, 
                  profile: {
                    firstName: data.first_name,
                    lastName: data.last_name,
                    dob: data.dob,
                    sex: data.sex_at_birth,
                    height: data.height_cm,
                    weight: data.weight_kg,
                    preferredUnits: data.preferred_units,
                  }
                });
              }
              nextStep();
            }}
          />
        );
      case 3:
        return (
          <ConsentsStep
            onNext={(consents) => {
              setOnboardingData({ ...onboardingData, consents });
              nextStep();
            }}
          />
        );
      case 4:
        return (
          <SubscriptionStep
            onNext={(planId) => {
              setOnboardingData({ ...onboardingData, subscription: planId });
              nextStep();
            }}
          />
        );
      case 5:
        return (
          <GoalsStep
            onNext={(goals) => {
              setOnboardingData({ ...onboardingData, goals });
              nextStep();
            }}
          />
        );
      case 6:
        return (
          <NutritionStep
            onNext={(nutrition) => {
              setOnboardingData({ ...onboardingData, nutrition });
              nextStep();
            }}
          />
        );
      case 7:
        return <LabsStep onNext={nextStep} />;
      case 8:
        return (
          <PreferencesStep
            onNext={(prefs) => {
              setOnboardingData({ ...onboardingData, preferences: prefs });
              nextStep();
            }}
          />
        );
      case 9:
        return <BriefingStep onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto py-12 space-y-12">
        {/* Back Button */}
        {currentStep > 1 && (
          <button
            onClick={prevStep}
            className="fixed top-6 left-6 w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-primary/10 shadow-card hover:shadow-glow hover:bg-card transition-all duration-300 flex items-center justify-center group z-50"
            aria-label="Go back"
            style={{ marginTop: '0px' }}
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        )}

        {/* Close Button */}
        {currentStep > 0 && (
          <button
            onClick={handleSkip}
            className="fixed top-6 right-6 w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-primary/10 shadow-card hover:shadow-glow hover:bg-card transition-all duration-300 flex items-center justify-center group z-50"
            aria-label="Skip onboarding"
            style={{ marginTop: '0px' }}
          >
            <X className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        )}

        {/* Progress Indicator */}
        {currentStep > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[0.875rem] font-medium text-muted-foreground">
              <span>Step {currentStep + 1} of {TOTAL_STEPS}</span>
              <span>{Math.round(((currentStep + 1) / TOTAL_STEPS) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden border border-primary/10">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step Content */}
        <div>
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
