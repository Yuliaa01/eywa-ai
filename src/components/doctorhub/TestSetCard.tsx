import { useState } from "react";
import { GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestSetCardProps {
  testSet: {
    id: string;
    name: string;
    description: string;
    category: string;
    base_price: number;
    recommended_for: string[];
    test_count?: number;
  };
  reasoning?: string;
  priority?: "high" | "medium" | "low";
  onOrderSuccess?: () => void;
}

const categoryColors: Record<string, string> = {
  metabolic: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  hormonal: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  cardiovascular: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  performance: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  preventive: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const priorityColors: Record<string, string> = {
  high: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export const TestSetCard = ({ testSet, reasoning, priority, onOrderSuccess }: TestSetCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [testsLoaded, setTestsLoaded] = useState(false);

  const loadTests = async () => {
    if (testsLoaded) return;
    
    try {
      const { data: testItems, error: itemsError } = await supabase
        .from('test_set_items')
        .select('test_code')
        .eq('test_set_id', testSet.id);

      if (itemsError) throw itemsError;

      const testCodes = testItems?.map(item => item.test_code) || [];
      
      if (testCodes.length > 0) {
        const { data: testDetails, error: detailsError } = await supabase
          .from('tests_catalog')
          .select('code, name, domain')
          .in('code', testCodes);

        if (detailsError) throw detailsError;
        setTests(testDetails || []);
      }
      
      setTestsLoaded(true);
    } catch (error) {
      console.error('Error loading tests:', error);
    }
  };

  const handleExpand = () => {
    if (!isExpanded) {
      loadTests();
    }
    setIsExpanded(!isExpanded);
  };

  const handleOrder = async () => {
    setIsOrdering(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to order tests");
        return;
      }

      // Load tests if not already loaded
      if (!testsLoaded) {
        await loadTests();
      }

      // Get test codes
      const { data: testItems, error: itemsError } = await supabase
        .from('test_set_items')
        .select('test_code')
        .eq('test_set_id', testSet.id);

      if (itemsError) throw itemsError;

      const testCodes = testItems?.map(item => item.test_code) || [];

      // Create orders for each test in the set
      const orders = testCodes.map(code => ({
        user_id: user.id,
        test_code: code,
        test_set_id: testSet.id,
        bundle_price: testSet.base_price,
        status: 'ordered' as const,
        ordering_context: `Ordered as part of ${testSet.name}`,
      }));

      const { error: orderError } = await supabase
        .from('user_test_orders')
        .insert(orders);

      if (orderError) throw orderError;

      toast.success(`Successfully ordered ${testSet.name}!`, {
        description: `${testCodes.length} tests ordered for $${testSet.base_price}`,
      });

      onOrderSuccess?.();
    } catch (error) {
      console.error('Error ordering test set:', error);
      toast.error("Failed to order test set. Please try again.");
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <GlassCard className="hover:bg-background/60 transition-all duration-300">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground">{testSet.name}</h3>
              {priority && (
                <Badge variant="outline" className={priorityColors[priority]}>
                  {priority} priority
                </Badge>
              )}
            </div>
            <Badge variant="outline" className={categoryColors[testSet.category]}>
              {testSet.category}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">${testSet.base_price}</div>
            <div className="text-sm text-muted-foreground">
              {testSet.test_count || tests.length || "Multiple"} tests
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {testSet.description}
        </p>

        {/* Personalized Reasoning */}
        {reasoning && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{reasoning}</p>
            </div>
          </div>
        )}

        {/* Recommended For Tags */}
        <div className="flex flex-wrap gap-2">
          {testSet.recommended_for.slice(0, 3).map((rec, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {rec}
            </Badge>
          ))}
        </div>

        {/* Expandable Test List */}
        <div>
          <button
            onClick={handleExpand}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors w-full"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide included tests
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                View included tests
              </>
            )}
          </button>
          
          {isExpanded && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {tests.length > 0 ? (
                tests.map((test, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-background/40">
                    <div>
                      <div className="text-sm font-medium text-foreground">{test.name}</div>
                      <div className="text-xs text-muted-foreground">{test.code}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {test.domain}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading tests...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Order Button */}
        <Button
          onClick={handleOrder}
          disabled={isOrdering}
          className="w-full"
          size="lg"
        >
          {isOrdering ? "Ordering..." : `Order Now - $${testSet.base_price}`}
        </Button>
      </div>
    </GlassCard>
  );
};