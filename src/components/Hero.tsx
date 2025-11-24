import { Button } from "@/components/ui/button";
import { Activity, Heart, Brain, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-health.jpg";
const Hero = () => {
  const navigate = useNavigate();
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Eywa AI Health Technology" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/85 to-background/75" />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow delay-700" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow delay-1000" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 animate-fade-in">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-primary/10 border border-primary/20 backdrop-blur-sm">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">AI-Powered Health Intelligence</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl font-bold tracking-tight text-center md:text-7xl">
            EYWA AI
            <span className="block mt-2 text-center text-4xl">
              Your Personal 360° 
AI-driven health companion
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Predict, personalize, and improve your health with AI that analyzes wearables, biomarkers, 
            nutrition, and lifestyle data for optimal longevity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button variant="hero" size="lg" className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/auth")}>
            Get Started
          </Button>
          <Button variant="outline" size="lg" className="min-w-[200px] hover:bg-primary/20 hover:border-primary/40 hover:text-primary" onClick={() => {
            document.getElementById('health-metrics')?.scrollIntoView({
              behavior: 'smooth'
            });
          }}>
            Learn More
          </Button>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <FeatureCard icon={<Heart className="w-8 h-8" />} title="Health Tracking" description="Real-time vitals and biomarker monitoring" color="primary" />
            <FeatureCard icon={<Brain className="w-8 h-8" />} title="AI Insights" description="Personalized health recommendations" color="accent" />
            <FeatureCard icon={<TrendingUp className="w-8 h-8" />} title="Longevity Focus" description="Optimize your biological age" color="secondary" />
          </div>
        </div>
      </div>
    </section>;
};
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "primary" | "accent" | "secondary";
}
const FeatureCard = ({
  icon,
  title,
  description,
  color
}: FeatureCardProps) => {
  const colorClasses = {
    primary: "text-primary bg-primary/10 border-primary/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    secondary: "text-secondary bg-secondary/10 border-secondary/20"
  };
  return <div className="group relative p-6 rounded-2xl bg-gradient-card border border-border shadow-card hover:shadow-elevated transition-smooth backdrop-blur-sm">
      <div className={`inline-flex p-3 rounded-xl ${colorClasses[color]} mb-4 group-hover:scale-110 transition-bounce`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>;
};
export default Hero;