import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import CoachOrb from "@/components/CoachOrb";
import ChatDrawer from "@/components/ChatDrawer";
import { triggerLoginReward } from "@/hooks/useRewardTrigger";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import DoctorHub from "./pages/DoctorHub";
import LongevityFeedback from "./pages/LongevityFeedback";
import Onboarding from "./pages/Onboarding";
import ProfileSettings from "./pages/settings/Profile";
import Subscription from "./pages/settings/Subscription";
import Connections from "./pages/Connections";
import LocalEvents from "./pages/LocalEvents";
import NearbyRestaurants from "./pages/NearbyRestaurants";
import Discover from "./pages/Discover";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = ({ session }: { session: Session | null }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();
  const isOnboarding = location.pathname === '/onboarding';

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route 
          path="/auth" 
          element={session ? <Navigate to="/onboarding" /> : <Auth />} 
        />
        <Route 
          path="/auth/forgot-password" 
          element={<ForgotPassword />} 
        />
        <Route 
          path="/auth/reset-password" 
          element={<ResetPassword />} 
        />
        <Route 
          path="/onboarding" 
          element={<Onboarding />} 
        />
        <Route 
          path="/dashboard" 
          element={session ? <Dashboard /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/doctor-hub" 
          element={session ? <DoctorHub /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/longevity-feedback" 
          element={session ? <LongevityFeedback /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/settings/profile" 
          element={session ? <ProfileSettings /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/settings/subscription" 
          element={session ? <Subscription /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/connections" 
          element={session ? <Connections /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/local-events" 
          element={session ? <LocalEvents /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/nearby-restaurants" 
          element={session ? <NearbyRestaurants /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/discover" 
          element={session ? <Discover /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/privacy-policy" 
          element={<PrivacyPolicy />} 
        />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      
      {/* Global AI Coach - hidden on onboarding */}
      {session && !isOnboarding && (
        <>
          <CoachOrb onOpen={() => setChatOpen(true)} />
          <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
        </>
      )}
    </>
  );
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const loginRewardTriggered = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      // Trigger login streak reward on app load (once per session)
      if (session?.user && !loginRewardTriggered.current) {
        loginRewardTriggered.current = true;
        triggerLoginReward(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        setSession(session);
        
        // Trigger login reward when user signs in
        if (_event === 'SIGNED_IN' && session?.user && !loginRewardTriggered.current) {
          loginRewardTriggered.current = true;
          triggerLoginReward(session.user.id);
        }
        
        // Reset flag on sign out
        if (_event === 'SIGNED_OUT') {
          loginRewardTriggered.current = false;
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="animate-glow-pulse">
          <div className="w-16 h-16 rounded-full bg-accent-teal" />
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent session={session} />
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
