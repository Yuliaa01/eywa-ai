import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TestSetCard } from "./TestSetCard";
import { Sparkles, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Recommendation {
  test_set_id: string;
  reasoning: string;
  priority: "high" | "medium" | "low";
}

interface TestSet {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  recommended_for: string[];
}

export const PersonalizedRecommendations = ({ onOrderSuccess }: { onOrderSuccess?: () => void }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [testSets, setTestSets] = useState<TestSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the edge function to get personalized recommendations
      const { data: recData, error: recError } = await supabase.functions.invoke('suggest-test-sets');

      if (recError) {
        console.error('Error getting recommendations:', recError);
        setError('Unable to load personalized recommendations');
        return;
      }

      const recs = recData?.recommendations || [];
      setRecommendations(recs);

      // Fetch the test set details for the recommended sets
      if (recs.length > 0) {
        const testSetIds = recs.map((r: Recommendation) => r.test_set_id);
        
        const { data: setsData, error: setsError } = await supabase
          .from('test_sets')
          .select('*')
          .in('id', testSetIds);

        if (setsError) throw setsError;

        // Get test counts for each set
        const setsWithCounts = await Promise.all(
          (setsData || []).map(async (set) => {
            const { count } = await supabase
              .from('test_set_items')
              .select('*', { count: 'exact', head: true })
              .eq('test_set_id', set.id);
            
            return { ...set, test_count: count || 0 };
          })
        );

        setTestSets(setsWithCounts);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Recommended for You</h2>
      </div>
      
      <p className="text-muted-foreground">
        Based on your biomarkers, priorities, and health profile, we recommend these comprehensive test panels:
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {recommendations.map((rec) => {
          const testSet = testSets.find(ts => ts.id === rec.test_set_id);
          if (!testSet) return null;

          return (
            <TestSetCard
              key={rec.test_set_id}
              testSet={testSet}
              reasoning={rec.reasoning}
              priority={rec.priority}
              onOrderSuccess={onOrderSuccess}
            />
          );
        })}
      </div>
    </div>
  );
};