import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VitaminCard } from "./VitaminCard";
import { VitaminBundleCard } from "./VitaminBundleCard";
import { VitaminRecommendations } from "./VitaminRecommendations";
import { CartDrawer } from "./CartDrawer";
import { ShoppingCart, Package, Pill, Filter } from "lucide-react";

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

export const VitaminsCatalogTab = () => {
  const [vitamins, setVitamins] = useState<Vitamin[]>([]);
  const [bundles, setBundles] = useState<VitaminBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('bundles');
  const [cartOpen, setCartOpen] = useState(false);
  const { getItemCount } = useCart();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load vitamins
    const { data: vitData } = await supabase
      .from('vitamins_catalog')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (vitData) {
      setVitamins(vitData.map(v => ({
        ...v,
        dosage_options: v.dosage_options as { dosage: string; price: number }[]
      })));
    }

    // Load bundles with vitamin count
    const { data: bundleData } = await supabase
      .from('vitamin_bundles')
      .select(`*, vitamin_bundle_items(count)`)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (bundleData) {
      setBundles(bundleData.map(b => ({
        ...b,
        vitamin_count: (b.vitamin_bundle_items as any)?.[0]?.count || 0
      })));
    }

    setLoading(false);
  };

  const categories = [...new Set(vitamins.map(v => v.category))];
  const filteredVitamins = selectedCategory 
    ? vitamins.filter(v => v.category === selectedCategory)
    : vitamins;

  const formatCategory = (cat: string) => {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Custom Vitamins</h2>
          <p className="text-sm text-muted-foreground">
            Personalized supplements based on your health needs
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setCartOpen(true)}
          className="relative"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Cart
          {getItemCount() > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
              {getItemCount()}
            </Badge>
          )}
        </Button>
      </div>

      {/* AI Recommendations */}
      <VitaminRecommendations />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="bundles" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Vitamin Bundles
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <Pill className="w-4 h-4" />
            Individual Vitamins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bundles" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No vitamin bundles available</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {bundles.map(bundle => (
                <VitaminBundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
              <Filter className="w-4 h-4" />
              Filter:
            </div>
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categories.map(cat => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat)}
              >
                {formatCategory(cat)}
              </Badge>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredVitamins.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No vitamins found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredVitamins.map(vitamin => (
                <VitaminCard key={vitamin.id} vitamin={vitamin} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
};
