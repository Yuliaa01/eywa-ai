import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, CheckCircle2, Sparkles } from "lucide-react";

export default function Subscription() {
  const navigate = useNavigate();
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
            <CreditCard className="w-8 h-8 text-accent-teal animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: "trial",
      name: "Free Trial",
      price: "Free",
      period: "1 month",
      current: true,
      features: [
        "Full AI analysis",
        "All integrations",
        "DoctorHub access",
        "No credit card required",
      ],
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: "$29",
      period: "month",
      popular: true,
      features: [
        "Everything in Free Trial",
        "Unlimited AI consultations",
        "Priority support",
        "Advanced analytics",
        "Custom protocols",
      ],
    },
    {
      id: "team",
      name: "Family Plan",
      price: "$49",
      period: "month",
      features: [
        "Everything in Pro",
        "Up to 5 family members",
        "Shared health insights",
        "Family health dashboard",
        "Care coordination",
      ],
    },
  ];

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
                Subscription & Billing
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your plan and billing information
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Current Plan Card */}
        <div className="rounded-3xl bg-gradient-to-br from-accent-teal/10 to-accent-teal-alt/5 backdrop-blur-xl border border-accent-teal/20 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-teal to-accent-teal-alt flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-rounded text-2xl font-bold text-foreground mb-1">
                  Free Trial
                </h2>
                <p className="text-muted-foreground">Active until Dec 16, 2025</p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-accent-teal/10 border border-accent-teal/20">
              <span className="text-sm font-rounded font-semibold text-accent-teal">
                Active
              </span>
            </div>
          </div>
          <p className="text-muted-foreground mb-6">
            You're currently on the Free Trial plan. Upgrade anytime to unlock additional features.
          </p>
          <div className="flex gap-3">
            <Button className="bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white hover:shadow-[0_4px_20px_rgba(18,175,203,0.3)]">
              Upgrade Plan
            </Button>
            <Button variant="outline">Manage Billing</Button>
          </div>
        </div>

        {/* Available Plans */}
        <div className="mb-8">
          <h3 className="font-rounded text-xl font-semibold text-foreground mb-6">
            Available Plans
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 border transition-all ${
                  plan.current
                    ? "bg-gradient-to-br from-accent-teal/10 to-accent-teal-alt/5 border-accent-teal/30"
                    : plan.popular
                    ? "bg-card border-accent-teal/20 shadow-[0_4px_20px_rgba(18,175,203,0.1)]"
                    : "bg-card/60 border-border hover:border-accent-teal/20"
                }`}
              >
                {plan.popular && (
                  <div className="mb-4">
                    <span className="px-3 py-1 rounded-lg bg-accent-teal/10 text-accent-teal text-xs font-rounded font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h4 className="font-rounded text-xl font-bold text-foreground mb-2">
                  {plan.name}
                </h4>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-rounded font-bold text-foreground">
                    {plan.price}
                  </span>
                  {plan.price !== "Free" && (
                    <span className="text-muted-foreground">/{plan.period}</span>
                  )}
                </div>
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className={`w-full ${
                    plan.current
                      ? "bg-card border border-accent-teal/20 text-accent-teal hover:bg-accent-teal/5"
                      : plan.popular
                      ? "bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white hover:shadow-[0_4px_20px_rgba(18,175,203,0.3)]"
                      : ""
                  }`}
                  variant={plan.current || plan.popular ? "default" : "outline"}
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : "Select Plan"}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-8">
          <h3 className="font-rounded text-xl font-semibold text-foreground mb-6">
            Billing History
          </h3>
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No billing history yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
