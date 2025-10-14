import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Heart, Lock, Mail } from "lucide-react";
import { z } from "zod";

// Security: Input validation schema to prevent malformed data and enforce password strength
const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/onboarding");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/onboarding");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Security: Validate inputs before submitting to prevent malformed data
      const validatedData = authSchema.parse({
        email: email.trim(),
        password,
      });

      const redirectUrl = `${window.location.origin}/onboarding`;
      const { error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      // Success - navigate without notification
    } catch (error: any) {
      // Handle validation errors separately for better user experience
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
          title: "Sign up failed",
          description: error.message,
          duration: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Security: Validate inputs before submitting to prevent malformed data
      const validatedData = authSchema.parse({
        email: email.trim(),
        password,
      });

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) throw error;

      // Success - navigate without notification
    } catch (error: any) {
      // Handle validation errors separately for better user experience
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
          title: "Sign in failed",
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

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-accentTeal/10 to-accentTealAlt/10 backdrop-blur-xl border border-white/10 mb-6">
              <Heart className="w-10 h-10 text-accentTeal" />
            </div>
            <h2 className="text-3xl font-semibold mb-3 text-foreground">Welcome to Eywa AI</h2>
            <p className="text-muted-foreground/70 text-base">
              Unify your health data. Personalize your journey.
            </p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 backdrop-blur-xl border border-white/10 p-1">
              <TabsTrigger value="signin" className="data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-xl">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-xl">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="signin-email" className="text-foreground/80 text-sm">
                    <Mail className="w-4 h-4 inline mr-2 text-accentTeal" />
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-white/5 backdrop-blur-xl border-white/10 focus:border-accentTeal/50 h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="signin-password" className="text-foreground/80 text-sm">
                    <Lock className="w-4 h-4 inline mr-2 text-accentTeal" />
                    Password
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="signup-email" className="text-foreground/80 text-sm">
                    <Mail className="w-4 h-4 inline mr-2 text-accentTeal" />
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-white/5 backdrop-blur-xl border-white/10 focus:border-accentTeal/50 h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="signup-password" className="text-foreground/80 text-sm">
                    <Lock className="w-4 h-4 inline mr-2 text-accentTeal" />
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={8}
                    className="bg-white/5 backdrop-blur-xl border-white/10 focus:border-accentTeal/50 h-12"
                  />
                  <p className="text-xs text-muted-foreground/60">
                    At least 8 characters with uppercase, lowercase, and number
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-accentTeal to-accentTealAlt text-white font-medium rounded-2xl hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>

                <p className="text-xs text-center text-muted-foreground/50">
                  By signing up, you agree to our privacy-first approach. Your health data stays yours.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 text-center text-xs text-muted-foreground/50">
        <p>🔒 HIPAA-compliant • End-to-end encrypted</p>
      </div>
    </div>
  );
}