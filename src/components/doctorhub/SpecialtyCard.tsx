import { useState } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Clock, Activity } from "lucide-react";
import EvidenceDrawer from "./EvidenceDrawer";

interface Specialty {
  id: string;
  name: string;
  role_group: string;
  specialty: string;
  subspecialty: string | null;
  bio_short: string | null;
  focus_areas: string[] | null;
}

interface SpecialtyCardProps {
  specialty: Specialty;
}

const getSpecialtyIcon = (specialty: string) => {
  // Return appropriate icon based on specialty
  return Activity;
};

const getSpecialtyColor = (roleGroup: string) => {
  const colors: Record<string, string> = {
    primary_care: "bg-blue-500/10 text-blue-600",
    specialist: "bg-purple-500/10 text-purple-600",
    fitness: "bg-green-500/10 text-green-600",
    longevity: "bg-[#12AFCB]/10 text-[#12AFCB]",
    mental_health: "bg-pink-500/10 text-pink-600",
  };
  return colors[roleGroup] || "bg-gray-500/10 text-gray-600";
};

export default function SpecialtyCard({ specialty }: SpecialtyCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const Icon = getSpecialtyIcon(specialty.specialty);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    // TODO: Implement analysis API call
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsDrawerOpen(true);
    }, 2000);
  };

  return (
    <>
      <GlassCard className="p-6 hover:shadow-[0_8px_40px_rgba(18,175,203,0.15)] transition-all duration-300">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getSpecialtyColor(specialty.role_group)}`}>
            <Icon className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-rounded text-lg font-semibold text-[#0E1012] mb-1">
              {specialty.name}
            </h3>
            <Badge className={`text-xs ${getSpecialtyColor(specialty.role_group)} border-0`}>
              {specialty.specialty.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        {/* Bio */}
        {specialty.bio_short && (
          <p className="text-sm text-[#5A6B7F] mb-4 line-clamp-2">
            {specialty.bio_short}
          </p>
        )}

        {/* Status Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="text-xs bg-white/60 border-[#12AFCB]/10">
            <Clock className="w-3 h-3 mr-1" />
            Updated 2d ago
          </Badge>
          <Badge variant="outline" className="text-xs bg-white/60 border-[#12AFCB]/10">
            4 actions
          </Badge>
        </div>

        {/* Focus Areas */}
        {specialty.focus_areas && specialty.focus_areas.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-[#5A6B7F] mb-2">Focus Areas:</p>
            <div className="flex flex-wrap gap-1">
              {specialty.focus_areas.slice(0, 3).map((area, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-[#12AFCB]/5 text-[#12AFCB]">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:opacity-90 transition-all"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDrawerOpen(true)}
            className="rounded-xl border-[#12AFCB]/20 hover:bg-[#12AFCB]/5"
          >
            View
          </Button>
        </div>
      </GlassCard>

      <EvidenceDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        specialty={specialty}
      />
    </>
  );
}
