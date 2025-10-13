import { Card } from "@/components/ui/card";
import { Activity, Heart, Zap, Moon, Thermometer, TrendingUp } from "lucide-react";

const HealthMetrics = () => {
  const metrics = [
    { 
      icon: <Heart className="w-6 h-6" />, 
      label: "Heart Rate", 
      value: "72", 
      unit: "bpm",
      trend: "+2%",
      color: "primary" as const,
      description: "Optimal range"
    },
    { 
      icon: <Activity className="w-6 h-6" />, 
      label: "HRV", 
      value: "58", 
      unit: "ms",
      trend: "+8%",
      color: "secondary" as const,
      description: "Excellent recovery"
    },
    { 
      icon: <Zap className="w-6 h-6" />, 
      label: "Energy Score", 
      value: "85", 
      unit: "/100",
      trend: "+5%",
      color: "accent" as const,
      description: "High performance"
    },
    { 
      icon: <Moon className="w-6 h-6" />, 
      label: "Sleep Quality", 
      value: "92", 
      unit: "%",
      trend: "+3%",
      color: "primary" as const,
      description: "Deep rest achieved"
    },
    { 
      icon: <Thermometer className="w-6 h-6" />, 
      label: "Body Temp", 
      value: "36.8", 
      unit: "°C",
      trend: "0%",
      color: "secondary" as const,
      description: "Normal"
    },
    { 
      icon: <TrendingUp className="w-6 h-6" />, 
      label: "Longevity Score", 
      value: "78", 
      unit: "/100",
      trend: "+12%",
      color: "accent" as const,
      description: "Above average"
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 space-y-4 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold">
            Your Health
            <span className="block bg-gradient-secondary bg-clip-text text-transparent mt-2">
              at a Glance
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time insights from your wearables, biomarkers, and health data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={metric.label} metric={metric} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

interface MetricCardProps {
  metric: {
    icon: React.ReactNode;
    label: string;
    value: string;
    unit: string;
    trend: string;
    color: "primary" | "accent" | "secondary";
    description: string;
  };
  index: number;
}

const MetricCard = ({ metric, index }: MetricCardProps) => {
  const colorClasses = {
    primary: "text-primary bg-primary/10 border-primary/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    secondary: "text-secondary bg-secondary/10 border-secondary/20",
  };

  const gradientClasses = {
    primary: "from-primary/20 to-transparent",
    accent: "from-accent/20 to-transparent",
    secondary: "from-secondary/20 to-transparent",
  };

  return (
    <Card 
      className="relative overflow-hidden p-6 bg-gradient-card border shadow-card hover:shadow-elevated transition-smooth group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses[metric.color]} opacity-0 group-hover:opacity-100 transition-smooth`} />
      
      {/* Content */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${colorClasses[metric.color]} group-hover:scale-110 transition-bounce`}>
            {metric.icon}
          </div>
          <span className={`text-sm font-medium px-2 py-1 rounded-full ${colorClasses[metric.color]}`}>
            {metric.trend}
          </span>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{metric.value}</span>
            <span className="text-lg text-muted-foreground">{metric.unit}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
        </div>
      </div>
    </Card>
  );
};

export default HealthMetrics;
