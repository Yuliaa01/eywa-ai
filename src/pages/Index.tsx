import Hero from "@/components/Hero";
import HealthMetrics from "@/components/HealthMetrics";
import Goals from "@/components/Goals";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <HealthMetrics />
      <Goals />
    </div>
  );
};

export default Index;
