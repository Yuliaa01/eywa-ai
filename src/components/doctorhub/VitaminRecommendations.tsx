import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VitaminCard } from "./VitaminCard";
import { VitaminBundleCard } from "./VitaminBundleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, AlertCircle } from "lucide-react";

interface VitaminRecommendation {
  vitamin_id?: string;
  bundle_id?: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

interface Vitamin {
  id: string;
  name: string;
  description: string;
  category: string;
  form: string;
  base_price: number;
  dosage_options: { dosage: string; price: number }[];
  benefits: string[];
  suggested_for: string[];
  brand?: string;
}

interface VitaminBundle {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  recommended_for: string[];
  vitamin_count?: number;
}

export const VitaminRecommendations = () => {
  const [recommendations, setRecommendations] = useState<VitaminRecommendation[]>([]);
  const [vitamins, setVitamins] = useState<Record<string, Vitamin>>({});
  const [bundles, setBundles] = useState<Record<string, VitaminBundle>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Please sign in to see personalized recommendations");
        setLoading(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('recommend-vitamins', {
        body: {}
      });

      if (fnError) throw fnError;

      const recs = data?.recommendations || [];
      setRecommendations(recs);

      // Fetch vitamin details
      const vitaminIds = recs.filter((r: VitaminRecommendation) => r.vitamin_id).map((r: VitaminRecommendation) => r.vitamin_id);
      const bundleIds = recs.filter((r: VitaminRecommendation) => r.bundle_id).map((r: VitaminRecommendation) => r.bundle_id);

      if (vitaminIds.length > 0) {
        const { data: vitData } = await supabase
          .from('vitamins_catalog')
          .select('*')
          .in('id', vitaminIds);
        
        if (vitData) {
          const vitMap: Record<string, Vitamin> = {};
          vitData.forEach(v => {
            vitMap[v.id] = {
              ...v,
              dosage_options: v.dosage_options as { dosage: string; price: number }[]
            };
          });
          setVitamins(vitMap);
        }
      }

      if (bundleIds.length > 0) {
        const { data: bundleData } = await supabase
          .from('vitamin_bundles')
          .select(`*, vitamin_bundle_items(count)`)
          .in('id', bundleIds);
        
        if (bundleData) {
          const bundleMap: Record<string, VitaminBundle> = {};
          bundleData.forEach(b => {
            bundleMap[b.id] = {
              ...b,
              vitamin_count: (b.vitamin_bundle_items as any)?.[0]?.count || 0
            };
          });
          setBundles(bundleMap);
        }
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError("Unable to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">AI Recommendations</h3>
        </div>
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Recommended For You</h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => {
          if (rec.bundle_id && bundles[rec.bundle_id]) {
            return (
              <VitaminBundleCard
                key={`bundle-${rec.bundle_id}`}
                bundle={bundles[rec.bundle_id]}
                reasoning={rec.reasoning}
                priority={rec.priority}
              />
            );
          }
          if (rec.vitamin_id && vitamins[rec.vitamin_id]) {
            return (
              <VitaminCard
                key={`vitamin-${rec.vitamin_id}`}
                vitamin={vitamins[rec.vitamin_id]}
                reasoning={rec.reasoning}
                priority={rec.priority}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};
