import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Search } from "lucide-react";
import { z } from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mealType?: 'breakfast' | 'lunch' | 'snack' | 'dinner';
}

interface MealItem {
  name: string;
  quantity: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface ProductTemplate {
  name: string;
  defaultQuantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string;
}

interface ManualProduct {
  name: string;
  quantity: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const EMPTY_MANUAL_PRODUCT: ManualProduct = {
  name: "",
  quantity: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
};

const PRODUCT_TEMPLATES: ProductTemplate[] = [
  // Proteins
  { name: "Chicken Breast", defaultQuantity: "150g", calories: 165, protein: 31, carbs: 0, fat: 3.6, category: "Proteins" },
  { name: "Salmon Fillet", defaultQuantity: "150g", calories: 280, protein: 30, carbs: 0, fat: 17, category: "Proteins" },
  { name: "Eggs", defaultQuantity: "2 large", calories: 140, protein: 12, carbs: 1, fat: 10, category: "Proteins" },
  { name: "Greek Yogurt", defaultQuantity: "170g", calories: 100, protein: 17, carbs: 6, fat: 0.7, category: "Proteins" },
  { name: "Cottage Cheese", defaultQuantity: "100g", calories: 98, protein: 11, carbs: 3, fat: 4, category: "Proteins" },
  { name: "Tuna", defaultQuantity: "100g", calories: 116, protein: 26, carbs: 0, fat: 1, category: "Proteins" },
  { name: "Beef Steak", defaultQuantity: "150g", calories: 271, protein: 26, carbs: 0, fat: 18, category: "Proteins" },
  { name: "Turkey Breast", defaultQuantity: "100g", calories: 135, protein: 30, carbs: 0, fat: 1, category: "Proteins" },
  
  // Grains & Carbs
  { name: "Brown Rice", defaultQuantity: "150g cooked", calories: 165, protein: 4, carbs: 35, fat: 1.5, category: "Grains" },
  { name: "Oatmeal", defaultQuantity: "40g dry", calories: 150, protein: 5, carbs: 27, fat: 3, category: "Grains" },
  { name: "Whole Wheat Bread", defaultQuantity: "2 slices", calories: 160, protein: 8, carbs: 28, fat: 2, category: "Grains" },
  { name: "Quinoa", defaultQuantity: "150g cooked", calories: 180, protein: 7, carbs: 32, fat: 3, category: "Grains" },
  { name: "Sweet Potato", defaultQuantity: "150g", calories: 135, protein: 2, carbs: 31, fat: 0, category: "Grains" },
  { name: "Pasta", defaultQuantity: "100g dry", calories: 350, protein: 12, carbs: 71, fat: 2, category: "Grains" },
  
  // Fruits
  { name: "Banana", defaultQuantity: "1 medium", calories: 105, protein: 1, carbs: 27, fat: 0.4, category: "Fruits" },
  { name: "Apple", defaultQuantity: "1 medium", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, category: "Fruits" },
  { name: "Blueberries", defaultQuantity: "100g", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, category: "Fruits" },
  { name: "Orange", defaultQuantity: "1 medium", calories: 62, protein: 1, carbs: 15, fat: 0.2, category: "Fruits" },
  { name: "Strawberries", defaultQuantity: "100g", calories: 32, protein: 0.7, carbs: 8, fat: 0.3, category: "Fruits" },
  { name: "Avocado", defaultQuantity: "1/2 medium", calories: 160, protein: 2, carbs: 9, fat: 15, category: "Fruits" },
  
  // Vegetables
  { name: "Broccoli", defaultQuantity: "100g", calories: 34, protein: 3, carbs: 7, fat: 0.4, category: "Vegetables" },
  { name: "Spinach", defaultQuantity: "100g", calories: 23, protein: 3, carbs: 4, fat: 0.4, category: "Vegetables" },
  { name: "Mixed Salad", defaultQuantity: "150g", calories: 25, protein: 2, carbs: 4, fat: 0.3, category: "Vegetables" },
  { name: "Tomatoes", defaultQuantity: "100g", calories: 18, protein: 1, carbs: 4, fat: 0.2, category: "Vegetables" },
  { name: "Carrots", defaultQuantity: "100g", calories: 41, protein: 1, carbs: 10, fat: 0.2, category: "Vegetables" },
  
  // Dairy & Fats
  { name: "Milk", defaultQuantity: "250ml", calories: 122, protein: 8, carbs: 12, fat: 5, category: "Dairy" },
  { name: "Cheese", defaultQuantity: "30g", calories: 113, protein: 7, carbs: 0.4, fat: 9, category: "Dairy" },
  { name: "Butter", defaultQuantity: "10g", calories: 72, protein: 0.1, carbs: 0, fat: 8, category: "Dairy" },
  { name: "Olive Oil", defaultQuantity: "1 tbsp", calories: 119, protein: 0, carbs: 0, fat: 14, category: "Dairy" },
  { name: "Almond Butter", defaultQuantity: "2 tbsp", calories: 196, protein: 7, carbs: 6, fat: 18, category: "Dairy" },
  
  // Snacks & Others
  { name: "Almonds", defaultQuantity: "30g", calories: 170, protein: 6, carbs: 6, fat: 15, category: "Snacks" },
  { name: "Protein Shake", defaultQuantity: "1 scoop", calories: 120, protein: 24, carbs: 3, fat: 1, category: "Snacks" },
  { name: "Coffee", defaultQuantity: "1 cup", calories: 2, protein: 0.3, carbs: 0, fat: 0, category: "Beverages" },
  { name: "Green Tea", defaultQuantity: "1 cup", calories: 0, protein: 0, carbs: 0, fat: 0, category: "Beverages" },
];

// Validation schema
const mealItemSchema = z.object({
  name: z.string().trim().min(1, "Food name is required").max(100, "Food name is too long"),
  quantity: z.string().trim().min(1, "Quantity is required").max(50, "Quantity is too long"),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
});

const mealSchema = z.object({
  timestamp: z.string().min(1, "Timestamp is required"),
  items: z.array(mealItemSchema).min(1, "At least one meal item is required"),
  notes: z.string().max(1000, "Notes are too long").optional(),
});

export function MealModal({ open, onOpenChange, onSuccess, mealType = 'breakfast' }: MealModalProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MealItem[]>([]);
  const [notes, setNotes] = useState("");
  const [timestamp, setTimestamp] = useState(() => new Date().toISOString().slice(0, 16));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualProduct, setManualProduct] = useState<ManualProduct>(EMPTY_MANUAL_PRODUCT);

  const categories = useMemo(() => 
    [...new Set(PRODUCT_TEMPLATES.map(p => p.category))],
    []
  );

  const filteredProducts = useMemo(() => {
    let products = PRODUCT_TEMPLATES;
    
    if (selectedCategory) {
      products = products.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }
    
    return products;
  }, [searchQuery, selectedCategory]);

  const addProductFromTemplate = (product: ProductTemplate) => {
    setItems([...items, {
      name: product.name,
      quantity: product.defaultQuantity,
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fat,
    }]);
  };

  const addManualProduct = () => {
    if (!manualProduct.name.trim() || !manualProduct.quantity.trim()) {
      toast({
        title: "Missing info",
        description: "Please enter at least name and quantity",
        variant: "destructive",
      });
      return;
    }
    setItems([...items, {
      name: manualProduct.name.trim(),
      quantity: manualProduct.quantity.trim(),
      calories: parseInt(manualProduct.calories) || 0,
      protein: parseInt(manualProduct.protein) || 0,
      carbs: parseInt(manualProduct.carbs) || 0,
      fat: parseInt(manualProduct.fat) || 0,
    }]);
    setManualProduct(EMPTY_MANUAL_PRODUCT);
    setShowManualEntry(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], quantity };
    setItems(updated);
  };

  const calculateTotals = () => {
    return items.reduce((acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fat: acc.fat + (item.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (items.length === 0) {
        throw new Error("Add at least one food item");
      }

      // Validate the meal data
      const validation = mealSchema.safeParse({
        timestamp,
        items,
        notes: notes || undefined,
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        throw new Error(firstError.message);
      }

      const totals = calculateTotals();

      const { error } = await supabase.from("meals").insert([{
        user_id: user.id,
        timestamp: new Date(timestamp).toISOString(),
        items: items as any,
        notes: notes || null,
        source: "manual" as any,
        nutrition_totals: totals,
      }]);

      if (error) throw error;

      toast({
        title: "Meal logged",
        description: "Your meal has been recorded successfully.",
      });

      onSuccess?.();
      onOpenChange(false);
      setItems([]);
      setNotes("");
      setSearchQuery("");
      setSelectedCategory(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-[#12AFCB]/20 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-rounded">
            Log {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden gap-4">
          <div className="space-y-2">
            <Label>Time</Label>
            <Input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              required
            />
          </div>

          {/* Search and Category Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    !selectedCategory 
                      ? 'bg-[#12AFCB] text-white' 
                      : 'bg-[#12AFCB]/10 text-[#12AFCB] hover:bg-[#12AFCB]/20'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-[#12AFCB] text-white' 
                        : 'bg-[#12AFCB]/10 text-[#12AFCB] hover:bg-[#12AFCB]/20'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowManualEntry(!showManualEntry)}
                className={`shrink-0 ${showManualEntry ? 'bg-accent text-accent-foreground' : ''}`}
              >
                <Plus className="w-4 h-4 mr-1" />
                Custom
              </Button>
            </div>
          </div>

          {/* Manual Entry Form */}
          {showManualEntry && (
            <div className="border rounded-xl p-3 space-y-3 bg-muted/30">
              <Label className="text-sm font-medium">Add Custom Food</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Food name *"
                  value={manualProduct.name}
                  onChange={(e) => setManualProduct({ ...manualProduct, name: e.target.value })}
                  className="col-span-2"
                />
                <Input
                  placeholder="Quantity *"
                  value={manualProduct.quantity}
                  onChange={(e) => setManualProduct({ ...manualProduct, quantity: e.target.value })}
                />
                <Input
                  placeholder="Calories"
                  type="number"
                  value={manualProduct.calories}
                  onChange={(e) => setManualProduct({ ...manualProduct, calories: e.target.value })}
                />
                <Input
                  placeholder="Protein (g)"
                  type="number"
                  value={manualProduct.protein}
                  onChange={(e) => setManualProduct({ ...manualProduct, protein: e.target.value })}
                />
                <Input
                  placeholder="Carbs (g)"
                  type="number"
                  value={manualProduct.carbs}
                  onChange={(e) => setManualProduct({ ...manualProduct, carbs: e.target.value })}
                />
                <Input
                  placeholder="Fat (g)"
                  type="number"
                  value={manualProduct.fat}
                  onChange={(e) => setManualProduct({ ...manualProduct, fat: e.target.value })}
                />
                <Button
                  type="button"
                  onClick={addManualProduct}
                  className="col-span-2"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add to Meal
                </Button>
              </div>
            </div>
          )}

          {/* Product Templates Grid */}
          <ScrollArea className="h-[140px] border rounded-xl p-2">
            <div className="grid grid-cols-2 gap-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.name}
                  type="button"
                  onClick={() => addProductFromTemplate(product)}
                  className="flex flex-col items-start p-2 rounded-lg bg-[#12AFCB]/5 hover:bg-[#12AFCB]/10 border border-[#12AFCB]/10 transition-colors text-left"
                >
                  <span className="font-medium text-sm text-foreground truncate w-full">{product.name}</span>
                  <span className="text-xs text-muted-foreground">{product.calories} cal • {product.protein}g P</span>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Selected Items */}
          {items.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Items ({items.length})</Label>
              <ScrollArea className="h-[120px] border rounded-xl p-2">
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-[#12AFCB]/5">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.calories} cal • P:{item.protein}g • C:{item.carbs}g • F:{item.fat}g
                        </p>
                      </div>
                      <Input
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(index, e.target.value)}
                        className="w-24 h-8 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeItem(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {/* Totals */}
              <div className="flex gap-3 text-xs p-2 rounded-lg bg-[#12AFCB]/10">
                <span className="font-medium">Total:</span>
                <span>{totals.calories} cal</span>
                <span>P: {totals.protein}g</span>
                <span>C: {totals.carbs}g</span>
                <span>F: {totals.fat}g</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || items.length === 0}>
              {loading ? "Saving..." : "Log Meal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
