import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Hero from "@/components/Hero";
import HealthMetrics from "@/components/HealthMetrics";
import Goals from "@/components/Goals";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in, redirect to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <Hero />
      <HealthMetrics />
      <Goals />
    </div>
  );
};

export default Index;
