import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Activity, Mail, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = emailSchema.parse({ email: email.trim() });
      
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        validatedData.email,
        {
          redirectTo: redirectUrl,
        }
      );

      if (error) throw error;

      setSent(true);
      toast({
        title: "Reset email sent",
        description: "If an account exists with this email, you'll receive password reset instructions.",
        duration: 5000,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: firstError.message,
          duration: 3000,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
          duration: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background/50 via-background/80 to-primary/[0.02] backdrop-blur-xl">
      {/* Header */}
      <div className="p-8 pb-0">
        <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground/80 hover:text-accentTeal transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to sign in</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accentTeal/20 to-accentTealAlt/20 backdrop-blur-xl border border-white/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-accentTeal" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Eywa AI</h1>
            <p className="text-sm text-muted-foreground/80">Your Health & Longevity Hub</p>
          </div>
        </div>
      </div>

      {/* Reset Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-accentTeal/10 to-accentTealAlt/10 backdrop-blur-xl border border-white/10 mb-6">
              <Mail className="w-10 h-10 text-accentTeal" />
            </div>
            <h2 className="text-3xl font-semibold mb-3 text-foreground">Reset Your Password</h2>
            <p className="text-muted-foreground/70 text-base">
              Enter your registered email. We'll send a password reset link to regain access.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-foreground/80 text-sm">
                  <Mail className="w-4 h-4 inline mr-2 text-accentTeal" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-white/5 backdrop-blur-xl border-white/10 focus:border-accentTeal/50 h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-accentTeal to-accentTealAlt text-white font-medium rounded-2xl hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="p-6 rounded-2xl bg-accentTeal/10 backdrop-blur-xl border border-accentTeal/20">
                <p className="text-foreground/80 text-sm">
                  Password reset email sent. Please check your inbox and follow the instructions.
                </p>
              </div>
              <Link to="/auth">
                <Button
                  variant="outline"
                  className="w-full h-12 bg-white/5 backdrop-blur-xl border-white/10 hover:border-accentTeal/50"
                >
                  Return to Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 text-center text-xs text-muted-foreground/50">
        <p>🔒 HIPAA-compliant • End-to-end encrypted</p>
      </div>
    </div>
  );
}
