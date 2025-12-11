import { useState } from "react";
import { Check, Sparkles, Users, Infinity, ChevronDown } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  perMonth?: string;
  features: string[];
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  popular?: boolean;
  tier: 'free' | 'pro' | 'family';
}

interface SubscriptionStepProps {
  onNext: (planId: string) => void;
}

interface ComparisonFeature {
  name: string;
  free: boolean;
  pro: boolean;
  family: boolean;
}

export default function SubscriptionStep({ onNext }: SubscriptionStepProps) {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [showOtherFamilyPlans, setShowOtherFamilyPlans] = useState(false);

  // Main plans grid (includes Pro plans + main Family monthly plan)
  const mainPlans: Plan[] = [
    {
      id: 'trial',
      name: 'Free Trial',
      price: 'Free',
      period: '1 month',
      tier: 'free',
      features: ['Full AI analysis', 'All integrations', 'DoctorHub access', 'No credit card'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19.99',
      period: '/month',
      icon: Sparkles,
      popular: true,
      tier: 'pro',
      features: ['1-month free trial', 'Unlimited AI insights', 'Priority support', 'Advanced analytics', 'Export reports'],
    },
    {
      id: 'pro6',
      name: '6-Month Pro',
      price: '$99.99',
      period: '6 months',
      perMonth: '$16.67',
      icon: Sparkles,
      tier: 'pro',
      features: ['1-month free trial', 'All Pro features', '6 months access', 'Priority support', 'Save 17%'],
    },
    {
      id: 'pro12',
      name: '12-Month Pro',
      price: '$189.99',
      period: '12 months',
      perMonth: '$15.83',
      icon: Sparkles,
      badge: 'Best Value',
      tier: 'pro',
      features: ['1-month free trial', 'All Pro features', '12 months access', 'Priority support', 'Save 21%'],
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: '$289.99',
      period: 'one-time',
      icon: Infinity,
      tier: 'pro',
      features: ['Pay once, use forever', 'All future features', 'Priority support', 'Best value'],
    },
    {
      id: 'family',
      name: 'Family',
      price: '$74.99',
      period: '/month',
      icon: Users,
      tier: 'family',
      features: ['Up to 5 members', 'Shared insights', 'Family dashboard', 'All Pro features'],
    },
  ];

  // Extended family plans (shown in collapsible section)
  const otherFamilyPlans: Plan[] = [
    {
      id: 'family6',
      name: '6-Month Family',
      price: '$359.99',
      period: '6 months',
      perMonth: '$60.00',
      icon: Users,
      tier: 'family',
      features: ['Up to 5 members', 'All Family features', '6 months access', 'Save 20%'],
    },
    {
      id: 'family12',
      name: '12-Month Family',
      price: '$660',
      period: '12 months',
      perMonth: '$55.00',
      icon: Users,
      badge: 'Family Best Value',
      tier: 'family',
      features: ['Up to 5 members', 'All Family features', '12 months access', 'Save 27%'],
    },
  ];

  const allPlans = [...mainPlans, ...otherFamilyPlans];

  

  const comparisonFeatures: ComparisonFeature[] = [
    { name: 'Health metrics tracking', free: true, pro: true, family: true },
    { name: 'Basic AI insights', free: true, pro: true, family: true },
    { name: 'Device integrations', free: true, pro: true, family: true },
    { name: 'Unlimited AI analysis', free: false, pro: true, family: true },
    { name: 'DoctorHub access', free: false, pro: true, family: true },
    { name: 'Advanced analytics', free: false, pro: true, family: true },
    { name: 'Priority support', free: false, pro: true, family: true },
    { name: 'Export reports', free: false, pro: true, family: true },
    { name: 'Up to 5 family members', free: false, pro: false, family: true },
    { name: 'Shared family insights', free: false, pro: false, family: true },
    { name: 'Family dashboard', free: false, pro: false, family: true },
  ];

  const getSelectedTier = (): 'free' | 'pro' | 'family' => {
    const plan = allPlans.find(p => p.id === selectedPlan);
    return plan?.tier || 'pro';
  };

  const handleTierClick = (tier: 'free' | 'pro' | 'family') => {
    if (tier === 'free') setSelectedPlan('trial');
    else if (tier === 'pro') setSelectedPlan('pro');
    else {
      setSelectedPlan('family');
    }
  };

  const selectedTier = getSelectedTier();

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

      {/* Main Plans Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {mainPlans.map((plan, idx) => {
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
                  {plan.perMonth && (
                    <div className="text-[0.75rem] text-[#5A6B7F]">
                      ({plan.perMonth}/month)
                    </div>
                  )}
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

      {/* Other Family Plan Options Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#12AFCB]/30 to-transparent" />
          <button
            onClick={() => setShowOtherFamilyPlans(!showOtherFamilyPlans)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#12AFCB]/10 border border-[#12AFCB]/20 hover:bg-[#12AFCB]/15 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-[#12AFCB]" />
            <span className="text-[0.875rem] font-medium text-[#12AFCB]">Other Family Plan Options</span>
            <ChevronDown className={`w-4 h-4 text-[#12AFCB] transition-transform duration-300 ${showOtherFamilyPlans ? 'rotate-180' : ''}`} />
          </button>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#12AFCB]/30 to-transparent" />
        </div>

        <div className={`grid md:grid-cols-2 gap-4 pt-4 transition-all duration-300 ease-out ${
          showOtherFamilyPlans ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          {otherFamilyPlans.map((plan, idx) => {
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
                style={{ animationDelay: `${(idx + mainPlans.length) * 50}ms` }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/80 text-white text-[0.75rem] font-medium shadow-lg">
                    {plan.badge}
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
                    {plan.perMonth && (
                      <div className="text-[0.75rem] text-[#5A6B7F]">
                        ({plan.perMonth}/month)
                      </div>
                    )}
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
      </div>

      {/* Feature Comparison Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#12AFCB]/30 to-transparent" />
          <span className="text-[0.875rem] font-medium text-[#5A6B7F]">Compare Features</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#12AFCB]/30 to-transparent" />
        </div>

        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 border-b border-[#12AFCB]/10">
            <div className="p-4 text-[0.875rem] font-medium text-[#5A6B7F]">
              What you get
            </div>
            {(['free', 'pro', 'family'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => handleTierClick(tier)}
                className={`p-4 text-center transition-all ${
                  selectedTier === tier
                    ? 'bg-[#12AFCB]/10 border-b-2 border-[#12AFCB]'
                    : 'hover:bg-[#12AFCB]/5'
                }`}
              >
                <span className={`text-[0.875rem] font-semibold capitalize ${
                  selectedTier === tier ? 'text-[#12AFCB]' : 'text-[#0E1012]'
                }`}>
                  {tier === 'free' ? 'Free' : tier === 'pro' ? 'Pro' : 'Family'}
                </span>
              </button>
            ))}
          </div>

          {/* Feature Rows */}
          {comparisonFeatures.map((feature, idx) => (
            <div
              key={feature.name}
              className={`grid grid-cols-4 ${
                idx !== comparisonFeatures.length - 1 ? 'border-b border-[#12AFCB]/5' : ''
              }`}
            >
              <div className="p-4 text-[0.875rem] text-[#0E1012] font-medium">
                {feature.name}
              </div>
              {(['free', 'pro', 'family'] as const).map((tier) => (
                <div
                  key={tier}
                  className={`p-4 flex items-center justify-center ${
                    selectedTier === tier ? 'bg-[#12AFCB]/5' : ''
                  }`}
                >
                  {feature[tier] ? (
                    <Check className="w-5 h-5 text-[#12AFCB] stroke-[3]" />
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => onNext(selectedPlan)}
          className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
        >
          Continue with {allPlans.find(p => p.id === selectedPlan)?.name}
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
