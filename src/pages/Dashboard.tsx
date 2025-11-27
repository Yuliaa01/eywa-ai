import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Activity,
  Heart,
  Utensils,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  User,
  CreditCard,
  Link2,
} from "lucide-react";
import RewardsDropdown from "@/components/rewards/RewardsDropdown";
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
import ProfessionalPrioritiesSection from "@/components/dashboard/ProfessionalPrioritiesSection";
import NutritionSection from "@/components/dashboard/NutritionSection";
import ActivitiesSection from "@/components/dashboard/ActivitiesSection";
import HealthCareSection from "@/components/dashboard/HealthCareSection";

export default function Dashboard() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'professional'>('standard');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("priorities");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadUserData = async (userId: string) => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, view_mode')
        .eq('user_id', userId)
        .maybeSingle();
      
      setUserProfile(profile);
      if (profile?.view_mode === 'professional' || profile?.view_mode === 'standard') {
        setViewMode(profile.view_mode);
      } else {
        setViewMode('standard');
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadUserData(session.user.id);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
          loadUserData(session.user.id);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        toast({
          title: "Authentication Error",
          description: "Please try signing in again.",
          variant: "destructive",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-accent-teal/20 to-accent-teal-alt/10 backdrop-blur-xl border border-accent-teal/20 flex items-center justify-center animate-glow-pulse">
            <Activity className="w-8 h-8 text-accent-teal animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-rounded">Loading your health hub...</p>
        </div>
      </div>
    );
  }

  const userName = userProfile?.first_name || user?.email?.split("@")[0] || "there";
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  })();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-card/95 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* User Greeting */}
            <div>
              <h1 className="font-rounded text-xl font-semibold text-foreground">
                {greeting}, {userName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Rewards Star Icon */}
              {user && <RewardsDropdown userId={user.id} />}
              
              {/* Notification Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-xl hover:bg-accent-teal/10 hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none"
                  >
                    <Bell className="w-5 h-5 text-muted-foreground hover:text-accent-teal transition-colors" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-80 bg-card/95 backdrop-blur-xl border-border shadow-lg z-50"
                >
                  <div className="p-4">
                    <h3 className="font-rounded font-semibold text-sm text-foreground mb-2">Notifications</h3>
                    <p className="text-sm text-muted-foreground">No new notifications</p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Avatar Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-10 h-10 rounded-full overflow-hidden hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-accent-teal/20 to-accent-teal-alt/10 backdrop-blur-xl border border-accent-teal/20 text-accent-teal">
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-card/95 backdrop-blur-xl border-border shadow-lg z-50"
                >
                  <DropdownMenuItem 
                    onClick={() => navigate("/settings/profile")}
                    className="cursor-pointer"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/settings/subscription")}
                    className="cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Subscription & Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/connections")}
                    className="cursor-pointer"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Connections
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive"
                  >
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
      <div 
        className={`flex-1 w-full ${activeTab !== 'priorities' ? 'overflow-y-auto custom-scrollbar' : ''}`}
        style={activeTab !== 'priorities' ? { height: 'calc(100vh - 180px)' } : undefined}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          {/* Tab Navigation */}
          <TabsList className="fixed top-[120px] z-10 left-[calc(50%-1px)] -translate-x-1/2 w-[calc(100%-3rem)] max-w-[calc(80rem-3rem)] grid grid-cols-4 bg-card/60 backdrop-blur-xl border border-border p-1.5 rounded-3xl h-auto">
            <TabsTrigger
              value="priorities"
              className="rounded-2xl font-rounded font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent-teal data-[state=active]:to-accent-teal-alt data-[state=active]:text-white data-[state=active]:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all duration-300 py-3"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Priorities
            </TabsTrigger>
            <TabsTrigger
              value="nutrition"
              className="rounded-2xl font-rounded font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent-teal data-[state=active]:to-accent-teal-alt data-[state=active]:text-white data-[state=active]:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all duration-300 py-3"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Nutrition
            </TabsTrigger>
            <TabsTrigger
              value="activities"
              className="rounded-2xl font-rounded font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent-teal data-[state=active]:to-accent-teal-alt data-[state=active]:text-white data-[state=active]:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all duration-300 py-3"
            >
              <Activity className="w-4 h-4 mr-2" />
              Activities
            </TabsTrigger>
            <TabsTrigger
              value="healthcare"
              className="rounded-2xl font-rounded font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent-teal data-[state=active]:to-accent-teal-alt data-[state=active]:text-white data-[state=active]:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all duration-300 py-3"
            >
              <Heart className="w-4 h-4 mr-2" />
              Health Care
            </TabsTrigger>
          </TabsList>

          {/* Spacer for fixed tab bar */}
          <div className="h-[88px]" />

          {/* Tab Content */}
          <TabsContent value="priorities" className="animate-scale-in">
            {viewMode === 'professional' ? (
              <ProfessionalPrioritiesSection />
            ) : (
              <PrioritiesSection />
            )}
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
      </div>
    </div>
  );
}
