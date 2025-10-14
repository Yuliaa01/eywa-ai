import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Heart,
  Utensils,
  Menu,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PrioritiesSection from "@/components/dashboard/PrioritiesSection";
import NutritionSection from "@/components/dashboard/NutritionSection";
import ActivitiesSection from "@/components/dashboard/ActivitiesSection";
import HealthCareSection from "@/components/dashboard/HealthCareSection";
import ProfileDrawer from "@/components/ProfileDrawer";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("priorities");
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "See you soon!",
      duration: 3000,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FCFF] via-[#EFF8FB] to-[#E8FAFF]/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#12AFCB]/20 to-[#12AFCB]/10 backdrop-blur-xl border border-[#12AFCB]/20 flex items-center justify-center animate-glow-pulse">
            <Activity className="w-8 h-8 text-[#12AFCB] animate-spin" />
          </div>
          <p className="text-sm text-[#5A6B7F] font-rounded">Loading your health hub...</p>
        </div>
      </div>
    );
  }

  const userName = user?.email?.split("@")[0] || "there";
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FCFF] via-[#EFF8FB] to-[#E8FAFF]/30 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/60 border-b border-[#12AFCB]/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* User Greeting */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setProfileOpen(true)}
                className="w-12 h-12 rounded-2xl hover:ring-2 hover:ring-[#12AFCB] transition-all"
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-br from-[#12AFCB]/20 to-[#12AFCB]/10 backdrop-blur-xl border border-[#12AFCB]/20 text-[#12AFCB]">
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
              </button>
              <div>
                <h1 className="font-rounded text-xl font-semibold text-[#0E1012]">
                  {greeting}, {userName}
                </h1>
                <p className="text-sm text-[#5A6B7F]">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-xl hover:bg-[#12AFCB]/10"
              >
                <Bell className="w-5 h-5 text-[#5A6B7F]" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-xl hover:bg-[#12AFCB]/10"
                  >
                    <Menu className="w-5 h-5 text-[#5A6B7F]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Tab Navigation */}
          <TabsList className="w-full grid grid-cols-4 bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-1.5 rounded-3xl h-auto">
            <TabsTrigger
              value="priorities"
              className="rounded-2xl font-rounded font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#12AFCB] data-[state=active]:to-[#12AFCB]/90 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all duration-300 py-3"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Priorities
            </TabsTrigger>
            <TabsTrigger
              value="nutrition"
              className="rounded-2xl font-rounded font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#12AFCB] data-[state=active]:to-[#12AFCB]/90 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all duration-300 py-3"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Nutrition
            </TabsTrigger>
            <TabsTrigger
              value="activities"
              className="rounded-2xl font-rounded font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#12AFCB] data-[state=active]:to-[#12AFCB]/90 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all duration-300 py-3"
            >
              <Activity className="w-4 h-4 mr-2" />
              Activities
            </TabsTrigger>
            <TabsTrigger
              value="healthcare"
              className="rounded-2xl font-rounded font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#12AFCB] data-[state=active]:to-[#12AFCB]/90 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all duration-300 py-3"
            >
              <Heart className="w-4 h-4 mr-2" />
              Health Care
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="priorities" className="animate-scale-in">
            <PrioritiesSection />
          </TabsContent>

          <TabsContent value="nutrition" className="animate-scale-in">
            <NutritionSection />
          </TabsContent>

          <TabsContent value="activities" className="animate-scale-in">
            <ActivitiesSection />
          </TabsContent>

          <TabsContent value="healthcare" className="animate-scale-in">
            <HealthCareSection />
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Drawer */}
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
