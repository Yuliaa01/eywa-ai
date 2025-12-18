import { useState } from "react";
import { useCart, CartItem } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, X, Trash2, TestTube, Package, TrendingDown, Pill } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, removeItem, clearCart, getTotalPrice, getTotalSavings, getItemCount, getTestItems, getVitaminItems } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsCheckingOut(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to complete your order");
        setIsCheckingOut(false);
        return;
      }

      const testItems = getTestItems();
      const vitaminItems = getVitaminItems();

      // Process test orders
      if (testItems.length > 0) {
        const testOrders = [];
        for (const item of testItems) {
          if (item.type === 'bundle') {
            for (const testCode of item.test_codes) {
              testOrders.push({
                user_id: user.id,
                test_code: testCode,
                test_set_id: item.id,
                bundle_price: item.base_price,
                status: 'ordered' as const,
                ordering_context: `Ordered as part of ${item.name} bundle`
              });
            }
          } else {
            testOrders.push({
              user_id: user.id,
              test_code: item.code,
              status: 'ordered' as const,
              ordering_context: 'Individual test order'
            });
          }
        }

        if (testOrders.length > 0) {
          const { error: testError } = await supabase.from('user_test_orders').insert(testOrders);
          if (testError) throw testError;
        }
      }

      // Process vitamin orders
      if (vitaminItems.length > 0) {
        const vitaminOrders = [];
        for (const item of vitaminItems) {
          if (item.type === 'vitamin_bundle') {
            for (const vitaminId of item.vitamin_ids) {
              vitaminOrders.push({
                user_id: user.id,
                vitamin_id: vitaminId,
                bundle_id: item.id,
                quantity: 1,
                unit_price: item.base_price / item.vitamin_count,
                total_price: item.base_price / item.vitamin_count,
                status: 'ordered' as const,
                notes: `Ordered as part of ${item.name} bundle`
              });
            }
          } else {
            vitaminOrders.push({
              user_id: user.id,
              vitamin_id: item.id,
              quantity: 1,
              dosage_selected: item.dosage,
              unit_price: item.price,
              total_price: item.price,
              status: 'ordered' as const
            });
          }
        }

        if (vitaminOrders.length > 0) {
          const { error: vitError } = await supabase.from('user_vitamin_orders').insert(vitaminOrders);
          if (vitError) throw vitError;
        }
      }

      const testCount = testItems.length;
      const vitaminCount = vitaminItems.length;

      toast.success("Order placed successfully!", {
        description: `${testCount} test item${testCount !== 1 ? 's' : ''} and ${vitaminCount} vitamin item${vitaminCount !== 1 ? 's' : ''} ordered for $${getTotalPrice().toFixed(2)}`
      });

      clearCart();
      onOpenChange(false);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error("Failed to complete order. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const getItemKey = (item: CartItem): string => {
    switch (item.type) {
      case 'bundle': return `bundle-${item.id}`;
      case 'individual': return `test-${item.code}`;
      case 'vitamin': return `vitamin-${item.id}`;
      case 'vitamin_bundle': return `vitbundle-${item.id}`;
    }
  };

  const getItemRemoveId = (item: CartItem): string => {
    switch (item.type) {
      case 'bundle': return item.id;
      case 'individual': return item.code;
      case 'vitamin': return item.id;
      case 'vitamin_bundle': return item.id;
    }
  };

  const getItemPrice = (item: CartItem): number => {
    switch (item.type) {
      case 'bundle': return item.base_price;
      case 'individual': return item.estimated_price;
      case 'vitamin': return item.price;
      case 'vitamin_bundle': return item.base_price;
    }
  };

  const getItemIcon = (item: CartItem) => {
    switch (item.type) {
      case 'bundle': return <Package className="w-4 h-4 text-primary" />;
      case 'individual': return <TestTube className="w-4 h-4 text-primary" />;
      case 'vitamin': return <Pill className="w-4 h-4 text-emerald-400" />;
      case 'vitamin_bundle': return <Package className="w-4 h-4 text-emerald-400" />;
    }
  };

  const totalPrice = getTotalPrice();
  const totalSavings = getTotalSavings();
  const estimatedWithoutBundles = totalPrice + totalSavings;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart ({getItemCount()})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground">Add tests or vitamins to get started</p>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-120px)]">
            <ScrollArea className="flex-1 pr-4 mt-6">
              <div className="space-y-4 pb-4">
                {items.map((item) => (
                  <div
                    key={getItemKey(item)}
                    className="p-4 rounded-lg bg-background/60 border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getItemIcon(item)}
                          <h4 className="font-semibold text-foreground">{item.name}</h4>
                        </div>
                        
                        {(item.type === 'bundle' || item.type === 'vitamin_bundle') && (
                          <>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {item.type === 'bundle' ? `${item.test_count} tests` : `${item.vitamin_count} vitamins`}
                              </Badge>
                            </div>
                          </>
                        )}
                        
                        {item.type === 'individual' && (
                          <Badge variant="outline" className="text-xs">
                            {item.domain}
                          </Badge>
                        )}

                        {item.type === 'vitamin' && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {item.dosage}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-lg font-bold text-primary">
                          ${getItemPrice(item)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(getItemRemoveId(item))}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex-shrink-0 space-y-4 pt-4 pb-6 border-t border-border/50 bg-background">
              {totalSavings > 0 && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-medium">Bundle Savings</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs text-muted-foreground">vs. individual items</span>
                    <span className="text-lg font-bold text-emerald-300">
                      -${totalSavings.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Individual price:</span>
                    <span className="line-through text-muted-foreground">
                      ${estimatedWithoutBundles.toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-baseline py-2">
                  <span className="text-2xl font-bold text-foreground">Total:</span>
                  <span className="text-3xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="flex-1"
                  disabled={isCheckingOut}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="flex-1"
                  size="lg"
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? "Processing..." : "Checkout"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
