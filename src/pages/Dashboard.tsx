import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Activity,
  Apple,
  Heart,
  Utensils,
  TestTube,
  Brain,
  TrendingUp,
  Menu,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Zap,
  Moon,
  Flame,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const metrics = [
    { label: "Recovery", value: "85%", color: "text-green-500", icon: Heart },
    { label: "HRV", value: "64 ms", color: "text-blue-500", icon: Activity },
    { label: "Sleep", value: "7.2h", color: "text-purple-500", icon: Moon },
    { label: "Readiness", value: "Good", color: "text-emerald-500", icon: Zap },
  ];

  const quickActions = [
    {
      title: "Log Meal",
      icon: Utensils,
      description: "Track your nutrition",
      gradient: "from-orange-500 to-red-500",
    },
    {
      title: "Add Activity",
      icon: Activity,
      description: "Record your workout",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Log Test",
      icon: TestTube,
      description: "Add lab results",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "AI Coach",
      icon: Brain,
      description: "Get personalized insights",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  const insights = [
    {
      title: "Your Vitamin D is trending low",
      description: "Consider supplementing 2000 IU daily. Next test in 8 weeks.",
      priority: "medium",
      icon: TrendingUp,
    },
    {
      title: "Great recovery this week!",
      description: "Your HRV is 15% above baseline. Keep up the sleep routine.",
      priority: "low",
      icon: Heart,
    },
    {
      title: "Time to check your apoB",
      description: "It's been 6 months since your last lipid panel.",
      priority: "high",
      icon: TestTube,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Eywa AI</h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
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
      </header>

      <div className="max-w-7xl mx-auto p-4 pb-20 space-y-6">
        {/* Hero Metrics */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Today's Recovery</h2>
              <p className="text-muted-foreground">You're ready to train</p>
            </div>
            <div className="text-4xl font-bold text-primary">85%</div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6">
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <metric.icon className={`w-6 h-6 mx-auto mb-1 ${metric.color}`} />
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="font-semibold">{metric.value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div>
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                className="p-4 cursor-pointer hover:shadow-glow transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold mb-1">{action.title}</h4>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Next Best Actions / Insights */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Next Best Actions</h3>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {insights.map((insight, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      insight.priority === "high"
                        ? "bg-red-500/10 text-red-500"
                        : insight.priority === "medium"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-green-500/10 text-green-500"
                    }`}
                  >
                    <insight.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Daily Stats */}
        <div>
          <h3 className="font-semibold mb-3">Today's Progress</h3>
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-semibold">2,450</p>
                  <p className="text-xs text-muted-foreground">Calories burned</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Goal: 2,800</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-semibold">8,234</p>
                  <p className="text-xs text-muted-foreground">Steps</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Goal: 10,000</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Utensils className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-semibold">1,850 kcal</p>
                  <p className="text-xs text-muted-foreground">Nutrition logged</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Target: 2,200</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="grid grid-cols-5 gap-2">
            <Button variant="ghost" className="flex-col h-auto py-2 text-primary">
              <Activity className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </Button>
            <Button variant="ghost" className="flex-col h-auto py-2">
              <Utensils className="w-5 h-5 mb-1" />
              <span className="text-xs">Nutrition</span>
            </Button>
            <Button variant="ghost" className="flex-col h-auto py-2">
              <Apple className="w-5 h-5 mb-1" />
              <span className="text-xs">Activities</span>
            </Button>
            <Button variant="ghost" className="flex-col h-auto py-2">
              <TestTube className="w-5 h-5 mb-1" />
              <span className="text-xs">Health</span>
            </Button>
            <Button variant="ghost" className="flex-col h-auto py-2">
              <Brain className="w-5 h-5 mb-1" />
              <span className="text-xs">AI Coach</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}