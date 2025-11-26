import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PinnedMetric {
  metric_category: string;
  metric_title: string;
}

export const usePinnedMetrics = () => {
  const [pinnedMetrics, setPinnedMetrics] = useState<PinnedMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPinnedMetrics();
  }, []);

  const fetchPinnedMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pinned_metrics')
        .select('metric_category, metric_title')
        .eq('user_id', user.id);

      if (error) throw error;
      setPinnedMetrics(data || []);
    } catch (error) {
      console.error('Error fetching pinned metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPinned = (category: string, title: string): boolean => {
    return pinnedMetrics.some(
      (m) => m.metric_category === category && m.metric_title === title
    );
  };

  const togglePin = async (category: string, title: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to pin metrics",
          variant: "destructive",
        });
        return;
      }

      const pinned = isPinned(category, title);

      if (pinned) {
        // Unpin
        const { error } = await supabase
          .from('pinned_metrics')
          .delete()
          .eq('user_id', user.id)
          .eq('metric_category', category)
          .eq('metric_title', title);

        if (error) throw error;

        setPinnedMetrics((prev) =>
          prev.filter(
            (m) => !(m.metric_category === category && m.metric_title === title)
          )
        );

        toast({
          title: "Metric unpinned",
          description: `${title} removed from pinned metrics`,
        });
      } else {
        // Pin
        const { error } = await supabase
          .from('pinned_metrics')
          .insert({
            user_id: user.id,
            metric_category: category,
            metric_title: title,
          });

        if (error) throw error;

        setPinnedMetrics((prev) => [
          ...prev,
          { metric_category: category, metric_title: title },
        ]);

        toast({
          title: "Metric pinned",
          description: `${title} added to pinned metrics`,
        });
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Error",
        description: "Failed to update pinned metric",
        variant: "destructive",
      });
    }
  };

  return {
    pinnedMetrics,
    loading,
    isPinned,
    togglePin,
    refetch: fetchPinnedMetrics,
  };
};
