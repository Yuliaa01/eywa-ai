import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Link2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Connections() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-glow-pulse">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-accent-teal/20 to-accent-teal-alt/10 flex items-center justify-center">
            <Link2 className="w-8 h-8 text-accent-teal animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const connections = [
    {
      id: "fitbit",
      name: "Fitbit",
      description: "Sync activity, sleep, and heart rate data",
      icon: "🏃",
      connected: false,
      category: "Wearables",
    },
    {
      id: "apple_health",
      name: "Apple Health",
      description: "Import health metrics from your iPhone",
      icon: "🍎",
      connected: false,
      category: "Wearables",
    },
    {
      id: "google_fit",
      name: "Google Fit",
      description: "Sync activity and wellness data",
      icon: "📊",
      connected: false,
      category: "Wearables",
    },
    {
      id: "whoop",
      name: "WHOOP",
      description: "Advanced recovery and strain metrics",
      icon: "💪",
      connected: false,
      category: "Wearables",
    },
    {
      id: "myfitnesspal",
      name: "MyFitnessPal",
      description: "Track nutrition and meals automatically",
      icon: "🍽️",
      connected: false,
      category: "Nutrition",
    },
    {
      id: "cronometer",
      name: "Cronometer",
      description: "Detailed micronutrient tracking",
      icon: "🥗",
      connected: false,
      category: "Nutrition",
    },
    {
      id: "labcorp",
      name: "LabCorp",
      description: "Automatically import lab results",
      icon: "🔬",
      connected: false,
      category: "Medical",
    },
    {
      id: "quest",
      name: "Quest Diagnostics",
      description: "Sync your test results directly",
      icon: "🧪",
      connected: false,
      category: "Medical",
    },
  ];

  const categories = [...new Set(connections.map((c) => c.category))];

  const handleConnect = (connectionId: string, connectionName: string) => {
    toast({
      title: "Coming Soon",
      description: `${connectionName} integration will be available soon.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-card/95 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="w-10 h-10 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-rounded text-xl font-semibold text-foreground">
                Connections
              </h1>
              <p className="text-sm text-muted-foreground">
                Connect your health apps and devices
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Info Card */}
        <div className="rounded-3xl bg-gradient-to-br from-accent-teal/10 to-accent-teal-alt/5 backdrop-blur-xl border border-accent-teal/20 p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-teal to-accent-teal-alt flex items-center justify-center flex-shrink-0">
              <Link2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-rounded text-xl font-bold text-foreground mb-2">
                Sync Your Health Data
              </h2>
              <p className="text-muted-foreground">
                Connect wearables, nutrition trackers, and medical services to get comprehensive AI health insights.
                All data is encrypted and only used to personalize your experience.
              </p>
            </div>
          </div>
        </div>

        {/* Connections by Category */}
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h3 className="font-rounded text-lg font-semibold text-foreground mb-4">
              {category}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {connections
                .filter((c) => c.category === category)
                .map((connection) => (
                  <div
                    key={connection.id}
                    className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border p-6 hover:border-accent-teal/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-accent-teal/10 flex items-center justify-center text-2xl">
                          {connection.icon}
                        </div>
                        <div>
                          <h4 className="font-rounded font-semibold text-foreground">
                            {connection.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {connection.description}
                          </p>
                        </div>
                      </div>
                      {connection.connected && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <Button
                      onClick={() => handleConnect(connection.id, connection.name)}
                      className={
                        connection.connected
                          ? "w-full bg-card border border-accent-teal/20 text-accent-teal hover:bg-accent-teal/5"
                          : "w-full bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white hover:shadow-[0_4px_20px_rgba(18,175,203,0.3)]"
                      }
                      variant={connection.connected ? "outline" : "default"}
                    >
                      {connection.connected ? "Connected" : "Connect"}
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Privacy Notice */}
        <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-accent-teal flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-rounded font-semibold text-foreground mb-2">
                Your Privacy & Data Security
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use industry-standard encryption to protect your health data. You can disconnect any service
                at any time, and we'll permanently delete the associated data. We never sell your information
                to third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
