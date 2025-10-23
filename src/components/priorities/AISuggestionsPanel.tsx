import { useEffect, useState } from "react";
import { TrendingUp, Activity, Utensils, Moon, Heart, Brain, Stethoscope, ChevronRight, Check, X, Sparkles } from "lucide-react";
import { fetchTodaySuggestions, completeSuggestion, dismissSuggestion, generateSuggestions, AISuggestion } from "@/api/ai-suggestions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const categoryIcons = {
  movement: Activity,
  nutrition: Utensils,
  sleep: Moon,
  recovery: Heart,
  mindset: Brain,
  medical: Stethoscope,
};

const categoryColors = {
  movement: "text-blue-500",
  nutrition: "text-green-500",
  sleep: "text-purple-500",
  recovery: "text-pink-500",
  mindset: "text-amber-500",
  medical: "text-red-500",
};

export function AISuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const data = await fetchTodaySuggestions();
      setSuggestions(data.slice(0, 3)); // Show top 3
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string, title: string) => {
    try {
      await completeSuggestion(id);
      setSuggestions(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Suggestion completed",
        description: `"${title}" marked as done`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete suggestion",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissSuggestion(id);
      setSuggestions(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Suggestion dismissed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss suggestion",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateSuggestions();
      toast({
        title: "Suggestions generated",
        description: "AI has created personalized suggestions for you",
      });
      await loadSuggestions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate suggestions",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-[#12AFCB]/10 to-[#19D0E4]/5 backdrop-blur-xl border border-[#12AFCB]/20 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.1)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12AFCB] to-[#19D0E4] flex items-center justify-center animate-glow-pulse">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">
            AI Daily Suggestions
          </h3>
        </div>
        <p className="text-sm text-[#5A6B7F]">Loading suggestions...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-[#12AFCB]/10 to-[#19D0E4]/5 backdrop-blur-xl border border-[#12AFCB]/20 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.1)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12AFCB] to-[#19D0E4] flex items-center justify-center animate-glow-pulse">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">
              AI Daily Suggestions
            </h3>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] hover:opacity-90"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? "Generating..." : "Generate"}
          </Button>
        </div>
        <p className="text-sm text-[#5A6B7F]">
          Click Generate to get AI-powered suggestions based on your goals and health data.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#12AFCB]/10 to-[#19D0E4]/5 backdrop-blur-xl border border-[#12AFCB]/20 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.1)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12AFCB] to-[#19D0E4] flex items-center justify-center animate-glow-pulse">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">
            AI Daily Suggestions
          </h3>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          variant="ghost"
          size="sm"
          className="text-[#12AFCB] hover:text-[#19D0E4] hover:bg-[#12AFCB]/10"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const CategoryIcon = categoryIcons[suggestion.category];
          const colorClass = categoryColors[suggestion.category];

          return (
            <div
              key={suggestion.id}
              className="group p-4 rounded-xl bg-white/60 border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all"
            >
              <div className="flex items-start gap-3">
                <CategoryIcon className={`w-5 h-5 mt-0.5 ${colorClass}`} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#0E1012] font-rounded font-medium mb-1">
                    {suggestion.title}
                  </h4>
                  {suggestion.reasoning && (
                    <p className="text-sm text-[#5A6B7F] line-clamp-2">
                      {suggestion.reasoning}
                    </p>
                  )}
                  {suggestion.duration_min && (
                    <p className="text-xs text-[#5A6B7F] mt-1">
                      ~{suggestion.duration_min} min
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleComplete(suggestion.id, suggestion.title)}
                    className="h-8 w-8 rounded-lg hover:bg-green-50 hover:text-green-600"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDismiss(suggestion.id)}
                    className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-5 h-5 text-[#5A6B7F] group-hover:text-[#12AFCB] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
