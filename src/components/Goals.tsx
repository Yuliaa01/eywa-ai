import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Calendar, Plus } from "lucide-react";

const Goals = () => {
  const globalGoals = [
    {
      title: "Reduce Biological Age",
      progress: 65,
      target: "3 years",
      current: "1.95 years",
      color: "primary" as const,
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      title: "Improve HRV",
      progress: 78,
      target: "70 ms",
      current: "54.6 ms",
      color: "secondary" as const,
      icon: <Target className="w-5 h-5" />,
    },
  ];

  const temporaryGoals = [
    {
      title: "Weekly Sleep Score",
      progress: 85,
      deadline: "3 days left",
      color: "accent" as const,
    },
    {
      title: "Hydration Target",
      progress: 60,
      deadline: "Today",
      color: "primary" as const,
    },
    {
      title: "Step Count Goal",
      progress: 92,
      deadline: "5 hours left",
      color: "secondary" as const,
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 space-y-4 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold">
            Track Your
            <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
              Health Goals
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Set global longevity targets and short-term health objectives
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Global Goals */}
          <Card className="p-8 bg-gradient-card border shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Global Goals</h3>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </div>
            <div className="space-y-6">
              {globalGoals.map((goal) => (
                <GlobalGoalCard key={goal.title} goal={goal} />
              ))}
            </div>
          </Card>

          {/* Temporary Goals */}
          <Card className="p-8 bg-gradient-card border shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">This Week</h3>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </div>
            <div className="space-y-4">
              {temporaryGoals.map((goal) => (
                <TemporaryGoalCard key={goal.title} goal={goal} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

interface GlobalGoalCardProps {
  goal: {
    title: string;
    progress: number;
    target: string;
    current: string;
    color: "primary" | "secondary" | "accent";
    icon: React.ReactNode;
  };
}

const GlobalGoalCard = ({ goal }: GlobalGoalCardProps) => {
  const colorClasses = {
    primary: "text-primary bg-primary/10 border-primary/20",
    secondary: "text-secondary bg-secondary/10 border-secondary/20",
    accent: "text-accent bg-accent/10 border-accent/20",
  };

  return (
    <div className="space-y-4 p-5 rounded-xl bg-background/50 border border-border/50 hover:border-border transition-smooth">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[goal.color]}`}>
            {goal.icon}
          </div>
          <div>
            <h4 className="font-semibold">{goal.title}</h4>
            <p className="text-sm text-muted-foreground">
              {goal.current} / {goal.target}
            </p>
          </div>
        </div>
        <span className="text-sm font-medium">{goal.progress}%</span>
      </div>
      <Progress value={goal.progress} className="h-2" />
    </div>
  );
};

interface TemporaryGoalCardProps {
  goal: {
    title: string;
    progress: number;
    deadline: string;
    color: "primary" | "secondary" | "accent";
  };
}

const TemporaryGoalCard = ({ goal }: TemporaryGoalCardProps) => {
  const progressColors = {
    primary: "[&>div]:bg-primary",
    secondary: "[&>div]:bg-secondary",
    accent: "[&>div]:bg-accent",
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-border transition-smooth">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-medium">{goal.title}</h4>
        </div>
        <span className="text-xs text-muted-foreground">{goal.deadline}</span>
      </div>
      <div className="space-y-1">
        <Progress value={goal.progress} className={`h-1.5 ${progressColors[goal.color]}`} />
        <p className="text-xs text-right text-muted-foreground">{goal.progress}%</p>
      </div>
    </div>
  );
};

export default Goals;
