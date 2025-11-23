import { useState, useEffect } from "react";
import { GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestTube, Calendar, ShoppingCart, Check } from "lucide-react";
import { PersonalizedRecommendations } from "./PersonalizedRecommendations";
import { TestSetCard } from "./TestSetCard";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { CartDrawer } from "./CartDrawer";

interface Test {
  id: string;
  code: string;
  name: string;
  domain: string;
  analyte_type: string;
  suggested_cadence: string | null;
  primary_purpose: string | null;
  units: string | null;
}

const TestsOrdersTab = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [testSets, setTestSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("bundles");
  const [cartOpen, setCartOpen] = useState(false);
  const { addItem, isInCart, getItemCount } = useCart();

  const loadTests = async () => {
    try {
      const { data, error } = await supabase
        .from('tests_catalog')
        .select('*')
        .order('domain', { ascending: true });

      if (error) {
        console.error('Error loading tests:', error);
        return;
      }

      setTests(data || []);
    } catch (error) {
      console.error('Error in loadTests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTestSets = async () => {
    try {
      const { data, error } = await supabase
        .from('test_sets')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('Error loading test sets:', error);
        return;
      }

      // Get test counts for each set
      const setsWithCounts = await Promise.all(
        (data || []).map(async (set) => {
          const { count } = await supabase
            .from('test_set_items')
            .select('*', { count: 'exact', head: true })
            .eq('test_set_id', set.id);
          
          return { ...set, test_count: count || 0 };
        })
      );

      setTestSets(setsWithCounts);
    } catch (error) {
      console.error('Error in loadTestSets:', error);
    }
  };

  useEffect(() => {
    loadTests();
    loadTestSets();
  }, []);

  const uniqueDomains = Array.from(new Set(tests.map(t => t.domain)));
  const filteredTests = selectedDomain === "all" 
    ? tests 
    : tests.filter(t => t.domain === selectedDomain);

  const handleAddIndividualTest = (test: Test) => {
    addItem({
      type: 'individual',
      code: test.code,
      name: test.name,
      domain: test.domain,
      estimated_price: 45 // Average test price
    });
    
    toast.success("Added to cart!", {
      description: `${test.name} has been added to your cart`
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Tests & Orders</h1>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCartOpen(true)}
          className="relative"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Cart
          {getItemCount() > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center">
              {getItemCount()}
            </Badge>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="bundles">Test Bundles</TabsTrigger>
          <TabsTrigger value="individual">Individual Tests</TabsTrigger>
        </TabsList>

      {/* Test Bundles Tab */}
      <TabsContent value="bundles" className="space-y-6">
        <PersonalizedRecommendations onOrderSuccess={() => loadTestSets()} />

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">All Test Bundles</h2>
          <p className="text-muted-foreground mb-6">
            Comprehensive test panels designed for specific health goals. Save time and money with curated bundles.
          </p>
          
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <GlassCard key={i}>
                  <Skeleton className="h-[400px]" />
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {testSets.map((set) => (
                <TestSetCard
                  key={set.id}
                  testSet={set}
                  onOrderSuccess={() => loadTestSets()}
                />
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      {/* Individual Tests Tab */}
      <TabsContent value="individual" className="space-y-6">
        {/* Domain Filter */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedDomain === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedDomain("all")}
          >
            All Tests
          </Badge>
          {uniqueDomains.map((domain) => (
            <Badge
              key={domain}
              variant={selectedDomain === domain ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedDomain(domain)}
            >
              {domain}
            </Badge>
          ))}
        </div>

        {/* Tests Grid */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <GlassCard key={i}>
                <Skeleton className="h-24" />
              </GlassCard>
            ))}
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No tests found for the selected domain.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTests.map((test) => (
              <GlassCard key={test.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TestTube className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">
                          {test.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">Code: {test.code}</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleAddIndividualTest(test)}
                        disabled={isInCart(test.code)}
                      >
                        {isInCart(test.code) ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            In Cart
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {test.domain}
                      </Badge>
                      {test.suggested_cadence && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {test.suggested_cadence}
                        </Badge>
                      )}
                    </div>
                    {test.primary_purpose && (
                      <p className="text-xs text-muted-foreground mt-2">{test.primary_purpose}</p>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>

    <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
};

export default TestsOrdersTab;