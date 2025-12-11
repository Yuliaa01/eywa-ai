import { useState } from "react";
import { Check, Sparkles, Users, Gift, Infinity } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  popular?: boolean;
}

interface SubscriptionStepProps {
  onNext: (planId: string) => void;
}

export default function SubscriptionStep({ onNext }: SubscriptionStepProps) {
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const plans: Plan[] = [
    {
      id: 'trial',
      name: 'Free Trial',
      price: 'Free',
      period: '1 month',
      features: ['Full AI analysis', 'All integrations', 'DoctorHub access', 'No credit card'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19.99',
      period: '/month',
      icon: Sparkles,
      popular: true,
      features: ['1-month free trial', 'Unlimited AI insights', 'Priority support', 'Advanced analytics', 'Export reports'],
    },
    {
      id: 'pro12',
      name: '12-Month Pro',
      price: '$189.99',
      period: '12 months',
      icon: Sparkles,
      badge: 'Best Value',
      features: ['1-month free trial', 'All Pro features', '12 months access', 'Priority support', 'Save 21%'],
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: '$289.99',
      period: 'one-time',
      icon: Infinity,
      features: ['Pay once, use forever', 'All future features', 'Priority support', 'Best value'],
    },
    {
      id: 'family',
      name: 'Family',
      price: '$74.99',
      period: '/month',
      icon: Users,
      features: ['Up to 5 members', 'Shared insights', 'Family dashboard', 'All Pro features'],
    },
    {
      id: 'family6',
      name: '6-Month Family',
      price: '$359.99',
      period: '6 months',
      icon: Users,
      features: ['Up to 5 members', 'All Family features', '6 months access', 'Save 20%'],
    },
    {
      id: 'family12',
      name: '12-Month Family',
      price: '$749.99',
      period: '12 months',
      icon: Users,
      badge: 'Family Best Value',
      features: ['Up to 5 members', 'All Family features', '12 months access', 'Save 17%'],
    },
  ];

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-4">
        <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
          Choose Your Plan
        </h2>
        <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
          Start with a free trial or select the plan that works best for you
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {plans.map((plan, idx) => {
          const Icon = plan.icon;
          const isSelected = selectedPlan === plan.id;
          
          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-3xl backdrop-blur-xl p-6 shadow-[0_4px_20px_rgba(18,175,203,0.06)] transition-all duration-standard text-left ${
                isSelected
                  ? 'bg-gradient-to-br from-[#12AFCB]/10 to-[#12AFCB]/5 border-2 border-[#12AFCB] shadow-[0_8px_32px_rgba(18,175,203,0.15)]'
                  : 'bg-white/60 border border-[#12AFCB]/10 hover:bg-white/80 hover:border-[#12AFCB]/20'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {plan.badge && (
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/80 text-white text-[0.75rem] font-medium shadow-lg">
                  {plan.badge}
                </div>
              )}
              {plan.popular && (
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/80 text-white text-[0.75rem] font-medium shadow-lg">
                  Popular
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                {Icon && (
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#12AFCB] to-[#12AFCB]/80'
                      : 'bg-white/60'
                  }`}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-[#5A6B7F]'}`} />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-[1.125rem] font-semibold text-[#0E1012] mb-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[1.5rem] font-bold text-[#12AFCB]">
                      {plan.price}
                    </span>
                    <span className="text-[0.875rem] text-[#5A6B7F]">
                      {plan.period}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#12AFCB] flex-shrink-0 mt-0.5" />
                    <span className="text-[0.875rem] text-[#5A6B7F]">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <button
          onClick={() => onNext(selectedPlan)}
          className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
        >
          Continue with {plans.find(p => p.id === selectedPlan)?.name}
        </button>

        <div className="text-center space-y-2">
          <button className="text-[0.875rem] text-[#5A6B7F] hover:text-[#12AFCB] transition-colors">
            Have a coupon code?
          </button>
        </div>
      </div>
    </div>
  );
}
