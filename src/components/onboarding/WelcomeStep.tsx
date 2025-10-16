import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  const navigate = useNavigate();
  const [showDataUsage, setShowDataUsage] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSignIn = async () => {
    // Sign out first if there's an existing session
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <>
      <Dialog open={showDataUsage} onOpenChange={setShowDataUsage}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How Your Data Is Used</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>At Eywa AI, we take your privacy seriously. Here's how we handle your data:</p>
            
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Data Collection</h3>
                <p>We collect health metrics, lab results, wearable device data, and lifestyle information you provide to deliver personalized health insights.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-1">Data Usage</h3>
                <p>Your data is used exclusively to:</p>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Generate personalized health recommendations</li>
                  <li>Track your health trends over time</li>
                  <li>Improve our AI models (anonymized data only)</li>
                  <li>Facilitate communication with healthcare providers (with your consent)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-1">Data Security</h3>
                <p>All data is encrypted in transit and at rest. We use industry-standard security practices and comply with HIPAA regulations.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-1">Data Sharing</h3>
                <p>We never sell your data. Data is only shared with third parties when you explicitly consent or as required by law.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-1">Your Rights</h3>
                <p>You have the right to access, export, or delete your data at any time through your account settings.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p className="text-xs text-muted-foreground">Last updated: October 2025</p>
            
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground mb-1">1. Acceptance of Terms</h3>
                <p>By accessing or using Eywa AI, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-1">2. Medical Disclaimer</h3>
                <p>Eywa AI provides health information and guidance but does not provide medical diagnosis, treatment, or professional medical advice. Always consult with qualified healthcare professionals for medical decisions.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-1">3. User Responsibilities</h3>
                <p>You are responsible for:</p>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Providing accurate health information</li>
                  <li>Maintaining the confidentiality of your account</li>
                  <li>Using the service in compliance with applicable laws</li>
                  <li>Not sharing medical advice from Eywa AI as your own professional opinion</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-1">4. Service Availability</h3>
                <p>We strive to maintain service availability but do not guarantee uninterrupted access. We reserve the right to modify or discontinue features with notice.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-1">5. Limitation of Liability</h3>
                <p>Eywa AI and its affiliates shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-1">6. Termination</h3>
                <p>We reserve the right to terminate or suspend your account for violations of these terms or for any reason with notice.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          <button 
            onClick={handleSignIn}
            className="text-[#12AFCB] hover:underline transition-colors font-medium"
          >
            Sign In
          </button>
          <span className="text-[#5A6B7F]">·</span>
          <button 
            onClick={() => setShowDataUsage(true)}
            className="text-[#5A6B7F] hover:text-[#12AFCB] transition-colors"
          >
            How your data is used
          </button>
          <span className="text-[#5A6B7F]">·</span>
          <button 
            onClick={() => setShowTerms(true)}
            className="text-[#5A6B7F] hover:text-[#12AFCB] transition-colors"
          >
            Terms
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
