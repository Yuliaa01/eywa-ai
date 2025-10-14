import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Activity, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast({
          variant: "destructive",
          title: "Invalid or expired link",
          description: "Please request a new password reset link.",
          duration: 5000,
        });
        navigate("/auth/forgot-password");
      }
    });
  }, [navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = passwordSchema.parse({ password, confirmPassword });

      const { error } = await supabase.auth.updateUser({
        password: validatedData.password,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Password updated successfully",
        description: "You can now sign in with your new password.",
        duration: 5000,
      });

      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
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
              {success ? (
                <CheckCircle2 className="w-10 h-10 text-accentTeal" />
              ) : (
                <Lock className="w-10 h-10 text-accentTeal" />
              )}
            </div>
            <h2 className="text-3xl font-semibold mb-3 text-foreground">
              {success ? "Password Updated!" : "Create New Password"}
            </h2>
            <p className="text-muted-foreground/70 text-base">
              {success
                ? "Redirecting you to sign in..."
                : "Enter a new password for your account."}
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="password" className="text-foreground/80 text-sm">
                  <Lock className="w-4 h-4 inline mr-2 text-accentTeal" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                    className="bg-white/5 backdrop-blur-xl border-white/10 focus:border-accentTeal/50 h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-accentTeal transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirm-password" className="text-foreground/80 text-sm">
                  <Lock className="w-4 h-4 inline mr-2 text-accentTeal" />
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                    className="bg-white/5 backdrop-blur-xl border-white/10 focus:border-accentTeal/50 h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-accentTeal transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground/60">
                  At least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-accentTeal to-accentTealAlt text-white font-medium rounded-2xl hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-accentTeal/10 backdrop-blur-xl border border-accentTeal/20 text-center">
              <p className="text-foreground/80 text-sm">
                Your password has been successfully updated. You'll be redirected to the sign-in page shortly.
              </p>
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
