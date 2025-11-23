import { useState } from "react";
import { GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Sparkles, ShoppingCart, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

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
  metabolic: "bg-[#12AFCB]/10 text-[#12AFCB] border-[#12AFCB]/20",
  hormonal: "bg-[#50C878]/10 text-[#50C878] border-[#50C878]/20",
  cardiovascular: "bg-[#9B59B6]/10 text-[#9B59B6] border-[#9B59B6]/20",
  performance: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
  preventive: "bg-[#14B8CC]/10 text-[#14B8CC] border-[#14B8CC]/20",
};

const priorityColors: Record<string, string> = {
  high: "bg-[#9B59B6]/10 text-[#9B59B6] border-[#9B59B6]/30",
  medium: "bg-[#50C878]/10 text-[#50C878] border-[#50C878]/30",
  low: "bg-[#12AFCB]/10 text-[#12AFCB] border-[#12AFCB]/20",
};

export const TestSetCard = ({ testSet, reasoning, priority, onOrderSuccess }: TestSetCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [testsLoaded, setTestsLoaded] = useState(false);
  const { addItem, isInCart } = useCart();
  
  const inCart = isInCart(testSet.id);

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

  const handleAddToCart = async () => {
    // Load tests if not already loaded to get test codes
    if (!testsLoaded) {
      await loadTests();
    }

    // Get test codes
    const { data: testItems } = await supabase
      .from('test_set_items')
      .select('test_code')
      .eq('test_set_id', testSet.id);

    const testCodes = testItems?.map(item => item.test_code) || [];

    addItem({
      type: 'bundle',
      id: testSet.id,
      name: testSet.name,
      description: testSet.description,
      base_price: testSet.base_price,
      test_count: testSet.test_count || tests.length || 0,
      category: testSet.category,
      test_codes: testCodes
    });

    toast.success("Added to cart!", {
      description: `${testSet.name} has been added to your cart`
    });
  };

  return (
    <GlassCard className="hover:shadow-glow-teal hover:scale-[1.02] transition-all duration-300 p-6">
      <div className="space-y-6">
        {/* Header with enhanced spacing */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-rounded text-2xl font-bold text-foreground">{testSet.name}</h3>
              {priority && (
                <Badge variant="outline" className={`${priorityColors[priority]} font-rounded text-xs px-3 py-1`}>
                  {priority} priority
                </Badge>
              )}
            </div>
            <Badge variant="outline" className={`${categoryColors[testSet.category]} font-rounded text-xs px-3 py-1 w-fit`}>
              {testSet.category}
            </Badge>
          </div>
          <div className="text-right space-y-1">
            <div className="font-rounded text-3xl font-bold text-[#12AFCB]">
              ${testSet.base_price}
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              {testSet.test_count || tests.length || "Multiple"} tests
            </div>
          </div>
        </div>

        {/* Description with better spacing */}
        <p className="text-base text-muted-foreground leading-relaxed">
          {testSet.description}
        </p>

        {/* Personalized Reasoning with glassmorphism */}
        {reasoning && (
          <div className="p-4 rounded-2xl bg-[#12AFCB]/5 border border-[#12AFCB]/20 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#12AFCB] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{reasoning}</p>
            </div>
          </div>
        )}

        {/* Recommended For Tags with improved styling */}
        <div className="flex flex-wrap gap-2">
          {testSet.recommended_for.slice(0, 3).map((rec, idx) => (
            <Badge key={idx} variant="secondary" className="font-rounded text-xs px-3 py-1.5 bg-muted/50 hover:bg-muted transition-colors">
              {rec}
            </Badge>
          ))}
        </div>

        {/* Expandable Test List */}
        <div>
          <button
            onClick={handleExpand}
            className="flex items-center gap-2 text-sm font-medium text-[#12AFCB] hover:text-[#14B8CC] transition-colors w-full group"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                Hide included tests
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                View included tests
              </>
            )}
          </button>
          
          {isExpanded && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto custom-scrollbar animate-fade-in">
              {tests.length > 0 ? (
                tests.map((test, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-[#12AFCB]/30 transition-colors">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{test.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{test.code}</div>
                    </div>
                    <Badge variant="outline" className="text-xs font-rounded bg-muted/30 text-foreground">
                      {test.domain}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-glow-pulse">
                    <p className="text-sm text-muted-foreground font-medium">Loading tests...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={inCart}
          className={`w-full font-rounded text-base py-6 rounded-2xl transition-all duration-300 ${
            inCart 
              ? 'bg-[#12AFCB]/20 text-[#12AFCB] hover:bg-[#12AFCB]/20 cursor-default border border-[#12AFCB]/30' 
              : 'bg-[#12AFCB] text-white hover:bg-[#14B8CC] hover:shadow-[0_0_40px_rgba(18,175,203,0.3)] hover:scale-[1.02]'
          }`}
        >
          {inCart ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              In Cart
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart - ${testSet.base_price}
            </>
          )}
        </Button>
      </div>
    </GlassCard>
  );
};