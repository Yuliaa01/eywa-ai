import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, CreditCard, CheckCircle2, Sparkles, Users, Gift, Infinity, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function Subscription() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setShowUpgradeModal(true);
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

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

  const individualPlans = [
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
        "No credit card",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$19.99",
      period: "/month",
      popular: true,
      icon: Sparkles,
      features: [
        "Unlimited AI insights",
        "Priority support",
        "Advanced analytics",
        "Export reports",
      ],
    },
    {
      id: "pro6",
      name: "6-Month Pro",
      price: "$90",
      period: "",
      icon: Sparkles,
      features: [
        "$15/mo • 17% savings",
        "6 months access",
        "All Pro features",
        "One-time payment",
      ],
    },
    {
      id: "pro12",
      name: "12-Month Pro",
      price: "$180",
      period: "",
      icon: Sparkles,
      badge: "Best Value",
      features: [
        "$15/mo • 25% savings",
        "12 months access",
        "All Pro features",
        "One-time payment",
      ],
    },
    {
      id: "lifetime",
      name: "Lifetime",
      price: "$289",
      period: "one-time",
      icon: Infinity,
      features: [
        "Pay once, use forever",
        "All future features",
        "Priority support",
        "Best value",
      ],
    },
  ];

  const familyPlans = [
    {
      id: "family",
      name: "Family",
      price: "$74.99",
      period: "/month",
      icon: Users,
      features: [
        "Up to 5 members",
        "Shared insights",
        "Family dashboard",
        "All Pro features",
      ],
    },
    {
      id: "family6",
      name: "6-Month Family",
      price: "$359.99",
      period: "",
      icon: Users,
      features: [
        "$60/mo • Save 20%",
        "Up to 5 members",
        "All Family features",
        "6 months access",
      ],
    },
    {
      id: "family12",
      name: "12-Month Family",
      price: "$660",
      period: "",
      icon: Users,
      badge: "Best Value",
      features: [
        "$55/mo • Save 27%",
        "Up to 5 members",
        "All Family features",
        "12 months access",
      ],
    },
  ];

  const allPlans = [...individualPlans, ...familyPlans];

  const giftPlans = [
    {
      id: "gift6",
      name: "Gift 6 Months Pro",
      price: "$90",
      period: "one-time",
      icon: Gift,
      features: [
        "17% savings",
        "6 months access",
        "All Pro features",
        "Gift message",
      ],
    },
    {
      id: "gift12",
      name: "Gift 12 Months Pro",
      price: "$180",
      period: "one-time",
      icon: Gift,
      badge: "Best Value",
      features: [
        "$15/mo • 25% savings",
        "12 months access",
        "All Pro features",
        "Gift message",
      ],
    },
    {
      id: "giftLifetime",
      name: "Gift Lifetime",
      price: "$289",
      period: "one-time",
      icon: Infinity,
      features: [
        "Pay once, use forever",
        "All future features",
        "Priority support",
        "Gift message",
      ],
    },
    {
      id: "giftFamily12",
      name: "Gift 12-Month Family",
      price: "$749.99",
      period: "one-time",
      icon: Users,
      features: [
        "Up to 5 members",
        "All Family features",
        "12 months access",
        "Gift message",
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
            <Button 
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white hover:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all"
            >
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {individualPlans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-6 border transition-all ${
                    plan.current
                      ? "bg-gradient-to-br from-accent-teal/10 to-accent-teal-alt/5 border-accent-teal/30"
                      : plan.popular
                      ? "bg-card border-accent-teal/20 shadow-[0_8px_32px_rgba(18,175,203,0.15)]"
                      : "bg-card/60 border-border hover:border-accent-teal/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.1)]"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white text-xs font-rounded font-semibold shadow-lg">
                      Popular
                    </div>
                  )}
                  {plan.badge && !plan.popular && (
                    <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white text-xs font-rounded font-semibold shadow-lg">
                      {plan.badge}
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 mb-4">
                    {Icon && (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        plan.current || plan.popular
                          ? 'bg-gradient-to-br from-accent-teal to-accent-teal-alt'
                          : 'bg-accent-teal/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${plan.current || plan.popular ? 'text-white' : 'text-accent-teal'}`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-rounded text-lg font-bold text-foreground mb-1 truncate">
                        {plan.name}
                      </h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-rounded font-bold text-accent-teal">
                          {plan.price}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {plan.period}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => !plan.current && handlePlanSelect(plan.id)}
                    className={`w-full h-10 text-sm transition-all ${
                      plan.current
                        ? "bg-card border border-accent-teal/20 text-accent-teal hover:bg-accent-teal/5"
                        : plan.popular
                        ? "bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white hover:shadow-[0_4px_20px_rgba(18,175,203,0.3)]"
                        : "hover:bg-[#12AFCB] hover:text-white hover:border-[#12AFCB]"
                    }`}
                    variant={plan.current || plan.popular ? "default" : "outline"}
                    disabled={plan.current}
                  >
                    {plan.current ? "Current Plan" : "Select Plan"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Family Plans */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent-teal" />
            </div>
            <div>
              <h3 className="font-rounded text-xl font-semibold text-foreground">
                Family Plans
              </h3>
              <p className="text-sm text-muted-foreground">Share your wellness journey with your family</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {familyPlans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className="relative rounded-3xl p-6 border bg-card/60 border-border hover:border-accent-teal/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.1)] transition-all"
                >
                  {plan.badge && (
                    <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white text-xs font-rounded font-semibold shadow-lg">
                      {plan.badge}
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 mb-4">
                    {Icon && (
                      <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center flex-shrink-0 transition-all">
                        <Icon className="w-5 h-5 text-accent-teal" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-rounded text-lg font-bold text-foreground mb-1 truncate">
                        {plan.name}
                      </h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-rounded font-bold text-accent-teal">
                          {plan.price}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {plan.period}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => handlePlanSelect(plan.id)}
                    className="w-full h-10 text-sm transition-all hover:bg-[#12AFCB] hover:text-white hover:border-[#12AFCB]"
                    variant="outline"
                  >
                    Select Plan
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gift Options */}
        <div className="mb-8">
          <h3 className="font-rounded text-xl font-semibold text-foreground mb-6">
            Gift Options
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {giftPlans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className="relative rounded-3xl p-6 border bg-card/60 border-border hover:border-accent-teal/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.1)] transition-all"
                >
                  {plan.badge && (
                    <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white text-xs font-rounded font-semibold shadow-lg">
                      {plan.badge}
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 mb-4">
                    {Icon && (
                      <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center flex-shrink-0 transition-all">
                        <Icon className="w-5 h-5 text-accent-teal" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-rounded text-lg font-bold text-foreground mb-1 truncate">
                        {plan.name}
                      </h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-rounded font-bold text-accent-teal">
                          {plan.price}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {plan.period}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => handlePlanSelect(plan.id)}
                    className="w-full h-10 text-sm transition-all hover:bg-[#12AFCB] hover:text-white hover:border-[#12AFCB]"
                    variant="outline"
                  >
                    Buy as Gift
                  </Button>
                </div>
              );
            })}
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

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-rounded text-2xl font-bold text-foreground">
              {selectedPlan ? `Upgrade to ${allPlans.find(p => p.id === selectedPlan)?.name || giftPlans.find(p => p.id === selectedPlan)?.name}` : 'Upgrade Your Plan'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Complete your payment to upgrade your subscription
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {selectedPlan && (
              <div className="rounded-2xl bg-gradient-to-br from-accent-teal/10 to-accent-teal-alt/5 p-6 border border-accent-teal/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-rounded font-semibold text-foreground">
                    {allPlans.find(p => p.id === selectedPlan)?.name || giftPlans.find(p => p.id === selectedPlan)?.name}
                  </h4>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-accent-teal">
                      {allPlans.find(p => p.id === selectedPlan)?.price || giftPlans.find(p => p.id === selectedPlan)?.price}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {allPlans.find(p => p.id === selectedPlan)?.period || giftPlans.find(p => p.id === selectedPlan)?.period}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {(allPlans.find(p => p.id === selectedPlan)?.features || giftPlans.find(p => p.id === selectedPlan)?.features || []).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Payment Method</span>
                </div>
                <p className="text-sm text-muted-foreground pl-8">
                  Stripe integration coming soon
                </p>
              </div>
              
              <Button 
                onClick={() => {
                  toast.success("Payment processing will be available soon!");
                  setShowUpgradeModal(false);
                }}
                className="w-full bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white hover:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
