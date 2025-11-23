import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, X, Trash2, TestTube, Package, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, removeItem, clearCart, getTotalPrice, getTotalSavings, getItemCount } = useCart();
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
        return;
      }

      const orders = [];

      for (const item of items) {
        if (item.type === 'bundle') {
          // Create orders for each test in the bundle
          for (const testCode of item.test_codes) {
            orders.push({
              user_id: user.id,
              test_code: testCode,
              test_set_id: item.id,
              bundle_price: item.base_price,
              status: 'ordered' as const,
              ordering_context: `Ordered as part of ${item.name} bundle`
            });
          }
        } else {
          // Create order for individual test
          orders.push({
            user_id: user.id,
            test_code: item.code,
            status: 'ordered' as const,
            ordering_context: 'Individual test order'
          });
        }
      }

      const { error } = await supabase
        .from('user_test_orders')
        .insert(orders);

      if (error) throw error;

      const bundleCount = items.filter(i => i.type === 'bundle').length;
      const individualCount = items.filter(i => i.type === 'individual').length;

      toast.success("Order placed successfully!", {
        description: `${bundleCount} bundle${bundleCount !== 1 ? 's' : ''} and ${individualCount} individual test${individualCount !== 1 ? 's' : ''} ordered for $${getTotalPrice().toFixed(2)}`
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
            <p className="text-sm text-muted-foreground">Add test bundles or individual tests to get started</p>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-120px)]">
            <ScrollArea className="flex-1 pr-4 mt-6">
              <div className="space-y-4 pb-4">
                {items.map((item) => (
                  <div
                    key={item.type === 'bundle' ? item.id : item.code}
                    className="p-4 rounded-lg bg-background/60 border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {item.type === 'bundle' ? (
                            <Package className="w-4 h-4 text-primary" />
                          ) : (
                            <TestTube className="w-4 h-4 text-primary" />
                          )}
                          <h4 className="font-semibold text-foreground">
                            {item.type === 'bundle' ? item.name : item.name}
                          </h4>
                        </div>
                        
                        {item.type === 'bundle' ? (
                          <>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {item.test_count} tests
                              </Badge>
                            </div>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {item.domain}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-lg font-bold text-primary">
                          ${item.type === 'bundle' ? item.base_price : item.estimated_price}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.type === 'bundle' ? item.id : item.code)}
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
                    <span className="text-xs text-muted-foreground">vs. individual tests</span>
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
