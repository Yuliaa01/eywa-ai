import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Heart, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

// Security: Input validation schema to prevent malformed data and enforce password strength
const authSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be less than 128 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number")
});
export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Check if user is already logged in
    const checkUserAndRedirect = async (userId: string) => {
      try {
        setCheckingAuth(true);
        const {
          data: profile
        } = await supabase.from('user_profiles').select('onboarding_completed').eq('user_id', userId).maybeSingle();

        // Explicitly check if onboarding_completed is true
        if (profile && profile.onboarding_completed === true) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      } finally {
        setCheckingAuth(false);
      }
    };
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session?.user) {
        checkUserAndRedirect(session.user.id);
      } else {
        setCheckingAuth(false);
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          checkUserAndRedirect(session.user.id);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setCheckingAuth(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 Sign up button clicked');
    setLoading(true);
    try {
      console.log('🔵 Validating credentials...', {
        email: email.trim(),
        passwordLength: password.length
      });

      // Security: Validate inputs before submitting to prevent malformed data
      const validatedData = authSchema.parse({
        email: email.trim(),
        password
      });
      console.log('✅ Validation passed');

      // Store credentials temporarily and navigate to onboarding
      // Account will be created at the end of onboarding flow
      sessionStorage.setItem('signupCredentials', JSON.stringify({
        email: validatedData.email,
        password: validatedData.password
      }));
      console.log('✅ Credentials stored in sessionStorage');
      console.log('🔵 Navigating to onboarding...');
      navigate('/onboarding', {
        state: {
          fromAuth: true,
          credentials: {
            email: validatedData.email,
            password: validatedData.password
          }
        }
      });
      console.log('✅ Navigate called');
    } catch (error: any) {
      console.error('❌ Sign up error:', error);

      // Handle validation errors separately for better user experience
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        console.error('❌ Validation error:', firstError);
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: firstError.message,
          duration: 3000
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: error.message,
          duration: 3000
        });
      }
    } finally {
      setLoading(false);
      console.log('🔵 Sign up handler complete');
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Basic validation for sign-in (no password strength requirements)
      if (!email || !password) {
        throw new Error("Please enter both email and password");
      }
      if (!email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) throw error;

      // Success - redirect will be handled by onAuthStateChange
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const {
        error
      } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin
      });
      if (error) throw error;
      // Success - redirect will be handled by OAuth flow and onAuthStateChange
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google sign-in failed",
        description: error.message,
        duration: 3000
      });
      setLoading(false);
    }
  };
  if (checkingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/50 via-background/80 to-primary/[0.02] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-accentTeal/20 to-accentTealAlt/20 backdrop-blur-xl border border-white/10 flex items-center justify-center animate-pulse">
            <Activity className="w-8 h-8 text-accentTeal" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen flex flex-col bg-gradient-to-br from-background/50 via-background/80 to-primary/[0.02] backdrop-blur-xl">
      {/* Header */}
      <div className="p-8 pb-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accentTeal/20 to-accentTealAlt/20 backdrop-blur-xl border border-white/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-accentTeal" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">EYWA AI</h1>
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
                  <Input id="signin-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} className="bg-white/5 backdrop-blur-xl border-white/10 focus:border-accentTeal/50 h-12" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="signin-password" className="text-foreground/80 text-sm">
                    <Lock className="w-4 h-4 inline mr-2 text-accentTeal" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input id="signin-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} className="bg-white/5 backdrop-blur-xl border-white/10 focus:border-accentTeal/50 h-12 pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-accentTeal transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <Link to="/auth/forgot-password" className="text-xs text-accentTeal/80 hover:text-accentTeal hover:underline transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-2xl transition-all" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground/50">Or</span>
                  </div>
                </div>

                <Button type="button" variant="outline" className="w-full h-12 bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 hover:border-accentTeal/40 hover:shadow-[0_0_20px_rgba(18,175,203,0.15)] hover:scale-[1.02] hover:text-foreground font-medium rounded-2xl transition-all duration-200" onClick={handleGoogleSignIn} disabled={loading}>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
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
                    <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} className="bg-white/5 backdrop-blur-xl border-white/10 focus:border-accentTeal/50 h-12" />
                  </div>

                <div className="space-y-3">
                  <Label htmlFor="signup-password" className="text-foreground/80 text-sm">
                    <Lock className="w-4 h-4 inline mr-2 text-accentTeal" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} minLength={8} className="bg-white/5 backdrop-blur-xl border-white/10 focus:border-accentTeal/50 h-12 pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-accentTeal transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground/60">
                    At least 8 characters with uppercase, lowercase, and number
                  </p>
                </div>

                <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-2xl transition-all" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground/50">Or continue with</span>
                  </div>
                </div>

                <Button type="button" variant="outline" className="w-full h-12 bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 hover:border-accentTeal/40 hover:shadow-[0_0_20px_rgba(18,175,203,0.15)] hover:scale-[1.02] hover:text-foreground font-medium rounded-2xl transition-all duration-200" onClick={handleGoogleSignIn} disabled={loading}>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
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
    </div>;
}