import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { ThemeProvider } from "@/contexts/ThemeContext";
import CoachOrb from "@/components/CoachOrb";
import ChatDrawer from "@/components/ChatDrawer";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DoctorHub from "./pages/DoctorHub";
import LongevityFeedback from "./pages/LongevityFeedback";
import Onboarding from "./pages/Onboarding";
import ProfileSettings from "./pages/settings/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route 
                path="/auth" 
                element={session ? <Navigate to="/onboarding" /> : <Auth />} 
              />
              <Route 
                path="/onboarding" 
                element={session ? <Onboarding /> : <Navigate to="/auth" />} 
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
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
            
            {/* Global AI Coach */}
            {session && (
              <>
                <CoachOrb onOpen={() => setChatOpen(true)} />
                <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
              </>
            )}
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
