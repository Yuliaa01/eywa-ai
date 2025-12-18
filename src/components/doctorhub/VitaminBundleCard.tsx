import { useState, useEffect } from "react";
import { GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Package, Check, ShoppingCart, ChevronDown, ChevronUp, Sparkles, Pill } from "lucide-react";
import { toast } from "sonner";

interface VitaminBundleCardProps {
  bundle: {
    id: string;
    name: string;
    description: string;
    category: string;
    base_price: number;
    recommended_for: string[];
    vitamin_count?: number;
  };
  reasoning?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface BundleVitamin {
  id: string;
  name: string;
  category: string;
  dosage_selected: string;
}

const categoryColors: Record<string, string> = {
  energy: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  immune: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  stress: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  cardiovascular: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  general: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/20 text-red-300 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  low: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

export const VitaminBundleCard = ({ bundle, reasoning, priority }: VitaminBundleCardProps) => {
  const { addItem, isInCart } = useCart();
  const [isExpanded, setIsExpanded] = useState(false);
  const [vitamins, setVitamins] = useState<BundleVitamin[]>([]);
  const [vitaminsLoaded, setVitaminsLoaded] = useState(false);

  const inCart = isInCart(bundle.id);

  useEffect(() => {
    if (isExpanded && !vitaminsLoaded) {
      loadBundleVitamins();
    }
  }, [isExpanded]);

  const loadBundleVitamins = async () => {
    const { data, error } = await supabase
      .from('vitamin_bundle_items')
      .select(`
        dosage_selected,
        vitamin_id,
        vitamins_catalog (
          id,
          name,
          category
        )
      `)
      .eq('bundle_id', bundle.id);

    if (!error && data) {
      const vitaminsList = data
        .filter(item => item.vitamins_catalog)
        .map(item => ({
          id: (item.vitamins_catalog as any).id,
          name: (item.vitamins_catalog as any).name,
          category: (item.vitamins_catalog as any).category,
          dosage_selected: item.dosage_selected || ''
        }));
      setVitamins(vitaminsList);
      setVitaminsLoaded(true);
    }
  };

  const handleAddToCart = async () => {
    if (inCart) return;

    // Load vitamin IDs if not already loaded
    let vitaminIds = vitamins.map(v => v.id);
    if (vitaminIds.length === 0) {
      const { data } = await supabase
        .from('vitamin_bundle_items')
        .select('vitamin_id')
        .eq('bundle_id', bundle.id);
      
      if (data) {
        vitaminIds = data.map(item => item.vitamin_id);
      }
    }

    addItem({
      type: 'vitamin_bundle',
      id: bundle.id,
      name: bundle.name,
      description: bundle.description,
      category: bundle.category,
      base_price: bundle.base_price,
      vitamin_count: bundle.vitamin_count || vitaminIds.length,
      vitamin_ids: vitaminIds
    });

    toast.success(`${bundle.name} bundle added to cart`, {
      description: `${vitaminIds.length} vitamins - $${bundle.base_price}`
    });
  };

  const formatCategory = (cat: string) => {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <GlassCard className="p-4 transition-all duration-300 hover:scale-[1.01]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground">{bundle.name}</h4>
            {priority && (
              <Badge className={`${priorityColors[priority]} text-xs`}>
                {priority} priority
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {bundle.description}
          </p>

          {reasoning && (
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 mb-3">
              <p className="text-xs text-primary/80 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{reasoning}</span>
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            <Badge variant="outline" className={categoryColors[bundle.category] || 'bg-muted'}>
              {formatCategory(bundle.category)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {bundle.vitamin_count || '?'} vitamins included
            </Badge>
          </div>

          {bundle.recommended_for.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {bundle.recommended_for.slice(0, 3).map((rec, idx) => (
                <span key={idx} className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  {rec}
                </span>
              ))}
            </div>
          )}

          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Hide vitamins
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    View included vitamins
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="p-3 rounded-lg bg-background/60 border border-border/50 space-y-2">
                {vitamins.map((vitamin) => (
                  <div key={vitamin.id} className="flex items-center gap-2 text-xs">
                    <Pill className="w-3 h-3 text-primary" />
                    <span className="text-foreground">{vitamin.name}</span>
                    {vitamin.dosage_selected && (
                      <span className="text-muted-foreground">({vitamin.dosage_selected})</span>
                    )}
                  </div>
                ))}
                {!vitaminsLoaded && (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="flex flex-col items-end gap-3 min-w-[120px]">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              ${bundle.base_price}
            </div>
            <div className="text-xs text-muted-foreground">
              Save vs. individual
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={inCart}
            className={`w-full ${inCart ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}
          >
            {inCart ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                In Cart
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-1" />
                Add Bundle
              </>
            )}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};
